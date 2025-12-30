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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleVoiceAnalysisResult = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
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
exports.handleVoiceAnalysisResult = functions.runWith({
    timeoutSeconds: 60,
    memory: "256MB" // Lightweight function
}).https.onRequest(async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
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
        }
        else {
            item = req.body;
        }
        // Support standard direct body or n8n style nested body
        const userId = ((_a = item.body) === null || _a === void 0 ? void 0 : _a.user_id) || item.user_id;
        // Extract various possible output fields
        const rawOutput = item.output || ((_b = item.body) === null || _b === void 0 ? void 0 : _b.output) || ((_c = item.data) === null || _c === void 0 ? void 0 : _c.output);
        const rawAnalysis = item['analysis output'] || ((_d = item.body) === null || _d === void 0 ? void 0 : _d['analysis output']) || ((_e = item.data) === null || _e === void 0 ? void 0 : _e['analysis output']);
        const rawAudit = item['audit output'] || ((_f = item.body) === null || _f === void 0 ? void 0 : _f['audit output']) || ((_g = item.data) === null || _g === void 0 ? void 0 : _g['audit output']);
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
        const parsePayload = (payload) => {
            if (!payload)
                return {};
            if (typeof payload === 'object')
                return payload;
            if (typeof payload === 'string') {
                const cleanString = payload
                    .replace(/^```json\s*/, '') // Remove start marker
                    .replace(/^```\s*/, '') // Remove start marker (if just ```)
                    .replace(/\s*```$/, '') // Remove end marker
                    .trim();
                try {
                    return JSON.parse(cleanString);
                }
                catch (e) {
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
        const outputJson = Object.assign(Object.assign(Object.assign(Object.assign({}, parsedOutput), parsedAnalysis), parsedAudit), { 
            // Explicitly merge layers if they exist in multiple places (unlikely but safe)
            expression_layer: Object.assign(Object.assign(Object.assign({}, (parsedOutput.expression_layer || {})), (parsedAnalysis.expression_layer || {})), (parsedAudit.expression_layer || {})), belief_layer: Object.assign(Object.assign(Object.assign({}, (parsedOutput.belief_layer || {})), (parsedAnalysis.belief_layer || {})), (parsedAudit.belief_layer || {})), judgement_layer: Object.assign(Object.assign(Object.assign({}, (parsedOutput.judgement_layer || {})), (parsedAnalysis.judgement_layer || {})), (parsedAudit.judgement_layer || {})), governance_layer: Object.assign(Object.assign(Object.assign({}, (parsedOutput.governance_layer || {})), (parsedAnalysis.governance_layer || {})), (parsedAudit.governance_layer || {})), 
            // Fallback for flat structure merging logic below
            primary_tone: parsedOutput.primary_tone || parsedAnalysis.primary_tone || parsedAudit.primary_tone, secondary_tone: parsedOutput.secondary_tone || parsedAnalysis.secondary_tone || parsedAudit.secondary_tone, validation_report: parsedOutput.validation_report || parsedAnalysis.validation_report || parsedAudit.validation_report });
        console.log(`[VoiceAnalysis] Processing for User: ${userId}`);
        // 5. Map to 4-Layer Schema
        const profileData = {
            expression_layer: {
                primary_tone: ((_h = outputJson.expression_layer) === null || _h === void 0 ? void 0 : _h.primary_tone) || outputJson.primary_tone || "Informative",
                secondary_tone: ((_j = outputJson.expression_layer) === null || _j === void 0 ? void 0 : _j.secondary_tone) || outputJson.secondary_tone || "Conversational",
                sentence_style: ((_k = outputJson.expression_layer) === null || _k === void 0 ? void 0 : _k.sentence_style) || outputJson.sentence_style || "",
                emoji_policy: ((_l = outputJson.expression_layer) === null || _l === void 0 ? void 0 : _l.emoji_policy) || outputJson.emoji_policy || "",
                formatting_habits: ((_m = outputJson.expression_layer) === null || _m === void 0 ? void 0 : _m.formatting_habits) || outputJson.formatting_habits || []
            },
            belief_layer: {
                // Map validation_report -> core_beliefs_list
                core_beliefs_list: ((_o = outputJson.belief_layer) === null || _o === void 0 ? void 0 : _o.core_beliefs_list) || outputJson.validation_report || [],
                moral_posture: ((_p = outputJson.belief_layer) === null || _p === void 0 ? void 0 : _p.moral_posture) || outputJson.moral_posture || ""
            },
            judgement_layer: {
                supports: ((_q = outputJson.judgement_layer) === null || _q === void 0 ? void 0 : _q.supports) || outputJson.supports || [],
                opposes: ((_r = outputJson.judgement_layer) === null || _r === void 0 ? void 0 : _r.opposes) || outputJson.opposes || [],
                disliked_styles: ((_s = outputJson.judgement_layer) === null || _s === void 0 ? void 0 : _s.disliked_styles) || outputJson.disliked_styles || []
            },
            governance_layer: {
                forbidden_zones: ((_t = outputJson.governance_layer) === null || _t === void 0 ? void 0 : _t.forbidden_zones) || outputJson.forbidden_zones || [],
                hard_constraints: ((_u = outputJson.governance_layer) === null || _u === void 0 ? void 0 : _u.hard_constraints) || outputJson.hard_constraints || []
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
                const activeData = activeDoc.data();
                // Archive logic
                transaction.update(activeDoc.ref, {
                    isActive: false,
                    archivedAt: admin.firestore.Timestamp.now()
                });
                // Bump version
                if (activeData.version) {
                    newVersion = Math.floor(activeData.version) + 1.0; // Major version bump for complete re-analysis
                }
                else {
                    newVersion = 2.0; // Fail-safe
                }
                console.log(`[VoiceAnalysis] Archiving v${activeData.version}, Creating v${newVersion}`);
            }
            else {
                console.log(`[VoiceAnalysis] No active profile found. Creating v1.0`);
            }
            // Create new Active Profile
            const newDocRef = profilesRef.doc(); // Auto-ID
            const newDocData = Object.assign(Object.assign({}, profileData), { isActive: true, version: newVersion, source: 'analysis', createdAt: admin.firestore.Timestamp.now() });
            transaction.set(newDocRef, newDocData);
        });
        console.log(`[VoiceAnalysis] Success.`);
        res.status(200).json({ success: true, version: 1.0 }); // Simplified response
    }
    catch (error) {
        console.error(`[VoiceAnalysis] Internal Error:`, error);
        res.status(500).json({ success: false, error: error.message });
    }
});
//# sourceMappingURL=n8n_handler.js.map