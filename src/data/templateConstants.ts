// Template label and color constants
// These are used for displaying templates in the UI

// Expanded names for filter abbreviations
// I = Individual (professional), S = SMB (founder), E = Enterprise (executive)
export const userTypeLabels: Record<string, string> = {
  "professional": "Individual",
  "founder": "Small & Medium Business",
  "executive": "Large Enterprise",
};

export const themeLabels: Record<string, string> = {
  "Personal/Career Development": "Personal/Career Development",
  "Industry Insight/Thought Leadership": "Thought Leadership",
  "Product/Service/Solution": "Product/Service Spotlight",
  "Social Proof/Success Stories": "Social Proof",
  "Company Culture/Recruitment": "Company Culture",
  "Corporate/Investor Relations": "Community & Relationships",
  "Engagement/Community": "Educational Content",
  "Audience Education/Value": "Audience Engagement",
};

export const formatLabels: Record<string, string> = {
  "Text-Only/Text with Image": "Text",
  "Image/Photo": "Image",
  "Video/GIF": "Video",
  "Carousel/Document (PDF)": "Carousel",
  "Poll": "Poll",
  "Long-Form Article": "Article",
};

export const objectiveLabels: Record<string, string> = {
  "Personal Branding/Authority": "Personal Branding",
  "Networking/Community Building": "Network Building",
  "Lead Generation/Sales": "Lead Generation",
  "Talent Acquisition/Employer Branding": "Talent Attraction",
  "Reputation Management/Trust": "Reputation Management",
  "Audience Education/Value": "Audience Engagement",
};

// Filter option colors - each filter type has unique colors per option
export const userTypeFilterColors: Record<string, string> = {
  "professional": "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/30",
  "founder": "bg-violet-500/20 text-violet-300 border-violet-500/50 hover:bg-violet-500/30",
  "executive": "bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30",
};

export const themeFilterColors: Record<string, string> = {
  "Personal/Career Development": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "Industry Insight/Thought Leadership": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Product/Service/Solution": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Social Proof/Success Stories": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Company Culture/Recruitment": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Corporate/Investor Relations": "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "Engagement/Community": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "Audience Education/Value": "bg-teal-500/10 text-teal-400 border-teal-500/20",
};

export const formatFilterColors: Record<string, string> = {
  "Text-Only/Text with Image": "bg-slate-500/10 text-slate-400 border-slate-500/20",
  "Image/Photo": "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
  "Video/GIF": "bg-red-500/10 text-red-400 border-red-500/20",
  "Carousel/Document (PDF)": "bg-teal-500/10 text-teal-400 border-teal-500/20",
  "Poll": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Long-Form Article": "bg-lime-500/10 text-lime-400 border-lime-500/20",
};

export const objectiveFilterColors: Record<string, string> = {
  "Personal Branding/Authority": "bg-sky-500/10 text-sky-400 border-sky-500/20",
  "Networking/Community Building": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Lead Generation/Sales": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Talent Acquisition/Employer Branding": "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Reputation Management/Trust": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "Audience Education/Value": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

// Filter options arrays
export const userTypeFilters = ["professional", "founder", "executive"] as const;
export const themeFilters = [
  "Personal/Career Development",
  "Industry Insight/Thought Leadership",
  "Product/Service/Solution",
  "Social Proof/Success Stories",
  "Company Culture/Recruitment",
  "Corporate/Investor Relations",
  "Engagement/Community",
  "Audience Education/Value"
] as const;

export const formatFilters = [
  "Text-Only/Text with Image",
  "Image/Photo",
  "Video/GIF",
  "Carousel/Document (PDF)",
  "Poll",
  "Long-Form Article"
] as const;

export const objectiveFilters = [
  "Personal Branding/Authority",
  "Networking/Community Building",
  "Lead Generation/Sales",
  "Talent Acquisition/Employer Branding",
  "Reputation Management/Trust",
  "Audience Education/Value"
] as const;

// Card badge colors
export const themeColors: Record<string, string> = themeFilterColors; // Re-use same colors or adapt if needed
export const formatColors: Record<string, string> = formatFilterColors;
export const objectiveColors: Record<string, string> = objectiveFilterColors;
