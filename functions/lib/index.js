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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeVoice = exports.publishToLinkedIn = exports.handleLinkedInCallback = exports.getLinkedInAuthUrl = void 0;
const admin = __importStar(require("firebase-admin"));
// Initialize Admin SDK first (relying on firebase.ts init if used, but safe to do here)
if (!admin.apps.length) {
    admin.initializeApp();
}
// Export modules
__exportStar(require("./posts"), exports);
__exportStar(require("./recommendations"), exports);
__exportStar(require("./media"), exports);
__exportStar(require("./extraction"), exports);
__exportStar(require("./payment"), exports);
// Legacy exports (retained for compatibility if needed, but directed to new modules)
const linkedin = __importStar(require("./linkedin"));
const analyze = __importStar(require("./analyze_voice"));
const functions = __importStar(require("firebase-functions"));
exports.getLinkedInAuthUrl = linkedin.getLinkedInAuthUrl;
exports.handleLinkedInCallback = linkedin.handleLinkedInCallback;
exports.publishToLinkedIn = linkedin.publishToLinkedIn;
// Export analyzeVoice as onRequest to handle manual CORS
exports.analyzeVoice = functions.runWith({
    timeoutSeconds: 60,
    memory: "1GB"
}).https.onRequest(analyze.analyzeVoiceHandler);
__exportStar(require("./n8n_handler"), exports);
//# sourceMappingURL=index.js.map