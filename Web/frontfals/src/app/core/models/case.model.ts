export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export enum CaseStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  ANALYSIS_COMPLETE = 'ANALYSIS_COMPLETE',
  UNDER_REVIEW = 'UNDER_REVIEW',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

export interface CaseDTO {
  id: string;
  caseNumber: string;
  title: string;
  description?: string;
  status: CaseStatus;
  investigatorId: string;
  assignedExpertId?: string;
  imageIds?: string[];
  analysisIds?: string[];
  verdict?: string;
  judicialNotes?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface CaseCreationRequest {
  title: string;
  description?: string;
  investigatorId: string;
  imageIds?: string[];
}

export interface CaseUpdateRequest {
  title?: string;
  description?: string;
  status?: CaseStatus;
  assignedExpertId?: string;
  imageIds?: string[];
  analysisIds?: string[];
  verdict?: string;
  judicialNotes?: string;
}

export interface CaseSearchResponse {
  cases: CaseDTO[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

export interface CaseStatisticsDTO {
  totalCases: number;
  pendingCases: number;
  assignedCases: number;
  inProgressCases: number;
  analysisCompleteCases: number;
  underReviewCases: number;
  completedCases: number;
  rejectedCases: number;
}
