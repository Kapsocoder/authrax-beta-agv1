import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
    {
        question: "Does this really sound like me?",
        answer: "Yes. That is the point. Authrax learns from your existing writing and inputs to understand how you express ideas, structure arguments, and apply judgment. The goal is not to generate generic AI content, but to help you articulate your thinking clearly and consistently. You remain in control of what gets published. Authrax simply helps you get there faster."
    },
    {
        question: "Is it safe for my LinkedIn account?",
        answer: "Yes. Authrax is designed with platform safety in mind. We rely only on approved integration methods and do not use bots, scrapers, or automation techniques that put accounts at risk. Your reputation, and your account, remain fully under your control."
    },
    {
        question: "Can I use Authrax on my phone?",
        answer: "Yes. Authrax is built mobile-first, so you can capture ideas as they come to you, review drafts, and refine posts directly from your phone. It is designed to work with how professionals actually think, not just when they are at a desk."
    },
    {
        question: "Is there a free trial?",
        answer: "There is a free tier. You can use Authrax on an ongoing basis to explore its core capabilities with a limited monthly allowance. If you find it valuable, you can upgrade when you are ready."
    },
    {
        question: "Is Authrax fully automated?",
        answer: "No, by design. Authrax supports your thinking and expression, but it does not post on your behalf without review. You decide what gets published and when."
    },
    {
        question: "Why do you need access to my LinkedIn profile URL?",
        answer: "We ask for your LinkedIn profile so we can understand your public writing and professional context. This helps Authrax build better suggestions and personalise your experience when you are invited to the beta. We do not access private LinkedIn data or post anything without you reviewing and approving it."
    },
    {
        question: "How will my writing be used?",
        answer: "Your writing samples help Authrax understand your style and voice. We use them only to generate your Brand DNA and related suggestions within the app. Your text is not sold or shared with third parties for marketing purposes."
    },
    {
        question: "Who can see my content?",
        answer: "Only you can see the Brand DNA and drafts generated for your account. Authrax does not share your drafts or inputs with other users. We may use anonymised data to improve the product, but this data cannot be traced back to you."
    },
    {
        question: "Can I delete my data?",
        answer: "Yes. At any time you can request deletion of your account and associated data. Please contact support and we will action your request promptly. See the Privacy Policy below for more details."
    },
    {
        question: "Will Authrax post on my LinkedIn without my permission?",
        answer: "No. Authrax cannot and will not post to LinkedIn or any other platform without your explicit action and approval. Authrax helps draft content, but you decide what is published."
    },
    {
        question: "Do you store my passwords or sensitive credentials?",
        answer: "No. We use secure authentication providers (Google, LinkedIn, Apple) so we never see or store your password."
    },
    {
        question: "Is Authrax compliant with data protection laws?",
        answer: "Yes. We take privacy seriously and comply with applicable global data protection standards, including GDPR for EU users and the Australian Privacy Act. See the Privacy Policy for full details."
    },
    {
        question: "What happens after the beta?",
        answer: "During beta we’re focused on gathering feedback and improving the product. Features, pricing, and policies may evolve based on what we learn from early users. We will communicate changes clearly."
    },
    {
        question: "What if I experience problems or bugs?",
        answer: "We welcome bug reports and feedback. Use the in-app feedback option or email us at the support address listed in the Privacy Policy and Terms of Use."
    },
];

export const FAQ = () => {
    return (
        <section className="py-24 bg-card/30">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`} className="border-border/50">
                            <AccordionTrigger className="text-left text-lg hover:no-underline hover:text-primary transition-colors">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
};
