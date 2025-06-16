export interface FunnelAnalysisResult {
  funnelCoherenceScore: number;
  adDiagnosis: string;
  landingPageDiagnosis: string;
  syncSuggestions: string[];
  optimizedAd: string;
}

interface FunnelAnalysisLog {
  id: string;
  user_id: string;
  ad_text: string;
  landing_page_text: string;
  coherence_score: number;
  suggestions: string[];
  optimized_ad: string;
  processing_time_ms: number;
  created_at: string;
}

interface FunnelAnalyticsData {
  logs: FunnelAnalysisLog[];
  totalAnalyses: number;
  avgCoherenceScore: number;
  avgProcessingTime: number;
  scoreDistribution: {name: string, count: number}[];
  usageByDay: {date: string, analyses: number}[];
  cacheHitRate: number;
}

export interface FunnelOptimizerConfig {
  enabled: boolean;
  maxTokens: number;
  temperature: number;
  cacheEnabled: boolean;
  cacheExpiryHours: number;
  defaultModel: string;
}