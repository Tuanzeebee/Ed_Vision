export interface QuestionResponse {
  questionId: number;
  questionCode: string;
  content: string;
  category: string;
  type: string;
  optionsCount: number | string;
  createdDate: string;
  isActive: boolean;
}

export interface QuestionListResponse {
  data: QuestionResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
