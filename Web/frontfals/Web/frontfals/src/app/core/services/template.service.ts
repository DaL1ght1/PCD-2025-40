import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReportTemplate } from '../models/template.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  private apiUrl = `${environment.apiUrl}/templates`;

  constructor(private http: HttpClient) { }

  /**
   * Get all available report templates
   */
  getAllTemplates(): Observable<ReportTemplate[]> {
    return this.http.get<ReportTemplate[]>(this.apiUrl);
  }

  /**
   * Get template by ID
   */
  getTemplateById(id: string): Observable<ReportTemplate> {
    return this.http.get<ReportTemplate>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get default template
   */
  getDefaultTemplate(): Observable<ReportTemplate> {
    return this.http.get<ReportTemplate>(`${this.apiUrl}/default`);
  }

  /**
   * Create a new template
   */
  createTemplate(template: ReportTemplate): Observable<ReportTemplate> {
    return this.http.post<ReportTemplate>(this.apiUrl, template);
  }

  /**
   * Upload a template file
   * @param formData FormData containing template information and file
   */
  uploadTemplate(formData: FormData): Observable<HttpEvent<ReportTemplate>> {
    const req = new HttpRequest('POST', `${this.apiUrl}/upload`, formData, {
      reportProgress: true,
      responseType: 'json'
    });
    return this.http.request<ReportTemplate>(req);
  }

  /**
   * Update an existing template
   */
  updateTemplate(id: string, template: ReportTemplate): Observable<ReportTemplate> {
    return this.http.put<ReportTemplate>(`${this.apiUrl}/${id}`, template);
  }

  /**
   * Delete a template
   */
  deleteTemplate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get template content (HTML) by ID
   * @param id Template ID
   * @returns Observable of template content as string
   */
  getTemplateContent(id: string): Observable<string> {
    return this.http.get(`${this.apiUrl}/${id}/content`, { responseType: 'text' });
  }
}
