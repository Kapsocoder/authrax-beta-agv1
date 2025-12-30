import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
    {
        question: "Does this really sound like me?",
        answer: "Yes. We analyze your past posts (or manual inputs) to build a custom voice model. It picks up on your sentence length, vocabulary, and tonal nuances—not just generic AI fluff.",
    },
    {
        question: "Is it safe for my LinkedIn account?",
        answer: "100%. We use the official LinkedIn API for publishing. We do not use automation bots or scrapers that violate LinkedIn's Terms of Service.",
    },
    {
        question: "Can I use it on my phone?",
        answer: "Absolutely. Authrax is built mobile-first so you can capture ideas, edit, and schedule posts directly from your smartphone.",
    },
    {
        question: "Is there a free trial?",
        answer: "Better—there's a free tier. You can use it forever to generate a limited number of posts per month.",
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
