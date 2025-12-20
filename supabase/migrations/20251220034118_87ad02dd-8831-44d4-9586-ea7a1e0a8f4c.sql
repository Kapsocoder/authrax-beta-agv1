-- Add additional profile fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS headline text,
ADD COLUMN IF NOT EXISTS company text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS linkedin_id text,
ADD COLUMN IF NOT EXISTS linkedin_linked_at timestamp with time zone;

-- Add system_prompt column to voice_profiles for editable AI instructions
ALTER TABLE public.voice_profiles 
ADD COLUMN IF NOT EXISTS system_prompt text,
ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'manual';

-- Create user_topics table for personalized trend interests
CREATE TABLE IF NOT EXISTS public.user_topics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_topics ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_topics
CREATE POLICY "Users can view their own topics" 
ON public.user_topics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own topics" 
ON public.user_topics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own topics" 
ON public.user_topics 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own topics" 
ON public.user_topics 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_topics_user_id ON public.user_topics(user_id);

-- Add onboarding_completed flag to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;