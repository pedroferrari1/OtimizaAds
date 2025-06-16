
-- Create table for prompt versions
CREATE TABLE public.prompt_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_name TEXT NOT NULL,
  version TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL,
  UNIQUE(prompt_name, version)
);

-- Create table for prompt test results
CREATE TABLE public.prompt_test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_version_id UUID NOT NULL REFERENCES public.prompt_versions(id) ON DELETE CASCADE,
  test_input TEXT NOT NULL,
  expected_output TEXT,
  actual_output TEXT,
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_test_results ENABLE ROW LEVEL SECURITY;

-- Create policies for prompt_versions (admin only access)
CREATE POLICY "Admins can manage prompt versions" 
  ON public.prompt_versions 
  FOR ALL 
  USING (public.is_admin(auth.uid()));

-- Create policies for prompt_test_results (admin only access)
CREATE POLICY "Admins can manage prompt test results" 
  ON public.prompt_test_results 
  FOR ALL 
  USING (public.is_admin(auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_prompt_versions_name ON public.prompt_versions(prompt_name);
CREATE INDEX idx_prompt_versions_active ON public.prompt_versions(is_active);
CREATE INDEX idx_prompt_test_results_version_id ON public.prompt_test_results(prompt_version_id);
CREATE INDEX idx_prompt_test_results_status ON public.prompt_test_results(status);
