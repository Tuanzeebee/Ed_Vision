import { SurveyResponse } from './survey-response.type';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface SurveyListResponse {
  data: SurveyResponse[];
  meta: PaginationMeta;
}
