export interface ContentApprovalResponse {
  approvalId: number;
  contentType: string;
  contentId: number;
  contentTitle?: string;
  submittedBy: number;
  submittedByName?: string;
  submittedAt: string;
  status: string;
  reviewedBy?: number;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  revisionInstructions?: string;
}

export interface ContentApprovalListResponse {
  data: ContentApprovalResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ApprovalStats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  totalRevisionRequired: number;
  averageReviewTime: number; // in hours
}

export interface ContentHistory {
  approvalId: number;
  status: string;
  reviewedBy?: number;
  reviewedByName?: string;
  reviewedAt: string;
  notes: string;
}
