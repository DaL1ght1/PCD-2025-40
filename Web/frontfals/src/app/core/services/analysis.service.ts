import { Injectable } from "@angular/core"
import {HttpClient, HttpErrorResponse, HttpParams} from "@angular/common/http"
import { Observable, throwError } from "rxjs"
import { catchError, retry, timeout } from "rxjs/operators"
import { environment } from "../../../environments/environment"
import { AnalysisResult, type AnalysisRequest } from "../models/analysis.model"
import { ToastrService } from "ngx-toastr"
import {AnalysisDto} from '../models/report.model';

@Injectable({
  providedIn: "root",
})
export class AnalysisService {
  private readonly TIMEOUT_MS = 300000
  private apiUrl = environment.analysisApiUrl

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
  ) {}

  analyzeImage(request: AnalysisRequest): Observable<AnalysisResult> {
    return this.http.post<AnalysisResult>(`${this.apiUrl}/`, request).pipe(
      timeout(this.TIMEOUT_MS),
      retry(1),
      catchError(this.handleError)
    )
  }

  runAnalysis(imageId: string, userId?: string): Observable<AnalysisDto> {
    let url = `${this.apiUrl}/${imageId}`;

    let params = new HttpParams();
    if (userId) {
      params = params.set('userId', userId);
    }

    return this.http.post<AnalysisDto>(url, null, { params });
  }



  getAnalysis(analysisId: string): Observable<AnalysisResult> {
    return this.http.get<AnalysisResult>(`${this.apiUrl}/${analysisId}`).pipe(
      catchError(this.handleError)
    )
  }

  getAnalysesByImage(imageId: string): Observable<AnalysisResult[]> {
    return this.http.get<AnalysisResult[]>(`${this.apiUrl}/image/${imageId}`).pipe(
      catchError(this.handleError)
    )
  }

  getAnalysesByCase(caseId: string): Observable<AnalysisDto[]>{
    return this.http.get<AnalysisDto[]>(`${this.apiUrl}/case/${caseId}`).pipe(
      catchError(this.handleError)
    )
  }

  cancelAnalysis(analysisId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${analysisId}/cancel`, {}).pipe(
      catchError(this.handleError)
    )
  }

  compareImages(imageId1: string, imageId2: string): Observable<AnalysisResult> {
    return this.http
      .post<AnalysisResult>(`${this.apiUrl}/compare`, {
        imageId1,
        imageId2,
      })
      .pipe(
        timeout(this.TIMEOUT_MS),
        catchError(this.handleError)
      )
  }

  getAnalysisResult(imageId: string): Observable<AnalysisDto> {
    return this.http.get<AnalysisDto>(`${this.apiUrl}/images/${imageId}`).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = "An unknown error occurred during analysis"

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`

      if (error.status === 0) {
        errorMessage = "Cannot connect to analysis server. Please check your network connection."
      } else if (error.status === 400) {
        errorMessage = "Invalid analysis request. Please check your parameters."
      } else if (error.status === 404) {
        errorMessage = "The requested analysis or image was not found."
      } else if (error.status === 408) {
        errorMessage = "Analysis request timed out. The image may be too large or the server is busy."
      } else if (error.status === 500) {
        errorMessage = "Analysis server error. Please try again later."
      }
    }

    console.error(errorMessage, error)
    this.toastr.error(errorMessage, "Analysis Error")
    return throwError(() => new Error(errorMessage))
  }
}
