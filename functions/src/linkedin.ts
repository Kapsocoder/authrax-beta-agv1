
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

// Configuration - These should be set via firebase functions:config:set
// linkedin.client_id
// linkedin.client_secret
// linkedin.redirect_uri
const LIST_SCOPES = ["openid", "profile", "email", "w_member_social"];

export const getLinkedInAuthUrl = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }

    const clientId = functions.config().linkedin?.client_id;
    // const redirectUriConfig = functions.config().linkedin?.redirect_uri; // Deprecated in favor of dynamic
    const clientRedirectUri = data.redirectUri;

    if (!clientId || !clientRedirectUri) {
        throw new functions.https.HttpsError("failed-precondition", "LinkedIn configuration missing or invalid redirect URI.");
    }

    // Security: Validate the redirect URI matches our allowed domains
    const allowedDomains = ["localhost", "authrax-beta-lv1.web.app", "authrax-beta-lv1.firebaseapp.com", "authrax.com", "www.authrax.com"];
    const matchesAllowed = allowedDomains.some(domain => clientRedirectUri.includes(domain));

    if (!matchesAllowed) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid redirect URI domain.");
    }

    const state = context.auth.uid; // Simple state protection using UID (production should use random string + store)
    const scopeString = encodeURIComponent(LIST_SCOPES.join(" "));
    const redirectEncoded = encodeURIComponent(clientRedirectUri);

    const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectEncoded}&state=${state}&scope=${scopeString}`;

    return { url };
});

export const handleLinkedInCallback = functions.https.onCall(async (data, context) => {
    // Note: This function is called from the frontend AFTER the redirect returns with a code.
    // The frontend passes the code here to be exchanged on the server side (security best practice).

    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }

    const { code, redirectUri } = data;
    const clientId = functions.config().linkedin?.client_id;
    const clientSecret = functions.config().linkedin?.client_secret;

    if (!clientId || !clientSecret) {
        throw new functions.https.HttpsError("failed-precondition", "LinkedIn configuration missing.");
    }

    try {
        // Exchange code for Access Token
        const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: redirectUri, // Must match original
                client_id: clientId,
                client_secret: clientSecret
            })
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error("LinkedIn Token Exchange Error:", errorText);
            throw new Error("Failed to exchange token with LinkedIn");
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        const expiresIn = tokenData.expires_in; // seconds

        // Fetch Basic Profile Data
        const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
            headers: { "Authorization": `Bearer ${accessToken}` }
        });

        if (!profileResponse.ok) {
            throw new Error("Failed to fetch user profile");
        }

        const profileData = await profileResponse.json();

        // Store in Firestore
        const userId = context.auth.uid;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + (expiresIn * 1000));

        await db.doc(`users/${userId}/integrations/linkedin`).set({
            accessToken: accessToken, // Consider encrypting this in production or using Secret Manager
            expiresAt: expiresAt.toISOString(),
            connectedAt: now.toISOString(),
            linkedinId: profileData.sub,
            name: profileData.name,
            email: profileData.email,
            picture: profileData.picture,
            raw_profile: profileData
        });

        // Update User Profile if empty
        const userRef = db.doc(`users/${userId}`);
        const userDoc = await userRef.get();
        const userData = userDoc.data();

        if (userData && !userData.displayName) {
            await userRef.update({ displayName: profileData.name });
        }
        // Note: We don't overwrite photoURL automatically to avoid jarring changes, 
        // unless we want to enforce it.

        return { success: true, profile: profileData };

    } catch (error: any) {
        console.error("LinkedIn Handler Error:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});

export const publishToLinkedIn = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }

    const { content, visibility = "PUBLIC", mediaUrls = [] } = data;

    if (!content) {
        throw new functions.https.HttpsError("invalid-argument", "Post content is required.");
    }

    const userId = context.auth.uid;
    const integrationDoc = await db.doc(`users/${userId}/integrations/linkedin`).get();

    if (!integrationDoc.exists) {
        throw new functions.https.HttpsError("failed-precondition", "User is not connected to LinkedIn.");
    }

    const integrationData = integrationDoc.data();
    const accessToken = integrationData?.accessToken;
    const linkedinId = integrationData?.linkedinId;

    if (!accessToken || !linkedinId) {
        throw new functions.https.HttpsError("failed-precondition", "LinkedIn connection is invalid.");
    }

    let requestBody: any = {
        "author": `urn:li:person:${linkedinId}`,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {
                    "text": content
                },
                "shareMediaCategory": "NONE"
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": visibility
        }
    };

    // --- Image Upload Logic ---
    // If media present, upload first image (MVP: single image support)
    if (mediaUrls && mediaUrls.length > 0) {
        const imageUrl = mediaUrls[0]; // Take first image
        console.log("Processing media upload:", imageUrl);

        try {
            // Step 1: Register Upload
            const registerResponse = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "registerUploadRequest": {
                        "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
                        "owner": `urn:li:person:${linkedinId}`,
                        "serviceRelationships": [{
                            "relationshipType": "OWNER",
                            "identifier": "urn:li:userGeneratedContent"
                        }]
                    }
                })
            });

            if (!registerResponse.ok) {
                const errText = await registerResponse.text();
                throw new Error(`Failed to register upload: ${errText}`);
            }

            const registerData = await registerResponse.json();
            const uploadUrl = registerData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
            const assetUrn = registerData.value.asset;

            // Step 2: Upload Binary
            // Fetch the image from the public URL (or signed URL) provided
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) throw new Error("Failed to download image from source URL");
            const imageBlob = await imageResponse.arrayBuffer();

            const uploadResponse = await fetch(uploadUrl, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${accessToken}`, // Usually required
                    "Content-Type": "image/png", // Or detect mimetype, but png/jpeg usually fine
                },
                body: Buffer.from(imageBlob)
            });

            if (!uploadResponse.ok) {
                const errText = await uploadResponse.text();
                throw new Error(`Failed to upload image binary: ${uploadResponse.status} ${errText}`);
            }

            console.log("Image uploaded successfully. Asset URN:", assetUrn);

            // Step 3: Update Request Body
            requestBody.specificContent["com.linkedin.ugc.ShareContent"].shareMediaCategory = "IMAGE";
            requestBody.specificContent["com.linkedin.ugc.ShareContent"].media = [
                {
                    "status": "READY",
                    "description": { "text": "Image" }, // Optional
                    "media": assetUrn,
                    "title": { "text": "Shared Media" } // Optional
                }
            ];

        } catch (uploadError: any) {
            console.error("Media Upload Failed:", uploadError);
            // Fallback to text only? Or fail? let's fail to let user know.
            throw new functions.https.HttpsError("internal", `Media upload failed: ${uploadError.message}`);
        }
    }

    try {
        const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0"
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("LinkedIn Publish Error:", errorText);
            throw new Error(`Failed to publish to LinkedIn: ${response.statusText}`);
        }

        const responseData = await response.json();

        // Log success
        console.log(`Successfully published post ${responseData.id} for user ${userId}`);

        return { success: true, postId: responseData.id };

    } catch (error: any) {
        console.error("LinkedIn Publish Function Error:", error);
        throw new functions.https.HttpsError("internal", error.message || "Failed to publish post.");
    }
});

export const getPostAnalytics = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }

    const { postIds } = data; // content is a list of URNs (e.g. "urn:li:share:123", "urn:li:ugcPost:456")

    if (!postIds || !Array.isArray(postIds)) {
        throw new functions.https.HttpsError("invalid-argument", "postIds must be an array of URN strings.");
    }

    const userId = context.auth.uid;
    const integrationDoc = await db.doc(`users/${userId}/integrations/linkedin`).get();

    if (!integrationDoc.exists) {
        throw new functions.https.HttpsError("failed-precondition", "User not connected to LinkedIn.");
    }

    const accessToken = integrationDoc.data()?.accessToken;

    if (!accessToken) {
        throw new functions.https.HttpsError("failed-precondition", "Invalid LinkedIn token.");
    }

    const stats: Record<string, any> = {};

    // LinkedIn doesn't have a reliable batch endpoint for social actions on mixed URN types (ugc vs share)
    // accessible easily via standard scopes without complex varying params. 
    // We will do parallel fetches for now (limited batch size recommended in production).

    // Limit to 20 posts to avoid timeout
    const targetPosts = postIds.slice(0, 20);

    await Promise.all(targetPosts.map(async (urn) => {
        try {
            // Getting social actions (likes, comments)
            // https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/social-action-notifications-api
            // Endpoint: https://api.linkedin.com/v2/socialActions/{shareUrn|ugcPostUrn}

            const response = await fetch(`https://api.linkedin.com/v2/socialActions/${encodeURIComponent(urn)}`, {
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                stats[urn] = {
                    likes: data.likesSummary?.totalLikes || 0,
                    comments: data.commentsSummary?.totalComments || 0,
                    // Shares not always available in this endpoint, depends on URN type
                };
            } else {
                console.warn(`Failed to fetch stats for ${urn}: ${response.status}`);
                stats[urn] = { error: response.statusText };
            }

        } catch (e: any) {
            console.error(`Error fetching stats for ${urn}`, e);
            stats[urn] = { error: e.message };
        }
    }));

    return { stats };
});
