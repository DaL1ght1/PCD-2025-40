export interface AnalysisResult {
  analysisId: string
  imageId: string
  analysisType: string
  isFalsified: boolean
  confidenceScore: number
  detailedResults: any
  date: Date
  analyzedBy: string
  annotations?: AnnotationResponse[] // Add reference to annotations
}

export interface AnalysisRequest {
  imageId: string
  userId: string
}

export interface AnnotationResponse {
  id: string
  analysisId: string
  content: string
  createdBy: string
  createdAt: Date
  updatedAt?: Date
  status?: string
  type?: string
  category?: string
  confidence?: number
  relatedArea?: {
    x: number
    y: number
    width: number
    height: number
  }
}










