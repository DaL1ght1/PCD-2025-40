import { Injectable } from "@angular/core"
import {  HttpClient,HttpErrorResponse, HttpParams } from "@angular/common/http"
import {  Observable, throwError } from "rxjs"
import { catchError } from "rxjs/operators"
import { environment } from "../../../environments/environment"
import  { ToastrService } from "ngx-toastr"

@Injectable({
  providedIn: "root",
})
export class ApiService {
  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
  ) {}

  private formatErrors(error: HttpErrorResponse) {
    let message = "An unexpected error occurred"
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      message = `Error: ${error.error.message}`
    } else {
      // Server-side error
      message = `Error Code: ${error.status}\nMessage: ${error.error.message || error.message}`
    }
    console.error(message)
    this.toastr.error(message, "API Error")
    return throwError(() => error)
  }

  get<T>(path: string, params: HttpParams = new HttpParams()): Observable<T> {
    return this.http.get<T>(`${environment.apiUrl}${path}`, { params }).pipe(catchError(this.formatErrors.bind(this)))
  }

  post<T>(path: string, body: any = {}): Observable<T> {
    return this.http.post<T>(`${environment.apiUrl}${path}`, body).pipe(catchError(this.formatErrors.bind(this)))
  }

  put<T>(path: string, body: any = {}): Observable<T> {
    return this.http.put<T>(`${environment.apiUrl}${path}`, body).pipe(catchError(this.formatErrors.bind(this)))
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${environment.apiUrl}${path}`).pipe(catchError(this.formatErrors.bind(this)))
  }

  upload<T>(path: string, formData: FormData): Observable<T> {
    return this.http
      .post<T>(`${environment.apiUrl}${path}`, formData, {
        reportProgress: true,
        observe: "body",
      })
      .pipe(catchError(this.formatErrors.bind(this)))
  }

  download(path: string, params: HttpParams = new HttpParams()): Observable<Blob> {
    return this.http
      .get(`${environment.apiUrl}${path}`, {
        params,
        responseType: "blob",
      })
      .pipe(catchError(this.formatErrors.bind(this)))
  }
}
