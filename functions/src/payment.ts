import * as functions from "firebase-functions";
import Stripe from 'stripe';
import { db, STRIPE_PRICE_ID, STRIPE_SECRET_KEY, WEBHOOK_SECRET } from './firebase';

const stripe = new Stripe(STRIPE_SECRET_KEY || 'dummy_key', {
    apiVersion: '2022-11-15' as any,
});

export const createStripeCheckoutSession = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Auth required");

    if (!STRIPE_SECRET_KEY || STRIPE_SECRET_KEY === 'dummy_key') {
        throw new functions.https.HttpsError("failed-precondition", "Stripe not configured (missing secret_key)");
    }
    if (!STRIPE_PRICE_ID) {
        throw new functions.https.HttpsError("failed-precondition", "Stripe not configured (missing price_id)");
    }

    const priceId = STRIPE_PRICE_ID;
    const userId = context.auth.uid;
    const userEmail = context.auth.token.email;

    try {
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            customer_email: userEmail,
            subscription_data: {
                trial_period_days: 10
            },
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${data.origin || 'http://localhost:5173'}/?payment=success`,
            cancel_url: `${data.origin || 'http://localhost:5173'}/?payment=cancelled`,
            metadata: {
                userId: userId
            }
        });

        return { url: session.url };
    } catch (error: any) {
        console.error("Stripe Checkout Error:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});

export const handleStripeWebhook = functions.https.onRequest(async (req, res) => {
    const signature = req.headers['stripe-signature'];

    if (!WEBHOOK_SECRET) {
        console.error("Stripe Webhook Secret missing");
        res.status(500).send("Configuration Error");
        return;
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.rawBody,
            signature as string,
            WEBHOOK_SECRET
        );
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.userId;
            const customerId = session.customer as string;

            if (userId) {
                await db.doc(`users/${userId}`).set({
                    subscription_tier: 'pro',
                    stripe_customer_id: customerId,
                    subscription_status: 'active',
                    subscription_updated_at: new Date().toISOString()
                }, { merge: true });
            }
        } else if (event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;
            const snapshot = await db.collection('users').where('stripe_customer_id', '==', customerId).get();
            if (!snapshot.empty) {
                snapshot.forEach(async doc => {
                    await doc.ref.update({
                        subscription_tier: 'free',
                        subscription_status: 'canceled',
                        subscription_updated_at: new Date().toISOString()
                    });
                });
            }
        }

        res.json({ received: true });
    } catch (error) {
        console.error("Error processing webhook:", error);
        res.status(500).send("Processing Error");
    }
});
