// src/app/shared/models/report.model.ts

export interface AnalysisDto {
  id: string;
  imageId: string;
  analysisType: string;
  isFalsified: boolean;
  confidenceScore: number;
  detailedResults?: Record<string, any>;
  analysisDate: string;
  analyzedBy?: string;
  date?: string;
}


export enum ReportType {
  PRELIMINARY = 'PRELIMINARY',
  ANALYSIS = 'ANALYSIS',
  EXPERT_OPINION = 'EXPERT_OPINION',
  FINAL = 'FINAL',
  JUDICIAL = 'JUDICIAL',
}


export interface BackendReportCreationRequest {
  caseId: string;
  title: string;
  description?: string;
  analysisIds?: string[];
  customAnalysisData?: Array<Record<string, any>>;
  verdict?: string;
  judicialNotes?: string;
  imageUrls?: string[];
  attachmentIds?: string[];
  reportType: ReportType;
  generatedBy?: string;
  templateId?: string;

}


export interface ReportResponse {
  id: string;
  caseId: string;
  caseNumber?: string;
  title: string;
  description?: string;
  investigatorId?: string;
  expertId?: string;
  status?: string;
  analyses?: Array<Record<string, any>>;
  verdict?: string;
  judicialNotes?: string;
  imageUrls?: string[];
  attachmentIds?: string[];
  reportType: ReportType;
  generatedBy?: string;
  createdAt: string;
  updatedAt: string;
  pdfUrl?: string;
  templateId?: string;
}

export interface ReportComparisonResultDTO {
  sameCaseId: boolean;
  sameExpert: boolean;
  commonFindings: string[];
  uniqueFindingsReport1: string[];
  uniqueFindingsReport2: string[];
  sameVerdict: boolean;
}


