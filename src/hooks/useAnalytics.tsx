import { logEvent } from "firebase/analytics";
import { analytics } from "@/firebaseConfig";

export const useAnalytics = () => {
    const trackEvent = (eventName: string, params?: Record<string, any>) => {
        if (analytics) {
            logEvent(analytics, eventName, params);
        }
    };

    const trackBrandDNAToggled = (isActive: boolean) => {
        trackEvent("brand_dna_toggled", {
            status: isActive ? "on" : "off",
        });
    };

    const trackTrendingArticleClicked = (source: string, title?: string) => {
        trackEvent("trending_article_clicked", {
            source,
            title: title || "unknown",
        });
    };

    const trackRecommendationUsed = (postId: string, niche?: string) => {
        trackEvent("recommendation_used", {
            post_id: postId,
            niche: niche || "unknown",
        });
    };

    const trackTemplateUsed = (templateId: string, templateName: string) => {
        trackEvent("template_used", {
            template_id: templateId,
            template_name: templateName,
        });
    };

    return {
        trackEvent,
        trackBrandDNAToggled,
        trackTrendingArticleClicked,
        trackRecommendationUsed,
        trackTemplateUsed,
    };
};
