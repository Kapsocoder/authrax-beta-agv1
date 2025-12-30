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
exports.extractContent = void 0;
const functions = __importStar(require("firebase-functions"));
const extractors_1 = require("./extractors");
// Expose extraction logic to frontend for preview
exports.extractContent = functions.runWith({
    timeoutSeconds: 60,
    memory: "1GB" // Browser needs memory
}).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    const { url, type } = data;
    if (!url) {
        throw new functions.https.HttpsError('invalid-argument', 'URL is required.');
    }
    try {
        let content = "";
        if (type === 'video') {
            content = await (0, extractors_1.extractYouTube)(url);
        }
        else {
            content = await (0, extractors_1.extractWebPage)(url);
        }
        return { success: true, content };
    }
    catch (error) {
        console.error("Extraction error:", error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to extract content.');
    }
});
//# sourceMappingURL=extraction.js.map