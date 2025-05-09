export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  htmlTemplate: string;
  content?: string;
  filePath?: string;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

