export interface FunnelAnalysisResult {
  funnelCoherenceScore: number;
  adDiagnosis: string;
  landingPageDiagnosis: string;
  syncSuggestions: string[];
  optimizedAd: string;
}