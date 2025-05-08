import { Injectable } from "@angular/core"
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from "@angular/common/http"
import {BehaviorSubject, filter, Observable, take, throwError} from "rxjs"
import { catchError, switchMap } from "rxjs/operators"
import { AuthService } from "../services/auth.service"
import { Router } from "@angular/router"
import { ToastrService } from "ngx-toastr"

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null)

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService,
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip intercepting certain requests (like login)
    if (this.shouldSkipInterception(request.url)) {
      return next.handle(request)
    }

    // Add auth token if available
    const token = this.authService.getToken()
    if (token) {
      request = this.addToken(request, token)
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle specific status codes
        if (error.status === 401) {
          return this.handle401Error(request, next)
        } else if (error.status === 403) {
          // Log the forbidden error with details
          console.error(`Access denied (403): ${request.url}`, error)
          this.toastr.error("Access denied. You do not have permission to access this resource.", "Forbidden")
          return throwError(() => error)
        }
        return throwError(() => error)
      }),
    )
  }

  private shouldSkipInterception(url: string): boolean {
    // Skip authentication for these endpoints
    return (
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/authenticate") ||
      url.includes("/assets/") ||
      url.includes("/auth/refresh-token") ||
      url.includes("/auth/csrf") ||
      url.includes("/public/") || // Add public endpoints to skip
      url.includes("/actuator/") // Add health checks to skip
    )
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true
      this.refreshTokenSubject.next(null)

      return this.authService.refreshToken().pipe(
        switchMap((response: any) => {
          this.isRefreshing = false
          // Extract token from response
          const token = response.access_token || response.token || response
          this.refreshTokenSubject.next(token)

          return next.handle(this.addToken(request, token))
        }),
        catchError((error) => {
          this.isRefreshing = false
          this.authService.logout()
          this.router.navigate(["/login"])
          return throwError(() => error)
        }),
      )
    } else {
      return this.refreshTokenSubject.pipe(
        filter((token) => token != null),
        take(1),
        switchMap((token) => {
          return next.handle(this.addToken(request, token))
        }),
      )
    }
  }
}
