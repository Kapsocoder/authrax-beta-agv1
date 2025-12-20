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
  "PCD": "Personal/Career Development",
  "TL": "Thought Leadership",
  "PSS": "Product/Service Spotlight",
  "SP": "Social Proof",
  "CC": "Company Culture",
  "CR": "Community & Relationships",
  "EC": "Educational Content",
  "AE": "Audience Engagement",
};

export const formatLabels: Record<string, string> = {
  "T": "Text",
  "I": "Image",
  "V": "Video",
  "C": "Carousel",
  "Po": "Poll",
  "A": "Article",
};

export const objectiveLabels: Record<string, string> = {
  "PB": "Personal Branding",
  "NB": "Network Building",
  "LG": "Lead Generation",
  "TA": "Talent Attraction",
  "RM": "Reputation Management",
  "AE": "Audience Engagement",
};

// Filter option colors - each filter type has unique colors per option
export const userTypeFilterColors: Record<string, string> = {
  "professional": "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/30",
  "founder": "bg-violet-500/20 text-violet-300 border-violet-500/50 hover:bg-violet-500/30",
  "executive": "bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30",
};

export const themeFilterColors: Record<string, string> = {
  "PCD": "bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30",
  "TL": "bg-blue-500/20 text-blue-300 border-blue-500/50 hover:bg-blue-500/30",
  "PSS": "bg-green-500/20 text-green-300 border-green-500/50 hover:bg-green-500/30",
  "SP": "bg-yellow-500/20 text-yellow-300 border-yellow-500/50 hover:bg-yellow-500/30",
  "CC": "bg-purple-500/20 text-purple-300 border-purple-500/50 hover:bg-purple-500/30",
  "CR": "bg-pink-500/20 text-pink-300 border-pink-500/50 hover:bg-pink-500/30",
  "EC": "bg-indigo-500/20 text-indigo-300 border-indigo-500/50 hover:bg-indigo-500/30",
  "AE": "bg-teal-500/20 text-teal-300 border-teal-500/50 hover:bg-teal-500/30",
};

export const formatFilterColors: Record<string, string> = {
  "T": "bg-slate-500/20 text-slate-300 border-slate-500/50 hover:bg-slate-500/30",
  "I": "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/50 hover:bg-fuchsia-500/30",
  "V": "bg-red-500/20 text-red-300 border-red-500/50 hover:bg-red-500/30",
  "C": "bg-teal-500/20 text-teal-300 border-teal-500/50 hover:bg-teal-500/30",
  "Po": "bg-orange-500/20 text-orange-300 border-orange-500/50 hover:bg-orange-500/30",
  "A": "bg-lime-500/20 text-lime-300 border-lime-500/50 hover:bg-lime-500/30",
};

export const objectiveFilterColors: Record<string, string> = {
  "PB": "bg-sky-500/20 text-sky-300 border-sky-500/50 hover:bg-sky-500/30",
  "NB": "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30",
  "LG": "bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30",
  "TA": "bg-violet-500/20 text-violet-300 border-violet-500/50 hover:bg-violet-500/30",
  "RM": "bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30",
  "AE": "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/30",
};

// Filter options arrays
export const userTypeFilters = ["professional", "founder", "executive"] as const;
export const themeFilters = ["PCD", "TL", "PSS", "SP", "CC", "CR", "EC", "AE"] as const;
export const formatFilters = ["T", "I", "V", "C", "Po", "A"] as const;
export const objectiveFilters = ["PB", "NB", "LG", "TA", "RM", "AE"] as const;

// Card badge colors
export const themeColors: Record<string, string> = {
  "PCD": "bg-rose-500/10 text-rose-400 border-rose-500/30",
  "TL": "bg-blue-500/10 text-blue-400 border-blue-500/30",
  "PSS": "bg-green-500/10 text-green-400 border-green-500/30",
  "SP": "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  "CC": "bg-purple-500/10 text-purple-400 border-purple-500/30",
  "CR": "bg-pink-500/10 text-pink-400 border-pink-500/30",
  "EC": "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  "AE": "bg-teal-500/10 text-teal-400 border-teal-500/30",
};

export const formatColors: Record<string, string> = {
  "T": "bg-slate-500/10 text-slate-400 border-slate-500/30",
  "I": "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30",
  "V": "bg-red-500/10 text-red-400 border-red-500/30",
  "C": "bg-teal-500/10 text-teal-400 border-teal-500/30",
  "Po": "bg-orange-500/10 text-orange-400 border-orange-500/30",
  "A": "bg-lime-500/10 text-lime-400 border-lime-500/30",
};

export const objectiveColors: Record<string, string> = {
  "PB": "bg-sky-500/10 text-sky-400 border-sky-500/30",
  "NB": "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  "LG": "bg-amber-500/10 text-amber-400 border-amber-500/30",
  "TA": "bg-violet-500/10 text-violet-400 border-violet-500/30",
  "RM": "bg-rose-500/10 text-rose-400 border-rose-500/30",
  "AE": "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
};
