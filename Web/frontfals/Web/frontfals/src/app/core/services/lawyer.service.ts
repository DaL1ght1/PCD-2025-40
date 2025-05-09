import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import {
  CaseDTO,
  CaseSearchResponse,
  CaseStatus,
  PageResponse
} from '../models/case.model';
import {
  ReportResponse,
  ReportComparisonResultDTO,
  AnalysisDto
} from '../models/report.model';
import { NotificationService } from './notification.service';
import { CaseService } from './case.service';
import { ReportService } from './report.service';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class LawyerService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private caseService: CaseService,
    private reportService: ReportService
  ) {}

  getLawyerCases(
    status?: CaseStatus,
    page: number = 0,
    size: number = 10,
    sortBy: string = 'createdAt',
    sortDirection: 'DESC' | 'ASC' = 'DESC',
    title?: string,
    caseNumber?: string,
    investigatorId?: string,
    expertId?: string,
    createdAt?: string,
    endDate?: string,

  ): Observable<CaseSearchResponse> {
    return this.caseService.searchCases(
      title,
      status,
      investigatorId,
      expertId,
      createdAt,
      endDate,
      page,
      size,
      sortBy,
      sortDirection
    ).pipe(
      tap((x)=>console.log("xxxxxxxx",x)),
      catchError(this.handleError<CaseSearchResponse>('getLawyerCases', { cases: [], totalElements: 0, totalPages: 0, currentPage: 0 }))
    );
  }

  getCaseDetails(id: string): Observable<CaseDTO> {
    return this.caseService.getCaseById(id).pipe(
      catchError(this.handleError<CaseDTO>('getCaseDetails'))
    );
  }

  getReportsForCase(caseId: string): Observable<ReportResponse[]> {
    return this.reportService.getReportsByCase(caseId).pipe(
      catchError(this.handleError<ReportResponse[]>('getReportsForCase', []))
    );
  }

  getReportDetails(reportId: string): Observable<ReportResponse> {
    return this.reportService.getReport(reportId).pipe(
      catchError(this.handleError<ReportResponse>('getReportDetails'))
    );
  }

  exportReport(reportId: string): Observable<Blob> {
    return this.reportService.exportReport(reportId).pipe(
      catchError(this.handleError<Blob>('exportReport'))
    );
  }

  compareReports(reportId1: string, reportId2: string): Observable<ReportComparisonResultDTO> {
    return this.reportService.compareReports(reportId1, reportId2).pipe(
      catchError(this.handleError<ReportComparisonResultDTO>('compareReports'))
    );
  }

  /**
   * Assigns an expert to a specific case.
   * Delegates to CaseService.assignExpert.
   * @param caseId The ID of the case.
   * @param expertId The ID of the expert to assign.
   * @returns Observable of the updated CaseDTO.
   */
  assignExpertToCase(caseId: string, expertId: string): Observable<CaseDTO> {
    return this.caseService.assignExpert(caseId, expertId).pipe(
      catchError(this.handleError<CaseDTO>('assignExpertToCase'))
    );
  }

  /**
   * Get all experts in the system
   * @returns Observable of User array filtered to experts
   */
  getExperts(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/expert/all`).pipe(
      tap(experts => console.log(`Loaded ${experts.length} experts`)),
      catchError(this.handleError<User[]>('getExperts', []))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed:`, error);

      let errorMessage = `An error occurred during ${operation}.`;
      if (error.error?.message) {
        errorMessage = `Backend Error (${operation}): ${error.error.message}`;
      } else if (error.status === 0) {
        errorMessage = `Network Error (${operation}): Could not connect to the server.`;
      } else {
        errorMessage = `Error (${operation}) - Status: ${error.status}, Message: ${error.message}`;
      }

      this.notificationService.error(errorMessage);
      return throwError(() => new Error(errorMessage));
    };
  }
}
