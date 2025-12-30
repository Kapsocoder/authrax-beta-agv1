import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Interface for the 4-Layer Voice Profile
interface VoiceProfileLayered {
    expression_layer: {
        primary_tone: string;
        secondary_tone: string;
        sentence_style: string;
        emoji_policy: string;
        formatting_habits: any[];
    };
    belief_layer: {
        core_beliefs_list: Array<{
            trait: string;
            rationale: string;
            evidence: string;
        }>;
        moral_posture: string;
    };
    judgement_layer: {
        supports: string[];
        opposes: string[];
        disliked_styles: string[];
    };
    governance_layer: {
        forbidden_zones: string[];
        hard_constraints: string[];
    };
}

interface VoiceProfileDocument extends VoiceProfileLayered {
    isActive: boolean;
    version: number;
    createdAt: admin.firestore.Timestamp;
    archivedAt?: admin.firestore.Timestamp;
    source: 'analysis' | 'manual_edit';
}

/**
 * Handle incoming webhook from n8n with Voice Analysis results.
 * 
 * Expected Payload Structure (n8n default array or single object):
 * [
 *   {
 *     "body": {
 *       "user_id": "UID..."
 *     },
 *     "output": "```json\n{ ... analysis data ... }\n```" 
 *   }
 * ]
 */
export const handleVoiceAnalysisResult = functions.runWith({
    timeoutSeconds: 60,
    memory: "256MB" // Lightweight function
}).https.onRequest(async (req, res) => {
    // 1. CORS & Preflight
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, x-webhook-secret');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    try {
        console.log(`[VoiceAnalysis] Received webhook. Body type: ${typeof req.body}`);

        // 2. Validate Secret (Optional but recommended - can be set in ENV later)
        // const secret = req.headers['x-webhook-secret'];
        // if (secret !== process.env.N8N_WEBHOOK_SECRET) { ... }

        // 3. Extract Payload
        // Handle n8n's tendency to send an array of items or a single object
        let item;
        if (Array.isArray(req.body) && req.body.length > 0) {
            item = req.body[0];
        } else {
            item = req.body;
        }

        // Support standard direct body or n8n style nested body
        const userId = item.body?.user_id || item.user_id;

        // Extract various possible output fields
        const rawOutput = item.output || item.body?.output || item.data?.output;
        const rawAnalysis = item['analysis output'] || item.body?.['analysis output'] || item.data?.['analysis output'];
        const rawAudit = item['audit output'] || item.body?.['audit output'] || item.data?.['audit output'];

        if (!userId) {
            console.error('[VoiceAnalysis] Missing user_id in payload', JSON.stringify(item));
            res.status(400).json({ success: false, error: "Missing user_id" });
            return;
        }

        if (!rawOutput && !rawAnalysis && !rawAudit) {
            console.error('[VoiceAnalysis] Missing output data in payload', JSON.stringify(item));
            res.status(400).json({ success: false, error: "Missing output data (checked 'output', 'analysis output', 'audit output')" });
            return;
        }

        // Helper to clean and parse JSON (handles strings with Markdown or objects)
        const parsePayload = (payload: any): any => {
            if (!payload) return {};
            if (typeof payload === 'object') return payload;

            if (typeof payload === 'string') {
                const cleanString = payload
                    .replace(/^```json\s*/, '') // Remove start marker
                    .replace(/^```\s*/, '')     // Remove start marker (if just ```)
                    .replace(/\s*```$/, '')     // Remove end marker
                    .trim();
                try {
                    return JSON.parse(cleanString);
                } catch (e) {
                    console.error('[VoiceAnalysis] Failed to parse JSON segment', e);
                    return {};
                }
            }
            return {};
        };

        // Parse and Merge all sources
        const parsedOutput = parsePayload(rawOutput);
        const parsedAnalysis = parsePayload(rawAnalysis);
        const parsedAudit = parsePayload(rawAudit);

        // Merge strategies (deep merge not usually needed for these distinct layers, but shallow merge of layers is good)
        // If analysis and audit return different layers, simple spread works.
        const outputJson = {
            ...parsedOutput,
            ...parsedAnalysis,
            ...parsedAudit,
            // Explicitly merge layers if they exist in multiple places (unlikely but safe)
            expression_layer: { ...(parsedOutput.expression_layer || {}), ...(parsedAnalysis.expression_layer || {}), ...(parsedAudit.expression_layer || {}) },
            belief_layer: { ...(parsedOutput.belief_layer || {}), ...(parsedAnalysis.belief_layer || {}), ...(parsedAudit.belief_layer || {}) },
            judgement_layer: { ...(parsedOutput.judgement_layer || {}), ...(parsedAnalysis.judgement_layer || {}), ...(parsedAudit.judgement_layer || {}) },
            governance_layer: { ...(parsedOutput.governance_layer || {}), ...(parsedAnalysis.governance_layer || {}), ...(parsedAudit.governance_layer || {}) },
            // Fallback for flat structure merging logic below
            primary_tone: parsedOutput.primary_tone || parsedAnalysis.primary_tone || parsedAudit.primary_tone,
            secondary_tone: parsedOutput.secondary_tone || parsedAnalysis.secondary_tone || parsedAudit.secondary_tone,
            validation_report: parsedOutput.validation_report || parsedAnalysis.validation_report || parsedAudit.validation_report
        };

        console.log(`[VoiceAnalysis] Processing for User: ${userId}`);

        // 5. Map to 4-Layer Schema
        const profileData: VoiceProfileLayered = {
            expression_layer: {
                primary_tone: outputJson.expression_layer?.primary_tone || outputJson.primary_tone || "Informative",
                secondary_tone: outputJson.expression_layer?.secondary_tone || outputJson.secondary_tone || "Conversational",
                sentence_style: outputJson.expression_layer?.sentence_style || outputJson.sentence_style || "",
                emoji_policy: outputJson.expression_layer?.emoji_policy || outputJson.emoji_policy || "",
                formatting_habits: outputJson.expression_layer?.formatting_habits || outputJson.formatting_habits || []
            },
            belief_layer: {
                // Map validation_report -> core_beliefs_list
                core_beliefs_list: outputJson.belief_layer?.core_beliefs_list || outputJson.validation_report || [],
                moral_posture: outputJson.belief_layer?.moral_posture || outputJson.moral_posture || ""
            },
            judgement_layer: {
                supports: outputJson.judgement_layer?.supports || outputJson.supports || [],
                opposes: outputJson.judgement_layer?.opposes || outputJson.opposes || [],
                disliked_styles: outputJson.judgement_layer?.disliked_styles || outputJson.disliked_styles || []
            },
            governance_layer: {
                forbidden_zones: outputJson.governance_layer?.forbidden_zones || outputJson.forbidden_zones || [],
                hard_constraints: outputJson.governance_layer?.hard_constraints || outputJson.hard_constraints || []
            }
        };

        // 6. DB Transaction: Versioning & Archiving
        const db = admin.firestore();
        const profilesRef = db.collection(`users/${userId}/voice_profiles`);

        await db.runTransaction(async (transaction) => {
            // Find current active profile
            const activeSnapshot = await transaction.get(profilesRef.where("isActive", "==", true).limit(1));

            let newVersion = 1.0;

            if (!activeSnapshot.empty) {
                const activeDoc = activeSnapshot.docs[0];
                const activeData = activeDoc.data() as VoiceProfileDocument;

                // Archive logic
                transaction.update(activeDoc.ref, {
                    isActive: false,
                    archivedAt: admin.firestore.Timestamp.now()
                });

                // Bump version
                if (activeData.version) {
                    newVersion = Math.floor(activeData.version) + 1.0; // Major version bump for complete re-analysis
                } else {
                    newVersion = 2.0; // Fail-safe
                }

                console.log(`[VoiceAnalysis] Archiving v${activeData.version}, Creating v${newVersion}`);
            } else {
                console.log(`[VoiceAnalysis] No active profile found. Creating v1.0`);
            }

            // Create new Active Profile
            const newDocRef = profilesRef.doc(); // Auto-ID
            const newDocData: VoiceProfileDocument = {
                ...profileData,
                isActive: true,
                version: newVersion,
                source: 'analysis',
                createdAt: admin.firestore.Timestamp.now()
            };

            transaction.set(newDocRef, newDocData);
        });

        console.log(`[VoiceAnalysis] Success.`);
        res.status(200).json({ success: true, version: 1.0 }); // Simplified response

    } catch (error: any) {
        console.error(`[VoiceAnalysis] Internal Error:`, error);
        res.status(500).json({ success: false, error: error.message });
    }
});
