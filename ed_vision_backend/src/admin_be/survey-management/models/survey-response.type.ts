export interface SurveyResponse {
  surveyId: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  responseCount?: number;
}
