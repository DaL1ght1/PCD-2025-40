import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { LegalDocument, DocumentTemplate, DocumentVersion, DocumentComment } from "../models/lawyer.model";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class LegalDocumentService {
  private apiUrl = `${environment.apiUrl}/legal-documents`;

  constructor(private http: HttpClient) {}

  // API Methods
  getDocuments(): Observable<LegalDocument[]> {
    return this.http
      .get<LegalDocument[]>(`${this.apiUrl}`)
      .pipe(catchError(this.handleError<LegalDocument[]>("getDocuments", [])));
  }

  getTemplates(): Observable<DocumentTemplate[]> {
    return this.http
      .get<DocumentTemplate[]>(`${this.apiUrl}/templates`)
      .pipe(catchError(this.handleError<DocumentTemplate[]>("getTemplates", [])));
  }

  getDocument(id: string): Observable<LegalDocument> {
    return this.http
      .get<LegalDocument>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError<LegalDocument>("getDocument")));
  }

  createDocument(document: LegalDocument): Observable<LegalDocument> {
    return this.http
      .post<LegalDocument>(`${this.apiUrl}`, document)
      .pipe(catchError(this.handleError<LegalDocument>("createDocument")));
  }

  updateDocument(document: LegalDocument): Observable<LegalDocument> {
    return this.http
      .put<LegalDocument>(`${this.apiUrl}/${document.id}`, document)
      .pipe(catchError(this.handleError<LegalDocument>("updateDocument")));
  }

  deleteDocument(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError<void>("deleteDocument")));
  }

  exportDocument(id: string, format: "pdf" | "docx"): Observable<Blob> {
    return this.http
      .get(`${this.apiUrl}/${id}/export?format=${format}`, {
        responseType: "blob",
      })
      .pipe(catchError(this.handleError<Blob>("exportDocument")));
  }

  // Document version control methods
  getDocumentVersions(documentId: string): Observable<DocumentVersion[]> {
    return this.http
      .get<DocumentVersion[]>(`${this.apiUrl}/${documentId}/versions`)
      .pipe(catchError(this.handleError<DocumentVersion[]>("getDocumentVersions", [])));
  }

  // Document comments methods
  getDocumentComments(documentId: string): Observable<DocumentComment[]> {
    return this.http
      .get<DocumentComment[]>(`${this.apiUrl}/${documentId}/comments`)
      .pipe(catchError(this.handleError<DocumentComment[]>("getDocumentComments", [])));
  }

  // Error handling
  private handleError<T>(operation = "operation", result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return throwError(() => new Error(`${operation} failed: ${error.message}`));
    };
  }
}
