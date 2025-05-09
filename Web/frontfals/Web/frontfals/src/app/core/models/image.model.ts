import { AnalysisDto } from "./report.model";

export interface ImageDetails {
  id: string;
  imageId?: string;
  caseId?: string;
  filename: string;
  contentType: string;
  size: number;
  uploadDate: Date;
  uploadedBy: string;
  url?: string;
  analysisStatus?: string;
  tags?: string[];
  analysisResults?: AnalysisDto[];
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
    [key: string]: any;
  };
  annotations?: any[];
}

export interface ImageUploadResponse {
  id: string;
  imageId?: string;
  filename: string;
  url: string;
  uploadDate: string;
  uploadedBy: string;
  status: string;
  caseId?: string;
}

export interface ImageAnnotation {
  id: string;
  imageId: string;
  content: string;
  annotatedBy: string;
  annotationDate: Date;
  coordinates?: any;
  type?: string;
}
