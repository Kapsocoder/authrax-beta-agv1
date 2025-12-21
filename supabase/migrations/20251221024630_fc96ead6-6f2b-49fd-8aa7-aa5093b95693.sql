-- Create recommended_posts table to store AI-generated post recommendations
CREATE TABLE public.recommended_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'ai_generated', -- 'trending_post', 'news', 'ai_generated'
  source_url TEXT,
  source_title TEXT,
  is_used BOOLEAN DEFAULT false,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recommended_posts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own recommended posts"
ON public.recommended_posts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommended posts"
ON public.recommended_posts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recommended posts"
ON public.recommended_posts FOR DELETE
USING (auth.uid() = user_id);

-- System can insert (edge functions use service role)
CREATE POLICY "Service role can insert recommended posts"
ON public.recommended_posts FOR INSERT
WITH CHECK (true);

-- Create trending_cache table for global caching of trending data
CREATE TABLE public.trending_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  timeframe TEXT NOT NULL DEFAULT '7d', -- '24h', '7d', '30d'
  item_type TEXT NOT NULL, -- 'news', 'post'
  source_id TEXT NOT NULL, -- unique identifier (URL or permalink)
  title TEXT NOT NULL,
  description TEXT,
  source_name TEXT,
  source_url TEXT NOT NULL,
  category TEXT,
  score INTEGER DEFAULT 0,
  num_comments INTEGER DEFAULT 0,
  author TEXT,
  item_metadata JSONB DEFAULT '{}'::jsonb,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source_id, topic, timeframe) -- Prevent duplicates
);

-- Enable RLS (public read for caching efficiency)
ALTER TABLE public.trending_cache ENABLE ROW LEVEL SECURITY;

-- Anyone can read cached trending data
CREATE POLICY "Anyone can view trending cache"
ON public.trending_cache FOR SELECT
USING (true);

-- Service role can insert/update
CREATE POLICY "Service role can insert trending cache"
ON public.trending_cache FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can update trending cache"
ON public.trending_cache FOR UPDATE
USING (true);

CREATE POLICY "Service role can delete trending cache"
ON public.trending_cache FOR DELETE
USING (true);

-- Indexes for efficient querying
CREATE INDEX idx_recommended_posts_user_topic ON public.recommended_posts(user_id, topic);
CREATE INDEX idx_recommended_posts_expires ON public.recommended_posts(expires_at);
CREATE INDEX idx_trending_cache_topic_timeframe ON public.trending_cache(topic, timeframe);
CREATE INDEX idx_trending_cache_fetched ON public.trending_cache(fetched_at);
CREATE INDEX idx_trending_cache_item_type ON public.trending_cache(item_type);