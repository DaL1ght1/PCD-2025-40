export interface LegalDocument {
  id: string
  title: string
  content: string
  templateId: string
  createdAt: Date
  updatedAt: Date
  status: "draft" | "finalized" | "needs-review"
  tags?: string[]
  ownerId: string
  sharedWith?: string[]
  metadata?: Record<string, any>
}

export interface DocumentTemplate {
  id: string
  name: string
  description: string
  content: string
  category: string
  metadata?: {
    version?: string
    author?: string
    lastUpdated?: Date
    jurisdiction?: string
  }
}

export interface DocumentVersion {
  id: string
  documentId: string
  content: string
  createdAt: Date
  createdBy: string
  versionNumber: number
  comment?: string
}

export interface DocumentComment {
  id: string
  documentId: string
  content: string
  createdAt: Date
  createdBy: string
  position?: {
    startOffset: number
    endOffset: number
  }
}
