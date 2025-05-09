import { Injectable } from "@angular/core"
import {  HttpClient, type HttpErrorResponse, HttpParams } from "@angular/common/http"
import {  Observable, throwError } from "rxjs"
import { catchError, tap } from "rxjs/operators"
import { environment } from "../../../environments/environment"
import  { ReportResponse, BackendReportCreationRequest, ReportComparisonResultDTO } from "../models/report.model"
import  { ToastrService } from "ngx-toastr"

@Injectable({
  providedIn: "root",
})
export class ReportService {
  private reportsApiUrl = `${environment.reportsApiUrl}`

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
  ) {}

  createReport(request: BackendReportCreationRequest): Observable<ReportResponse> {
    return this.http.post<ReportResponse>(this.reportsApiUrl, request).pipe(catchError(this.handleError))
  }

  getReport(reportId: string): Observable<ReportResponse> {
    return this.http.get<ReportResponse>(`${this.reportsApiUrl}/${reportId}`).pipe(catchError(this.handleError))
  }

  getReportsByCase(caseId: string): Observable<ReportResponse[]> {
    console.log(`Fetching reports for case: ${caseId} from ${this.reportsApiUrl}/case/${caseId}`)
    return this.http.get<ReportResponse[]>(`${this.reportsApiUrl}/case/${caseId}`).pipe(
      tap((reports) => console.log(`Retrieved ${reports.length} reports for case ${caseId}:`, reports)),
      catchError(this.handleError),
    )
  }

  getAutoGenerated(imageId: string): Observable<ReportResponse[]> {
    return this.http
      .get<ReportResponse[]>(`${this.reportsApiUrl}/auto-generated/${imageId}`)
      .pipe(catchError(this.handleError))
  }

  exportReport(reportId: string): Observable<Blob> {
    return this.http
      .get(`${this.reportsApiUrl}/export/${reportId}`, {
        responseType: "blob",
      })
      .pipe(catchError(this.handleError))
  }

  compareReports(reportId1: string, reportId2: string): Observable<ReportComparisonResultDTO> {
    const params = new HttpParams().set("reportId1", reportId1).set("reportId2", reportId2)

    return this.http
      .get<ReportComparisonResultDTO>(`${this.reportsApiUrl}/compare`, { params })
      .pipe(catchError(this.handleError))
  }

  createNewVersion(reportId: string, reason: string): Observable<ReportResponse> {
    const params = new HttpParams().set("reason", reason)

    return this.http
      .post<ReportResponse>(`${this.reportsApiUrl}/${reportId}/version`, {}, { params })
      .pipe(catchError(this.handleError))
  }

  getReportsByExpert(expertId: string): Observable<ReportResponse[]> {
    return this.http
      .get<ReportResponse[]>(`${this.reportsApiUrl}/expert/${expertId}`)
      .pipe(catchError(this.handleError))
  }

  private handleError(error: HttpErrorResponse) {
    console.error("ReportService Error:", error)
    let errorMessage = "An unknown error occurred!"

    if (error.status === 400 && error.error && error.error.errors) {
      let validationErrorMessage = "Validation failed: \n"
      for (const field in error.error.errors) {
        if (error.error.errors.hasOwnProperty(field)) {
          validationErrorMessage += `${field}: ${error.error.errors[field]}\n`
        }
      }
      errorMessage = validationErrorMessage
    } else if (error.error?.message) {
      errorMessage = `Backend Error: ${error.error.message}`
    } else if (error.status === 0) {
      errorMessage = "Network error: Could not connect to the server."
    } else {
      errorMessage = `Error Code: ${error.status}, Message: ${error.message}`
    }

    return throwError(() => new Error(errorMessage))
  }

  /**
   * Downloads an expert report PDF by report ID
   * @param reportId The ID of the reportId
   * @returns Observable of blob data for the PDF file
   */
  downloadExpertReport(reportId: string): Observable<Blob> {
    const url = `${this.reportsApiUrl}/export/${reportId}`
    return this.http.get(url, {
      responseType: "blob",
    })
  }

  /**
   * Downloads and triggers the browser to save an expert report PDF
   * @param reportId The ID of the expert
   * @param filename Optional custom filename for the downloaded PDF
   */
  downloadAndSaveExpertReport(reportId: string, filename?: string): void {
    const pdfFilename = filename || `expert-report-${reportId}.pdf`

    this.downloadExpertReport(reportId).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = pdfFilename
      link.click()
      window.URL.revokeObjectURL(url)
    })
  }
}
