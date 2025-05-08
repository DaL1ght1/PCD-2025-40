import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  CaseDTO,
  CaseCreationRequest,
  CaseUpdateRequest,
  CaseSearchResponse,
  CaseStatus,
  CaseStatisticsDTO, PageResponse
} from '../models/case.model';

@Injectable({
  providedIn: 'root',
})
export class CaseService {
  private casesApiUrl = `${environment.apiUrl}/cases`;

  constructor(private http: HttpClient) {}

  getCaseApiUrl(): string {
    return this.casesApiUrl;
  }

  createCase(request: CaseCreationRequest): Observable<CaseDTO> {
    return this.http.post<CaseDTO>(this.casesApiUrl, request).pipe(
      catchError(this.handleError)
    );
  }

  getCaseById(id: string): Observable<CaseDTO> {
    return this.http.get<CaseDTO>(`${this.casesApiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getCaseByCaseNumber(caseNumber: string): Observable<CaseDTO> {
    return this.http.get<CaseDTO>(`${this.casesApiUrl}/number/${caseNumber}`).pipe(
      catchError(this.handleError)
    );
  }

  updateCase(id: string, request: CaseUpdateRequest): Observable<CaseDTO> {
    return this.http.put<CaseDTO>(`${this.casesApiUrl}/${id}`, request).pipe(
      catchError(this.handleError)
    );
  }

  deleteCase(id: string): Observable<void> {
    return this.http.delete<void>(`${this.casesApiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  searchCases(
    title?: string,
    status?: CaseStatus,
    investigatorId?: string,
    expertId?: string,
    startDate?: string,
    closedAt?: string,
    page: number = 0,
    size: number = 10,
    sortBy: string = 'createdAt',
    sortDirection: 'DESC' | 'ASC' = 'DESC'
  ): Observable<CaseSearchResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);

    if (title) params = params.set('title', title);
    if (status) params = params.set('status', status);
    if (investigatorId) params = params.set('investigatorId', investigatorId);
    if (expertId) params = params.set('expertId', expertId);
    if (startDate) params = params.set('startDate', startDate);
    if (closedAt) params = params.set('endDate', closedAt);

    return this.http.get<CaseSearchResponse>(`${this.casesApiUrl}/search`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  getCases(page: number = 0, size: number = 10): Observable<CaseSearchResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', 'createdAt')
      .set('sortDirection', 'DESC');
    return this.http.get<CaseSearchResponse>(`${this.casesApiUrl}/search`, { params }).pipe(
      catchError(this.handleError)
    );
  }


  getCasesByInvestigator(investigatorId: string, page: number = 0, size: number = 10): Observable<CaseDTO[]> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', 'createdAt')
      .set('sortDirection', 'DESC');

    return this.http.get<CaseDTO[]>(`${this.casesApiUrl}/investigator/${investigatorId}`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  getCasesByExpert(expertId: string, page: number = 0, size: number = 10): Observable<PageResponse<CaseDTO>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PageResponse<CaseDTO>>(`${this.casesApiUrl}/expert/${expertId}`, { params }).pipe(
      catchError(this.handleError)
    );
  }



  assignExpert(caseId: string, expertId: string): Observable<CaseDTO> {
    return this.http.post<CaseDTO>(`${this.casesApiUrl}/${caseId}/assign-expert/${expertId}`, {}).pipe(
      catchError(this.handleError)
    );
  }

  addAnalysisToCase(caseId: string, analysisId: string): Observable<CaseDTO> {
    return this.http.post<CaseDTO>(`${this.casesApiUrl}/${caseId}/add-analysis/${analysisId}`, {}).pipe(
      catchError(this.handleError)
    );
  }

  completeAnalysis(caseId: string): Observable<CaseDTO> {
    return this.http.post<CaseDTO>(`${this.casesApiUrl}/${caseId}/complete-analysis`, {}).pipe(
      catchError(this.handleError)
    );
  }

  submitForReview(caseId: string): Observable<CaseDTO> {
    return this.http.post<CaseDTO>(`${this.casesApiUrl}/${caseId}/submit-for-review`, {}).pipe(
      catchError(this.handleError)
    );
  }

  completeCase(caseId: string, verdict: string, judicialNotes?: string): Observable<CaseDTO> {
    let params = new HttpParams().set('verdict', verdict);
    if (judicialNotes) params = params.set('judicialNotes', judicialNotes);

    return this.http.post<CaseDTO>(`${this.casesApiUrl}/${caseId}/complete`, {}, { params }).pipe(
      catchError(this.handleError)
    );
  }

  getCaseStatistics(): Observable<CaseStatisticsDTO> {
    return this.http.get<CaseStatisticsDTO>(`${this.casesApiUrl}/statistics`).pipe(
      catchError(this.handleError)
    );
  }
  getCasesByJudgeId(judgeId: string, page = 0, size = 10): Observable<CaseSearchResponse> {
    const params = new HttpParams().set("judgeId", judgeId).set("page", page.toString()).set("size", size.toString())

    return this.http.get<CaseSearchResponse>(`${this.casesApiUrl}`, { params }).pipe(catchError(this.handleError))
  }

  submitDecision(caseId: string, verdict: string, judicialNotes: string): Observable<CaseDTO> {
    return this.http
      .post<CaseDTO>(`${this.casesApiUrl}/${caseId}/decision`, {
        verdict,
        judicialNotes,
      })
      .pipe(catchError(this.handleError))
  }

  markCaseForReview(caseId: string): Observable<CaseDTO> {
    return this.http.put<CaseDTO>(`${this.casesApiUrl}/${caseId}/markCaseUnder_review`, {}).pipe()
  }


  private handleError(error: HttpErrorResponse) {
    console.error('CaseService Error:', error);
    let errorMessage = 'An unknown error occurred!';

    if (error.status === 400 && error.error && error.error.errors) {
      let validationErrorMessage = 'Validation failed: \n';

      for (const field in error.error.errors) {
        if (error.error.errors.hasOwnProperty(field)) {
          validationErrorMessage += `${field}: ${error.error.errors[field]}\n`;
        }
      }
      errorMessage = validationErrorMessage;
    } else if (error.error?.message) {
      errorMessage = `Backend Error: ${error.error.message}`;
    } else if (error.status === 0) {
      errorMessage = "Network error: Could not connect to the server.";
    } else {
      errorMessage = `Error Code: ${error.status}, Message: ${error.message}`;
    }


    return throwError(() => new Error(errorMessage));
  }
}
