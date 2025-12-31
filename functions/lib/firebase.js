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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GEMINI_API_KEY = exports.STRIPE_PRICE_ID = exports.WEBHOOK_SECRET = exports.STRIPE_SECRET_KEY = exports.admin = exports.db = void 0;
const admin = __importStar(require("firebase-admin"));
exports.admin = admin;
const functions = __importStar(require("firebase-functions"));
// Initialize only once
// Initialize only once
if (!admin.apps.length) {
    console.log("DEBUG: firebase.ts initializing admin app");
    // HARDCODED PATH to ensure we load the correct key in emulator
    // This is required because firebase.ts often loads before index.ts
    const localKeyPath = "c:\\Users\\kapil\\OneDrive\\Business\\Development\\Authrax-Beta-Lv1\\authrax\\serviceAccountKey.json";
    if (process.env.FUNCTIONS_EMULATOR && localKeyPath) {
        try {
            console.log("Requiring key from:", localKeyPath);
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            let serviceAccount = require(localKeyPath);
            // Handle potential ESM default export wrapping
            if (serviceAccount.default) {
                console.log("Detecting default export in service account require");
                serviceAccount = serviceAccount.default;
            }
            console.log("Loaded Service Account Keys:", Object.keys(serviceAccount));
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: "authrax-beta-lv1.firebasestorage.app"
            });
            console.log("Initialized Firebase Admin with local service account (firebase.ts).");
        }
        catch (e) {
            console.warn("Failed to load local service account, falling back to default:", e);
            admin.initializeApp();
        }
    }
    else {
        admin.initializeApp();
    }
}
exports.db = admin.firestore();
// Shared Configuration
exports.STRIPE_SECRET_KEY = (_a = functions.config().stripe) === null || _a === void 0 ? void 0 : _a.secret_key;
exports.WEBHOOK_SECRET = (_b = functions.config().stripe) === null || _b === void 0 ? void 0 : _b.webhook_secret;
exports.STRIPE_PRICE_ID = (_c = functions.config().stripe) === null || _c === void 0 ? void 0 : _c.price_id;
exports.GEMINI_API_KEY = process.env.GEMINI_API_KEY || ((_d = functions.config().google) === null || _d === void 0 ? void 0 : _d.api_key) || "dummy_key";
//# sourceMappingURL=firebase.js.map