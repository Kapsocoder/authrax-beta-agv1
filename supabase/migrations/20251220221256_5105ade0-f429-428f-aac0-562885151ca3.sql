-- Create templates table
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  user_type TEXT NOT NULL,
  themes TEXT[] NOT NULL DEFAULT '{}',
  formats TEXT[] NOT NULL DEFAULT '{}',
  objectives TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  structure TEXT NOT NULL,
  example TEXT,
  prompt TEXT NOT NULL,
  is_trending BOOLEAN DEFAULT false,
  is_custom BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT true,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Everyone can view system templates
CREATE POLICY "Anyone can view system templates"
ON public.templates
FOR SELECT
USING (is_system = true);

-- Users can view their own custom templates
CREATE POLICY "Users can view their own templates"
ON public.templates
FOR SELECT
USING (user_id = auth.uid() AND is_custom = true);

-- Users can insert their own custom templates
CREATE POLICY "Users can insert their own templates"
ON public.templates
FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_custom = true AND is_system = false);

-- Users can update their own custom templates
CREATE POLICY "Users can update their own templates"
ON public.templates
FOR UPDATE
USING (auth.uid() = user_id AND is_custom = true);

-- Users can delete their own custom templates
CREATE POLICY "Users can delete their own templates"
ON public.templates
FOR DELETE
USING (auth.uid() = user_id AND is_custom = true);

-- Trigger for updated_at
CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_templates_user_type ON public.templates(user_type);
CREATE INDEX idx_templates_is_system ON public.templates(is_system);
CREATE INDEX idx_templates_user_id ON public.templates(user_id) WHERE user_id IS NOT NULL;