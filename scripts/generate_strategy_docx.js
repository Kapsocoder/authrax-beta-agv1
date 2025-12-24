
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType } from "docx";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateDoc = async () => {
    // Define the document structure
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: [
                    // Title
                    new Paragraph({
                        text: "Authrax Subscription Strategy & Implementation Review",
                        heading: HeadingLevel.TITLE,
                    }),
                    new Paragraph({ text: "" }), // Spacer
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Last Updated: ", bold: true }),
                            new TextRun("Dec 2024"),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Status: ", bold: true }),
                            new TextRun("Implemented"),
                        ],
                    }),
                    new Paragraph({ text: "" }),

                    // 1. Strategy Overview
                    new Paragraph({
                        text: "1. Strategy Overview",
                        heading: HeadingLevel.HEADING_1,
                    }),
                    new Paragraph({
                        text: "Authrax uses a Freemium model designed to give users a taste of the platform's power while strictly gating advanced features to drive conversion.",
                    }),
                    new Paragraph({ text: "" }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Free Tier: ", bold: true }),
                            new TextRun("Designed for trial utility. Users can experience the 'Magic' (Post Generation, Voice Analysis) but with strict frequency caps that prevent professional use."),
                        ],
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Pro Tier: ", bold: true }),
                            new TextRun("Unlock unlimited access. $19.90/mo with a 10-Day Free Trial to lower the barrier to entry."),
                        ],
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Trial Strategy: ", bold: true }),
                            new TextRun("The 'Free Trial' is an auto-subscribing trial. Users must provide payment details upfront. They get 10 days of Pro access, after which they are billed. This reduces churn compared to 'opt-in' trials."),
                        ],
                    }),
                    new Paragraph({ text: "" }),

                    // 2. Feature Limits & Gates
                    new Paragraph({
                        text: "2. Feature Limits & Gates",
                        heading: HeadingLevel.HEADING_1,
                    }),
                    new Paragraph({
                        text: "The following limits are enforced both on the Frontend (UI blocking) and Backend (Security/Logic).",
                    }),
                    new Paragraph({ text: "" }),

                    // Table
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            // Header Row
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Feature", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Free Tier Limit", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Pro Tier Limit", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Enforcement", bold: true })] })] }),
                                ],
                            }),
                            // Post Generation
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph("Post Generation")] }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "1 Post / Week", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph("Unlimited")] }),
                                    new TableCell({ children: [new Paragraph("Backend: generatePost checks weekly_usage\nFrontend: Create.tsx checks checkUsageLimit()")] }),
                                ],
                            }),
                            // Scheduling
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph("Scheduling")] }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Disabled", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph("Unlimited")] }),
                                    new TableCell({ children: [new Paragraph("Frontend: Schedule.tsx checks checkFeatureAccess('schedule')")] }),
                                ],
                            }),
                            // Voice Training
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph("Voice Training")] }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "2 Lifetime Analyses", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph("Unlimited")] }),
                                    new TableCell({ children: [new Paragraph("Backend: analyzeVoice increments measure")] }),
                                ],
                            }),
                            // Trending
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph("Trending Topics")] }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "No Real-Time (24h)\nNo Manual Refresh", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph("Full Access")] }),
                                    new TableCell({ children: [new Paragraph("Backend: fetchTrending rejects 24h & forceRefresh")] }),
                                ],
                            }),
                            // Recommendations
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph("Recommendations")] }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Max 3 Topics", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Max 20 Topics", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph("Backend: generateRecommendations slices topics")] }),
                                ],
                            }),
                            // Drafts
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph("Drafts")] }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Max 10 Active", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph("Unlimited")] }),
                                    new TableCell({ children: [new Paragraph("Frontend: Drafts.tsx prevents creation")] }),
                                ],
                            }),
                            // Analytics
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph("Analytics")] }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "7 Days History", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph("Full History")] }),
                                    new TableCell({ children: [new Paragraph("Frontend: Analytics.tsx filters view")] }),
                                ],
                            }),
                        ],
                    }),
                    new Paragraph({ text: "" }),

                    // 3. Technical Implementation
                    new Paragraph({
                        text: "3. Technical Implementation",
                        heading: HeadingLevel.HEADING_1,
                    }),
                    new Paragraph({
                        text: "Backend (Firebase Cloud Functions)",
                        heading: HeadingLevel.HEADING_2,
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        text: "Usage Tracking: User documents in Firestore (users/{uid}) track usage in weekly_usage map.",
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        text: "Stripe Integration: createStripeCheckoutSession utilizes trial_period_days: 10.",
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        text: "Admin Overrides: Developers can bypass limits by setting admin_overrides: { bypass_limits: true }.",
                    }),
                    new Paragraph({
                        text: "Frontend (React)",
                        heading: HeadingLevel.HEADING_2,
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        text: "useProfile Hook: Centralizes generic checkUsageLimit() and checkFeatureAccess(feature).",
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        text: "SubscriptionModal: Global modal triggered via gates, offering the 10-day trial.",
                    }),
                    new Paragraph({ text: "" }),

                    // 4. Verification
                    new Paragraph({
                        text: "4. Verification & Testing",
                        heading: HeadingLevel.HEADING_1,
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Trial Flow: ", bold: true }),
                            new TextRun("Use Stripe Test Cards (4242...) to simulate checkout."),
                        ],
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Overrides: ", bold: true }),
                            new TextRun("Manually set bypass_limits: true in Firestore."),
                        ],
                    }),
                    new Paragraph({
                        bullet: { level: 0 },
                        children: [
                            new TextRun({ text: "Limits: ", bold: true }),
                            new TextRun("Remove override and attempt to exceed limits to verify blocks."),
                        ],
                    }),
                ],
            },
        ],
    });

    // Used to export the file into a .docx file
    const buffer = await Packer.toBuffer(doc);
    const outputPath = path.resolve(__dirname, "../docs/Authrax_Subscription_Strategy_v2.docx");
    fs.writeFileSync(outputPath, buffer);
    console.log("Document created successfully at:", outputPath);
};

generateDoc();
