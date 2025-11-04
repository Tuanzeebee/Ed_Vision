import { InstructorResponse } from './instructor-response.type';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface InstructorListResponse {
  data: InstructorResponse[];
  meta: PaginationMeta;
}
