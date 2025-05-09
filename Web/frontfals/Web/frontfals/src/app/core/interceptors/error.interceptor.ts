import { Injectable } from "@angular/core"
import  { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from "@angular/common/http"
import {  Observable, throwError } from "rxjs"
import { catchError } from "rxjs/operators"
import  { MatSnackBar } from "@angular/material/snack-bar"
import  { Router } from "@angular/router"
import  { AuthService } from "../services/auth.service"
import  { ToastrService } from "ngx-toastr"

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private snackBar: MatSnackBar,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService,
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = "An unknown error occurred"

        // Skip error handling for certain requests
        if (this.isExcludedEndpoint(request.url)) {
          return throwError(() => error)
        }

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Error: ${error.error.message}`
        } else {
          // Server-side error
          console.error("HTTP Error Status:", error.status, "URL:", request.url, "Response:", error.error)

          switch (error.status) {
            case 400:
              errorMessage = this.parseErrorMessage(error, "Bad request")
              break
            case 401:
              errorMessage = "Your session has expired. Please log in again."
              this.authService.logout()
              this.router.navigate(["/login"])
              break
            case 403:
              errorMessage = this.parseErrorMessage(error, "You do not have permission to access this resource.")
              break
            case 404:
              errorMessage = this.parseErrorMessage(error, "Resource not found.")
              break
            case 500:
              errorMessage = this.parseErrorMessage(error, "Server error. Please try again later.")
              break
            case 0:
              errorMessage = "Network error. Please check your connection."
              break
            default:
              errorMessage = this.parseErrorMessage(error, `Error ${error.status}`)
          }
        }

        // Show error message to user (except for auth-related errors which are handled by the auth service)
        if (error.status !== 401) {
          this.toastr.error(errorMessage, "Error")
        }

        return throwError(() => error)
      }),
    )
  }

  // Helper to extract error message from different response formats
  private parseErrorMessage(error: HttpErrorResponse, defaultMessage: string): string {
    if (error.error) {
      // Try to parse different error formats
      if (typeof error.error === "string") {
        return error.error
      }
      if (error.error.message) {
        return error.error.message
      }
      if (error.error.error) {
        return error.error.error
      }
      if (error.error.errors && Array.isArray(error.error.errors)) {
        return error.error.errors.join(", ")
      }
    }
    return error.message || defaultMessage
  }

  private isExcludedEndpoint(url: string): boolean {
    return url.includes("/auth/check-session") || url.includes("/actuator/")
  }
}
