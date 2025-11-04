import { StudentResponse } from './student-response.type';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface StudentListResponse {
  data: StudentResponse[];
  meta: PaginationMeta;
}
