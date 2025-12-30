"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStripeWebhook = exports.createStripeCheckoutSession = void 0;
const functions = __importStar(require("firebase-functions"));
const stripe_1 = __importDefault(require("stripe"));
const firebase_1 = require("./firebase");
const stripe = new stripe_1.default(firebase_1.STRIPE_SECRET_KEY || 'dummy_key', {
    apiVersion: '2022-11-15',
});
exports.createStripeCheckoutSession = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError("unauthenticated", "Auth required");
    if (!firebase_1.STRIPE_SECRET_KEY || firebase_1.STRIPE_SECRET_KEY === 'dummy_key') {
        throw new functions.https.HttpsError("failed-precondition", "Stripe not configured (missing secret_key)");
    }
    if (!firebase_1.STRIPE_PRICE_ID) {
        throw new functions.https.HttpsError("failed-precondition", "Stripe not configured (missing price_id)");
    }
    const priceId = firebase_1.STRIPE_PRICE_ID;
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
    }
    catch (error) {
        console.error("Stripe Checkout Error:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
exports.handleStripeWebhook = functions.https.onRequest(async (req, res) => {
    var _a;
    const signature = req.headers['stripe-signature'];
    if (!firebase_1.WEBHOOK_SECRET) {
        console.error("Stripe Webhook Secret missing");
        res.status(500).send("Configuration Error");
        return;
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, signature, firebase_1.WEBHOOK_SECRET);
    }
    catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const userId = (_a = session.metadata) === null || _a === void 0 ? void 0 : _a.userId;
            const customerId = session.customer;
            if (userId) {
                await firebase_1.db.doc(`users/${userId}`).set({
                    subscription_tier: 'pro',
                    stripe_customer_id: customerId,
                    subscription_status: 'active',
                    subscription_updated_at: new Date().toISOString()
                }, { merge: true });
            }
        }
        else if (event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object;
            const customerId = subscription.customer;
            const snapshot = await firebase_1.db.collection('users').where('stripe_customer_id', '==', customerId).get();
            if (!snapshot.empty) {
                snapshot.forEach(async (doc) => {
                    await doc.ref.update({
                        subscription_tier: 'free',
                        subscription_status: 'canceled',
                        subscription_updated_at: new Date().toISOString()
                    });
                });
            }
        }
        res.json({ received: true });
    }
    catch (error) {
        console.error("Error processing webhook:", error);
        res.status(500).send("Processing Error");
    }
});
//# sourceMappingURL=payment.js.map