
-- Create RPC function to get prompt versions
CREATE OR REPLACE FUNCTION public.get_prompt_versions()
RETURNS TABLE (
  id UUID,
  prompt_name TEXT,
  version TEXT,
  content TEXT,
  description TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  created_by TEXT
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    id,
    prompt_name,
    version,
    content,
    description,
    is_active,
    created_at,
    created_by
  FROM public.prompt_versions
  ORDER BY created_at DESC;
$$;

-- Add fields to ai_models table for expanded provider configurations
ALTER TABLE public.ai_models 
ADD COLUMN IF NOT EXISTS api_endpoint TEXT,
ADD COLUMN IF NOT EXISTS api_version TEXT,
ADD COLUMN IF NOT EXISTS configuration_json JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS auth_type TEXT DEFAULT 'api_key';

-- Create provider_configurations table for managing API credentials
CREATE TABLE IF NOT EXISTS public.provider_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  api_endpoint TEXT,
  api_key_name TEXT DEFAULT 'api_key',
  auth_type TEXT DEFAULT 'bearer',
  configuration JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on provider_configurations
ALTER TABLE public.provider_configurations ENABLE ROW LEVEL SECURITY;

-- Create admin-only policy for provider_configurations
CREATE POLICY "Admins can manage provider configurations" 
  ON public.provider_configurations 
  FOR ALL 
  USING (public.is_admin(auth.uid()));

-- Insert default provider configurations
INSERT INTO public.provider_configurations (provider_name, display_name, api_endpoint, configuration) VALUES
('openai', 'OpenAI', 'https://api.openai.com/v1', '{"supports_vision": true, "supports_streaming": true}'),
('anthropic', 'Anthropic', 'https://api.anthropic.com/v1', '{"supports_vision": true, "supports_streaming": true}'),
('novita', 'Novita', 'https://api.novita.ai/v3', '{"supports_vision": false, "supports_streaming": true}'),
('google', 'Google Gemini', 'https://generativelanguage.googleapis.com/v1', '{"supports_vision": true, "supports_streaming": false}'),
('deepseek', 'DeepSeek', 'https://api.deepseek.com/v1', '{"supports_vision": false, "supports_streaming": true}'),
('openai_compatible', 'OpenAI Compatible', '', '{"supports_vision": false, "supports_streaming": true, "custom_endpoint": true}')
ON CONFLICT (provider_name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_provider_configurations_active ON public.provider_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_models_provider ON public.ai_models(provider);
