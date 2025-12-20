import { useState, useMemo } from "react";
import { TrendingUp, Search, X, Sparkles, Clock, ThumbsUp, MessageCircle, Zap, RefreshCw, Newspaper, Hash, ChevronDown, ExternalLink, Share2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useUserTopics } from "@/hooks/useUserTopics";
import { useNavigate } from "react-router-dom";

interface TrendingPost {
  id: string;
  title: string;
  source: string;
  author: string;
  authorTitle: string;
  authorAvatar?: string;
  content: string;
  excerpt: string;
  engagement: { likes: number; comments: number; shares?: number };
  timeAgo: string;
  topics: string[];
  url: string;
}

interface NewsArticle {
  id: string;
  title: string;
  source: string;
  content: string;
  excerpt?: string;
  timeAgo: string;
  topics: string[];
  url: string;
  imageUrl?: string;
}

// Mock trending data - In production, this would come from an API/edge function
const mockTrendingPosts: TrendingPost[] = [
  {
    id: "1",
    title: "The Future of AI in Enterprise: 5 Key Predictions for 2025",
    source: "LinkedIn",
    author: "Sarah Chen",
    authorTitle: "AI Research Lead @ Google",
    content: `As we enter 2025, the enterprise AI landscape is evolving rapidly. Here are my top predictions based on emerging trends:

1. **Agentic AI Goes Mainstream**
Every major company will deploy AI agents that can handle complex workflows autonomously. We're moving from chatbots to true digital coworkers.

2. **The Rise of Small Language Models**
Not every problem needs GPT-4. Companies will increasingly deploy smaller, specialized models that are faster, cheaper, and more controllable.

3. **AI Governance Becomes Non-Negotiable**
With regulations like the EU AI Act taking effect, enterprises will need robust AI governance frameworks. This isn't optional anymore.

4. **Multimodal AI in Production**
Vision, audio, and text will converge. Expect to see AI systems that can seamlessly handle any type of input.

5. **The Death of the AI POC**
2025 will see a shift from endless proofs of concept to actual production deployments. Companies that can't execute will fall behind.

What's your take? Which prediction do you think will have the biggest impact?

#AI #Enterprise #Technology #FutureTech`,
    excerpt: "As we enter 2025, the enterprise AI landscape is evolving rapidly. Here are my top predictions based on emerging trends...",
    engagement: { likes: 2450, comments: 189, shares: 342 },
    timeAgo: "2h ago",
    topics: ["AI", "Enterprise Tech"],
    url: "#",
  },
  {
    id: "2",
    title: "Why Remote Work Is Here to Stay: Data from 10,000 Companies",
    source: "LinkedIn",
    author: "Marcus Johnson",
    authorTitle: "Workplace Researcher @ MIT",
    content: `Our comprehensive study of 10,000 companies reveals that hybrid and remote work models are not just surviving—they're thriving.

Key findings:

📊 **Productivity is UP 13%** for remote workers compared to in-office counterparts

💰 **Cost savings average $11,000/year** per employee for companies embracing remote

😊 **Employee satisfaction increased 27%** in hybrid arrangements

🏢 **Only 3% of companies** have successfully mandated full return-to-office

The data is clear: forcing people back to the office is not just unpopular—it's bad for business.

Companies that embrace flexibility are winning the talent war. Those that don't are losing their best people.

The future of work isn't about where you work. It's about how well you work.

What does your company's remote policy look like? Let me know in the comments.

#RemoteWork #FutureOfWork #Leadership #HR`,
    excerpt: "Our comprehensive study of 10,000 companies reveals that hybrid and remote work models are not just surviving—they're thriving...",
    engagement: { likes: 1890, comments: 267, shares: 156 },
    timeAgo: "4h ago",
    topics: ["Remote Work", "Leadership"],
    url: "#",
  },
  {
    id: "3",
    title: "The Leadership Skill Nobody Talks About: Emotional Granularity",
    source: "LinkedIn",
    author: "Dr. Emily Park",
    authorTitle: "Executive Coach & Psychologist",
    content: `Most leadership advice focuses on EQ, but there's a deeper skill that separates great leaders: emotional granularity.

What is it?

Emotional granularity is the ability to make fine-grained distinctions between similar emotions.

Instead of just feeling "bad," you can distinguish between:
- Frustrated
- Disappointed  
- Anxious
- Overwhelmed
- Irritated

Why does this matter for leaders?

1. **Better Self-Regulation**
When you can precisely name what you're feeling, you can respond more appropriately. "I'm anxious about the deadline" leads to different actions than "I'm frustrated with the team."

2. **Improved Communication**
Leaders with high emotional granularity give clearer feedback. They don't just say "good job" or "this needs work"—they articulate exactly what they observed and felt.

3. **Stronger Team Connections**
When you can recognize subtle emotional states in others, you can respond with precision and empathy.

How to develop it:
- Keep an emotion journal
- Expand your emotional vocabulary
- Practice naming emotions in real-time
- Ask others how they're feeling (specifically)

The best leaders I've worked with all share this trait. It's learnable, but rarely taught.

#Leadership #EmotionalIntelligence #ExecutiveCoaching`,
    excerpt: "Most leadership advice focuses on EQ, but there's a deeper skill that separates great leaders: emotional granularity...",
    engagement: { likes: 3200, comments: 421, shares: 567 },
    timeAgo: "6h ago",
    topics: ["Leadership", "Career Growth"],
    url: "#",
  },
  {
    id: "4",
    title: "Building in Public: How Transparency Drives Growth",
    source: "LinkedIn",
    author: "Alex Rivera",
    authorTitle: "Founder @ BuildCo",
    content: `Our startup grew 300% after we started sharing everything publicly. Here's the exact playbook we used:

**Month 1: The Commitment**
We decided to share our revenue, failures, and learnings every week. It was terrifying.

**Month 2-3: The Awkward Phase**
Few people engaged. It felt like shouting into the void. We almost quit.

**Month 4: The Inflection Point**
A post about our biggest failure went viral. Suddenly, people cared.

**Month 5-12: Compound Growth**
Every post built on the last. Our audience grew. Customers came. Partners reached out.

Key lessons:
1. Authenticity > Perfection
2. Failures teach more than wins
3. Consistency beats intensity
4. Community builds itself

Our MRR went from $12k to $48k. Our team from 3 to 12. Our anxiety about sharing? Gone.

Building in public isn't for everyone. But if you're willing to be vulnerable, it's a superpower.

Would you build in public? Why or why not?

#Startups #BuildInPublic #Entrepreneurship`,
    excerpt: "Our startup grew 300% after we started sharing everything publicly. Here's the exact playbook we used...",
    engagement: { likes: 1567, comments: 198, shares: 89 },
    timeAgo: "8h ago",
    topics: ["Startups", "Growth"],
    url: "#",
  },
  {
    id: "5",
    title: "The 5 AM Club is Overrated. Here's What Actually Works.",
    source: "LinkedIn",
    author: "James Liu",
    authorTitle: "Performance Coach",
    content: `I used to wake up at 5 AM every day. It made me miserable and less productive.

Here's what I learned after 3 years of sleep research:

The optimal wake time is different for everyone. It depends on your chronotype.

There are 4 types:
🦁 Lions: Early risers (15% of people)
🐻 Bears: Middle of the day (55% of people)  
🐺 Wolves: Evening people (15% of people)
🐬 Dolphins: Light sleepers (10% of people)

I'm a Wolf. Waking at 5 AM was fighting my biology.

What works better than the 5 AM Club:

1. Find your peak hours
2. Protect them fiercely
3. Do deep work during peaks
4. Save admin for troughs
5. Get 7-9 hours of sleep

My productivity increased 40% when I stopped trying to be a Lion and embraced being a Wolf.

My best work happens 10 PM - 1 AM. And that's okay.

What's your chronotype?

#Productivity #Sleep #Performance`,
    excerpt: "I used to wake up at 5 AM every day. It made me miserable and less productive. Here's what I learned...",
    engagement: { likes: 4521, comments: 567, shares: 234 },
    timeAgo: "10h ago",
    topics: ["Productivity", "Career Growth"],
    url: "#",
  },
  {
    id: "6",
    title: "Why I Turned Down a $2M Raise to Stay at My Startup",
    source: "LinkedIn",
    author: "Priya Sharma",
    authorTitle: "CTO @ TechFlow",
    content: `Last month, I got an offer that would have doubled my compensation. I said no.

Here's my framework for making hard career decisions:

**The Money Test**
Would taking this for the money alone make me happy? The answer was no.

**The Learning Test**  
Am I still learning exponentially? At my current role, yes. The offer was for a more established company.

**The People Test**
Do I love who I work with? My current team is the best I've ever worked with.

**The Impact Test**
Can I make a meaningful difference? We're building something that could change an industry.

**The Regret Test**
If I stay, will I regret it in 10 years? No. If I leave, I might.

Money is important. But it's not everything.

The best career advice I ever got: "Optimize for learning in your 20s-30s. The money follows."

What would you have done?

#CareerAdvice #Startups #Leadership`,
    excerpt: "Last month, I got an offer that would have doubled my compensation. I said no. Here's my framework...",
    engagement: { likes: 2890, comments: 345, shares: 123 },
    timeAgo: "12h ago",
    topics: ["Career Growth", "Startups"],
    url: "#",
  },
  {
    id: "7",
    title: "I Interviewed 100 CEOs. Here's Their Morning Routine Secret.",
    source: "LinkedIn",
    author: "Tom Bradley",
    authorTitle: "Author & Executive Coach",
    content: `Over the past year, I interviewed 100 Fortune 500 CEOs about their morning routines.

The results surprised me.

It's not about waking up early.
It's not about meditation.
It's not about exercise (though 67% do it).

The #1 common thread: **Intentional Disconnection**

92% of the CEOs I spoke with have a phone-free period every morning.

Average length: 47 minutes

What they do instead:
- Think strategically
- Review priorities
- Connect with family
- Read physical books
- Journal

The insight: Your morning sets the tone for your day. If you start reactive (checking email, scrolling), you'll be reactive all day.

One CEO told me: "The first hour of my day is the only hour I fully control. I protect it like my life depends on it."

Try it for a week. One hour of intentional disconnection every morning.

Your productivity will thank you.

#Leadership #Productivity #CEO`,
    excerpt: "Over the past year, I interviewed 100 Fortune 500 CEOs about their morning routines. The results surprised me...",
    engagement: { likes: 5234, comments: 678, shares: 445 },
    timeAgo: "14h ago",
    topics: ["Leadership", "Productivity"],
    url: "#",
  },
  {
    id: "8",
    title: "The Hidden Cost of 'Quick' Meetings",
    source: "LinkedIn",
    author: "Rachel Kim",
    authorTitle: "VP Engineering @ Stripe",
    content: `"Can we hop on a quick call?"

This phrase costs companies millions every year.

Here's the math:

A "quick" 15-min meeting with 4 people = 1 hour of productivity lost

Factor in:
- Context switching (23 min to refocus)
- Preparation time
- Follow-up actions
- Calendar fragmentation

That "quick call" actually costs 3-4 hours of productive work.

At Stripe, we implemented three rules:

1. **No meetings under 25 minutes**
If it's truly quick, it can be an async message.

2. **Default to async first**
Every meeting request needs a "why can't this be async?" answer.

3. **Meeting-free mornings**
No meetings before 11 AM, company-wide.

Results after 6 months:
- 40% reduction in meetings
- 28% increase in deep work time
- Employee satisfaction up 15%

Your calendar is your most valuable asset. Protect it.

What's your biggest meeting pet peeve?

#Productivity #Engineering #Management`,
    excerpt: "'Can we hop on a quick call?' This phrase costs companies millions every year. Here's the math...",
    engagement: { likes: 3456, comments: 412, shares: 234 },
    timeAgo: "16h ago",
    topics: ["Productivity", "Leadership"],
    url: "#",
  },
  {
    id: "9",
    title: "AI Won't Take Your Job. But Someone Using AI Will.",
    source: "LinkedIn",
    author: "David Chen",
    authorTitle: "AI Strategy Consultant",
    content: `Stop worrying about AI taking your job.

Start worrying about falling behind.

I've consulted for 50+ companies on AI adoption. Here's what I've learned:

The gap isn't AI vs. humans.
It's AI-augmented humans vs. everyone else.

Early adopters are seeing:
- 3x faster content creation
- 50% reduction in research time
- 10x more experiments run
- Higher quality output

And they're not replacing workers—they're amplifying them.

How to become AI-augmented:

1. **Learn one AI tool deeply**
Don't dabble. Master one tool for your specific workflow.

2. **Create your prompt library**
Build a collection of prompts that work for your tasks.

3. **Automate the boring stuff**
Identify repetitive tasks and let AI handle them.

4. **Stay curious**
The landscape changes weekly. Keep learning.

5. **Experiment publicly**
Share what you learn. Build your AI reputation.

The future belongs to the augmented.

Are you ready?

#AI #FutureOfWork #Technology`,
    excerpt: "Stop worrying about AI taking your job. Start worrying about falling behind. Here's what I've learned...",
    engagement: { likes: 6789, comments: 823, shares: 567 },
    timeAgo: "18h ago",
    topics: ["AI", "Career Growth"],
    url: "#",
  },
  {
    id: "10",
    title: "From Burnout to Balance: My 12-Month Transformation",
    source: "LinkedIn",
    author: "Jessica Wong",
    authorTitle: "Director of Product @ Notion",
    content: `A year ago, I was working 80-hour weeks and heading for a wall.

Today, I work 45 hours and get more done.

Here's my transformation story:

**Rock Bottom (January 2024)**
Panic attacks. Insomnia. My body was screaming. I ignored it until I couldn't.

**The Reset (February)**
I took 3 weeks off. Read, slept, walked. Started therapy.

**The Audit (March)**
I tracked every hour for a month. 60% was low-value work I could eliminate or delegate.

**The Boundaries (April-June)**
No emails after 6 PM. No meetings on Fridays. Protected morning deep work.

**The Delegation (July-September)**
Hired a chief of staff. Trained my team to handle more. Let go of control.

**The Maintenance (October-Now)**
Weekly reviews. Monthly resets. Quarterly sabbaticals.

Results:
- Revenue up 40%
- Team happiness up 50%
- My wellbeing: immeasurably better

Burnout isn't a badge of honor. It's a warning sign.

If you're reading this exhausted at 10 PM, this is your sign to change something.

What's one boundary you're going to set this week?

#Burnout #MentalHealth #Leadership`,
    excerpt: "A year ago, I was working 80-hour weeks and heading for a wall. Today, I work 45 hours and get more done...",
    engagement: { likes: 8901, comments: 1023, shares: 678 },
    timeAgo: "20h ago",
    topics: ["Leadership", "Career Growth"],
    url: "#",
  },
];

const mockNewsArticles: NewsArticle[] = [
  {
    id: "n1",
    title: "OpenAI Announces GPT-5: What It Means for Businesses",
    source: "TechCrunch",
    content: `OpenAI has officially unveiled GPT-5, the next generation of its flagship AI model, at a packed event in San Francisco.

Key highlights:

**Capabilities**
- 10x longer context window (up to 1 million tokens)
- Native multimodal understanding (text, image, video, audio)
- Improved reasoning with 40% better accuracy on benchmarks
- Real-time web browsing capabilities built-in

**Business Implications**
The new model is expected to dramatically impact enterprise workflows. Early adopters in the beta program report:
- 60% reduction in document processing time
- Near-human accuracy in complex analysis tasks
- Significant cost savings due to improved efficiency

**Availability**
GPT-5 will roll out to ChatGPT Plus subscribers first, with API access coming in Q2 2025. Enterprise pricing has not been announced.

Industry experts predict this release will accelerate AI adoption across sectors, particularly in legal, healthcare, and financial services.`,
    excerpt: "The next generation AI model promises 10x longer context and native multimodal understanding.",
    timeAgo: "1h ago",
    topics: ["AI", "Tech News"],
    url: "#",
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400",
  },
  {
    id: "n2",
    title: "LinkedIn Introduces New Creator Tools for Personal Branding",
    source: "The Verge",
    content: `LinkedIn has announced a suite of new creator tools designed to help professionals build their personal brands on the platform.

**New Features**

1. **Scheduled Posts**: Native post scheduling with analytics
2. **Creator Mode 2.0**: Enhanced profile customization options
3. **Collaboration Hub**: Co-create content with other creators
4. **AI Writing Assistant**: Built-in AI to help draft posts
5. **Newsletter Analytics**: Deep insights into subscriber behavior

**Why It Matters**
LinkedIn has over 1 billion members, but only 1% regularly create content. These new tools aim to lower the barrier to content creation.

The AI Writing Assistant is particularly interesting—it can analyze your past posts and suggest content that matches your voice and style.

**Rollout**
Features will be available to Premium subscribers starting next month, with a gradual rollout to all users over Q1 2025.`,
    excerpt: "Scheduled posts, AI writing assistant, and enhanced analytics aim to boost creator engagement.",
    timeAgo: "3h ago",
    topics: ["LinkedIn", "Personal Branding"],
    url: "#",
  },
  {
    id: "n3",
    title: "Study: Companies with Strong Employer Brands See 50% More Applicants",
    source: "Forbes",
    content: `A new study by LinkedIn's Economic Graph team reveals that companies investing in employer branding see dramatic improvements in talent acquisition.

**Key Findings**

- 50% more qualified applicants
- 28% lower cost per hire
- 41% reduction in time to fill positions
- 2x higher employee retention

**What Works**

The study identified five pillars of strong employer brands:
1. Authentic employee stories
2. Clear mission and values
3. Visible leadership presence
4. Transparency about culture
5. Consistent social media presence

**The Investment**

Companies spending at least 10% of their recruiting budget on employer branding saw the highest ROI. The average investment for top performers was $150,000 annually.

**Recommendations**

Experts suggest starting with employee advocacy programs and encouraging leadership to share content regularly on LinkedIn.`,
    excerpt: "New research shows employer branding directly impacts hiring success and retention rates.",
    timeAgo: "5h ago",
    topics: ["HR", "Employer Branding"],
    url: "#",
  },
  {
    id: "n4",
    title: "Remote Work Policies Linked to Higher Stock Performance",
    source: "Bloomberg",
    content: `A comprehensive analysis of S&P 500 companies shows a correlation between flexible work policies and stock market performance.

Companies with hybrid or fully remote policies outperformed those with strict return-to-office mandates by an average of 12% over the past year.

**Analysis Details**

The study tracked 487 companies over 18 months, controlling for industry, size, and other factors.

Key correlations:
- Flexible policies: +12% average stock performance
- Hybrid policies: +8% average
- Strict RTO mandates: -3% average

**Why This Matters**

Researchers suggest the correlation reflects broader organizational health. Companies that trust employees with flexibility tend to have better cultures, lower turnover, and higher innovation rates.

**CEO Response**

Several CEOs have already cited this research in reversing or softening return-to-office mandates.`,
    excerpt: "S&P 500 analysis shows flexible work policies correlate with 12% better stock performance.",
    timeAgo: "6h ago",
    topics: ["Remote Work", "Business"],
    url: "#",
  },
  {
    id: "n5",
    title: "The Rise of the 'Fractional Executive': A New Trend in Leadership",
    source: "Harvard Business Review",
    content: `A growing number of experienced executives are opting for 'fractional' roles, working part-time for multiple companies simultaneously.

**The Trend**

Demand for fractional executives has grown 300% since 2020. The most common roles:
- Fractional CFO
- Fractional CMO
- Fractional CTO
- Fractional CHRO

**Why Companies Hire Fractional**

1. Access to senior talent at a fraction of the cost
2. Flexibility to scale up or down
3. Fresh perspectives from diverse experience
4. Faster time to impact

**Why Executives Go Fractional**

1. Work-life balance
2. Portfolio career variety
3. Higher effective hourly rate
4. Reduced corporate politics

**Considerations**

The model works best for companies with clear, project-based needs and executives with strong time management skills.`,
    excerpt: "300% growth in fractional executives as companies and leaders embrace flexibility.",
    timeAgo: "7h ago",
    topics: ["Leadership", "Career Growth"],
    url: "#",
  },
  {
    id: "n6",
    title: "Microsoft Launches AI-Powered LinkedIn Learning Paths",
    source: "Microsoft Blog",
    content: `Microsoft is integrating advanced AI capabilities into LinkedIn Learning, offering personalized learning paths based on career goals and skill gaps.

**New Features**

- AI Career Advisor: Analyzes your profile and suggests skills to develop
- Adaptive Learning: Courses adjust difficulty based on performance
- Skill Verification: AI-proctored assessments for credentials
- Team Insights: Managers can see team skill gaps and recommendations

**How It Works**

The system uses your LinkedIn profile, job history, and career goals to create a personalized curriculum. It updates weekly based on your progress and market demands.

**Pricing**

Available for all LinkedIn Learning subscribers at no additional cost. Enterprise features require a LinkedIn Learning Enterprise license.`,
    excerpt: "AI-powered personalization comes to LinkedIn Learning with adaptive courses and career advice.",
    timeAgo: "8h ago",
    topics: ["AI", "Learning"],
    url: "#",
  },
  {
    id: "n7",
    title: "Gen Z Workers Prefer Company Culture Over Salary",
    source: "Wall Street Journal",
    content: `A new survey of 10,000 Gen Z workers reveals surprising priorities when evaluating job offers.

**Key Findings**

When asked to rank factors in job selection:
1. Company culture and values (78%)
2. Growth opportunities (72%)
3. Work-life balance (68%)
4. Salary and benefits (54%)
5. Company prestige (23%)

**The Shift**

This marks a significant departure from previous generations, where salary consistently ranked first.

**Implications**

HR leaders are adapting recruitment strategies to emphasize culture and values earlier in the hiring process. Company social media presence and Glassdoor reviews have become critical touchpoints.

**Expert Commentary**

"Gen Z has watched their parents sacrifice everything for careers. They're choosing a different path," says workplace researcher Dr. Amanda Foster.`,
    excerpt: "78% of Gen Z prioritize culture over salary, signaling major shift in workplace priorities.",
    timeAgo: "9h ago",
    topics: ["HR", "Career Growth"],
    url: "#",
  },
  {
    id: "n8",
    title: "Startup Funding Rebounds as AI Companies Lead the Charge",
    source: "TechCrunch",
    content: `After a challenging 2023, venture capital funding has rebounded strongly in 2024, with AI companies capturing the lion's share.

**The Numbers**

- Total VC funding: $180B (up 45% from 2023)
- AI-focused companies: 62% of total funding
- Average Series A: $18M (up from $12M)
- Number of unicorns created: 47

**Hot Sectors**

1. Enterprise AI applications
2. Healthcare AI
3. Climate tech
4. Cybersecurity
5. Developer tools

**Investor Sentiment**

VCs report renewed optimism, with many increasing fund sizes. The focus has shifted from growth at all costs to sustainable unit economics.

**Looking Ahead**

Experts predict continued momentum through 2025, particularly for companies demonstrating clear paths to profitability.`,
    excerpt: "VC funding up 45% year-over-year with AI companies capturing 62% of investment.",
    timeAgo: "10h ago",
    topics: ["Startups", "AI"],
    url: "#",
  },
  {
    id: "n9",
    title: "The Four-Day Work Week: One Year Later",
    source: "BBC",
    content: `One year after implementing permanent four-day work weeks, companies in the UK's pilot program share their results.

**Participation**

61 companies, 2,900 employees participated in the trial that began in June 2022.

**Results After One Year**

- 92% of companies have continued the policy
- Revenue: Up 35% on average
- Employee wellbeing: 71% reduction in burnout
- Absenteeism: Down 65%
- Resignations: Down 57%

**Challenges**

Some companies reported initial adjustment difficulties:
- Customer service coverage
- Meeting scheduling across teams
- Project timeline expectations

**Key Success Factors**

Companies that succeeded focused on:
1. Eliminating unnecessary meetings
2. Asynchronous communication
3. Clear output expectations
4. Employee autonomy

**Global Impact**

The UK results have sparked similar trials in Japan, Australia, and the US, with legislation proposed in several countries.`,
    excerpt: "92% of UK pilot companies continue four-day weeks after seeing 35% revenue increase.",
    timeAgo: "11h ago",
    topics: ["Remote Work", "Productivity"],
    url: "#",
  },
  {
    id: "n10",
    title: "Personal Branding Now Required for Executive Roles",
    source: "Fast Company",
    content: `A growing number of companies are including personal brand presence as a requirement for senior leadership positions.

**The Trend**

A survey of Fortune 500 companies found:
- 67% consider social media presence in executive hiring
- 45% explicitly require thought leadership activity
- 34% include personal brand KPIs in executive contracts

**Why It Matters**

Executives with strong personal brands bring:
- Increased company visibility
- Better talent attraction
- Customer trust and engagement
- Investor confidence

**Building Your Brand**

Experts recommend:
1. Regular LinkedIn posting (3-5x per week)
2. Industry conference speaking
3. Podcast appearances
4. Authored articles and opinions
5. Active engagement with community

**The Risk of Invisibility**

"If you're not visible, you're not considered," says executive recruiter Maria Santos. "The days of quiet competence being enough are over."`,
    excerpt: "67% of Fortune 500 companies now consider social media presence when hiring executives.",
    timeAgo: "12h ago",
    topics: ["Personal Branding", "Leadership"],
    url: "#",
  },
];

export default function Trending() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { topics: userTopics } = useUserTopics();
  const [searchInput, setSearchInput] = useState("");
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [visiblePosts, setVisiblePosts] = useState(10);
  const [visibleNews, setVisibleNews] = useState(10);
  const [selectedPost, setSelectedPost] = useState<TrendingPost | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);

  // Convert user topics to display
  const preSelectedTopics = useMemo(() => {
    return userTopics.filter(t => t.is_active).map(t => t.name);
  }, [userTopics]);

  // Handle search input
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const value = searchInput.trim().replace(",", "");
      if (value && !searchTags.includes(value)) {
        setSearchTags([...searchTags, value]);
        setSearchInput("");
      }
    } else if (e.key === "Backspace" && !searchInput && searchTags.length > 0) {
      setSearchTags(searchTags.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    setSearchTags(searchTags.filter(t => t !== tag));
  };

  const addTagFromSuggestion = (topic: string) => {
    if (!searchTags.includes(topic)) {
      setSearchTags([...searchTags, topic]);
    }
  };

  // Filter content based on search tags
  const filteredPosts = useMemo(() => {
    if (searchTags.length === 0) return mockTrendingPosts;
    return mockTrendingPosts.filter(post => 
      post.topics.some(topic => 
        searchTags.some(tag => topic.toLowerCase().includes(tag.toLowerCase()))
      )
    );
  }, [searchTags]);

  const filteredNews = useMemo(() => {
    if (searchTags.length === 0) return mockNewsArticles;
    return mockNewsArticles.filter(article => 
      article.topics.some(topic => 
        searchTags.some(tag => topic.toLowerCase().includes(tag.toLowerCase()))
      )
    );
  }, [searchTags]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const handleCreatePost = (topic: string, title?: string) => {
    navigate("/create", { 
      state: { 
        mode: "draft",
        inspiration: title ? `Inspired by: "${title}"` : undefined,
        topic 
      } 
    });
  };

  return (
    <AppLayout onLogout={signOut}>
      <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary" />
              Trending
            </h1>
            <p className="text-muted-foreground">
              Discover what's worth talking about on LinkedIn
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Search Bar with Tags */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl bg-secondary/50 border border-border focus-within:border-primary transition-colors min-h-[48px]">
              <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              {searchTags.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="default"
                  className="px-3 py-1 gap-1 bg-primary/20 text-primary hover:bg-primary/30"
                >
                  {tag}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive" 
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
              <Input
                placeholder={searchTags.length === 0 ? "Search topics (separate with comma or Enter)..." : "Add more..."}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="flex-1 min-w-[150px] border-0 bg-transparent focus-visible:ring-0 p-0 h-auto"
              />
            </div>
            
            {/* Pre-selected topics from profile */}
            {preSelectedTopics.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">Your interests:</p>
                <div className="flex flex-wrap gap-2">
                  {preSelectedTopics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => addTagFromSuggestion(topic)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        searchTags.includes(topic)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-primary/20 hover:text-primary"
                      }`}
                    >
                      <Hash className="w-3 h-3 inline mr-1" />
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {preSelectedTopics.length === 0 && (
              <Button 
                variant="link" 
                size="sm" 
                className="mt-2 p-0 text-primary"
                onClick={() => navigate("/profile")}
              >
                Add topics of interest in your Profile →
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Trending Posts */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Trending Posts</h2>
              <Badge variant="secondary" className="text-xs">{filteredPosts.length}</Badge>
            </div>
            
            {filteredPosts.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No trending posts found for these topics</p>
                  <Button 
                    variant="link" 
                    onClick={() => setSearchTags([])}
                    className="mt-2"
                  >
                    Clear filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {filteredPosts.slice(0, visiblePosts).map((post) => (
                  <Card 
                    key={post.id} 
                    className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedPost(post)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <span className="font-medium text-primary">{post.source}</span>
                            <span>•</span>
                            <Clock className="w-3 h-3" />
                            <span>{post.timeAgo}</span>
                          </div>
                          <h3 className="font-semibold text-foreground mb-2 hover:text-primary">
                            {post.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {post.excerpt}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <span className="font-medium text-foreground">{post.author}</span>
                        <span>•</span>
                        <span>{post.authorTitle}</span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.topics.map((topic) => (
                          <Badge 
                            key={topic} 
                            variant="secondary"
                            className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              addTagFromSuggestion(topic);
                            }}
                          >
                            {topic}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {post.engagement.likes.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {post.engagement.comments.toLocaleString()}
                          </span>
                          {post.engagement.shares && (
                            <span className="flex items-center gap-1">
                              <Share2 className="w-3 h-3" />
                              {post.engagement.shares.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <Button 
                          variant="gradient" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreatePost(post.topics[0], post.title);
                          }}
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Create Post
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {visiblePosts < filteredPosts.length && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setVisiblePosts(prev => Math.min(prev + 10, filteredPosts.length))}
                  >
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Load More Posts ({filteredPosts.length - visiblePosts} remaining)
                  </Button>
                )}
              </>
            )}
          </div>

          {/* News Sidebar */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Newspaper className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Latest News</h2>
              <Badge variant="secondary" className="text-xs">{filteredNews.length}</Badge>
            </div>
            
            <Card className="bg-card border-border">
              <CardContent className="p-4 space-y-4">
                {filteredNews.slice(0, visibleNews).map((article, index) => (
                  <div 
                    key={article.id}
                    className={`cursor-pointer hover:bg-secondary/50 p-2 -mx-2 rounded-lg transition-colors ${
                      index !== Math.min(visibleNews, filteredNews.length) - 1 ? "pb-4 border-b border-border" : ""
                    }`}
                    onClick={() => setSelectedNews(article)}
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <span className="font-medium text-primary">{article.source}</span>
                      <span>•</span>
                      <span>{article.timeAgo}</span>
                    </div>
                    <h4 className="text-sm font-medium text-foreground hover:text-primary mb-2">
                      {article.title}
                    </h4>
                    {article.excerpt && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {article.topics.map((topic) => (
                          <Badge 
                            key={topic} 
                            variant="outline"
                            className="text-xs px-2 py-0"
                          >
                            {topic}
                          </Badge>
                        ))}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreatePost(article.topics[0], article.title);
                        }}
                      >
                        <Sparkles className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                {visibleNews < filteredNews.length && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setVisibleNews(prev => Math.min(prev + 10, filteredNews.length))}
                  >
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Load More ({filteredNews.length - visibleNews})
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Coming Soon: Notifications */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-medium">Coming Soon</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get push notifications when topics you care about start trending. Configure your preferences in Profile settings.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Post Detail Modal - LinkedIn Style */}
        <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedPost && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                      <User className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <DialogTitle className="text-base font-semibold">{selectedPost.author}</DialogTitle>
                      <p className="text-sm text-muted-foreground">{selectedPost.authorTitle}</p>
                      <p className="text-xs text-muted-foreground">{selectedPost.timeAgo}</p>
                    </div>
                  </div>
                </DialogHeader>

                {/* Post Content - LinkedIn Style */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                    {selectedPost.content}
                  </div>
                </div>

                {/* Engagement */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      {selectedPost.engagement.likes.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {selectedPost.engagement.comments.toLocaleString()} comments
                    </span>
                    {selectedPost.engagement.shares && (
                      <span className="flex items-center gap-1">
                        <Share2 className="w-4 h-4" />
                        {selectedPost.engagement.shares.toLocaleString()} shares
                      </span>
                    )}
                  </div>
                </div>

                {/* Topics */}
                <div className="flex flex-wrap gap-2 pt-4">
                  {selectedPost.topics.map((topic) => (
                    <Badge key={topic} variant="secondary">
                      {topic}
                    </Badge>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="gradient" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedPost(null);
                      handleCreatePost(selectedPost.topics[0], selectedPost.title);
                    }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Similar Post
                  </Button>
                  <Button variant="outline" size="icon">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* News Detail Modal */}
        <Dialog open={!!selectedNews} onOpenChange={() => setSelectedNews(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedNews && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Badge variant="outline">{selectedNews.source}</Badge>
                    <span>•</span>
                    <span>{selectedNews.timeAgo}</span>
                  </div>
                  <DialogTitle className="text-xl">{selectedNews.title}</DialogTitle>
                </DialogHeader>

                {/* News Content */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                    {selectedNews.content}
                  </div>
                </div>

                {/* Topics */}
                <div className="flex flex-wrap gap-2 pt-4">
                  {selectedNews.topics.map((topic) => (
                    <Badge key={topic} variant="secondary">
                      {topic}
                    </Badge>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="gradient" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedNews(null);
                      handleCreatePost(selectedNews.topics[0], selectedNews.title);
                    }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Post About This
                  </Button>
                  <Button variant="outline" size="icon">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
