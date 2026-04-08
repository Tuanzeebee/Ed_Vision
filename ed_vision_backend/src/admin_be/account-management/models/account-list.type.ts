import { AccountResponse } from './account-response.type';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AccountListResponse {
  data: AccountResponse[];
  meta: PaginationMeta;
}
