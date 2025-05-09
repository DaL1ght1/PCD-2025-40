import { Injectable } from "@angular/core"
import {  HttpClient, HttpHeaders } from "@angular/common/http"
import {  Observable, of } from "rxjs"
import { catchError, map, timeout } from "rxjs/operators"
import { environment } from "../../../environments/environment"

@Injectable({
  providedIn: "root",
})
export class HealthCheckService {
  constructor(private http: HttpClient) {}

  /**
   * Check if the backend is reachable by making a request to actuator/health
   */
  checkBackendStatus(): Observable<boolean> {
    // Use the actuator health endpoint
    return this.http
      .get(`${environment.gatewayUrl}/actuator/health`, {
        headers: new HttpHeaders({
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        }),
      })
      .pipe(
        timeout(5000), // 5 second timeout
        map((response: any) => {
          // Check if the response indicates the service is up
          return response && response.status === "UP"
        }),
        catchError((error) => {
          console.warn("Backend health check failed:", error.status, error.message)
          // If we get a 403 or 404, the server is at least reachable
          if (error.status === 403 || error.status === 404 || error.status === 200) {
            return of(true)
          }
          return of(false)
        }),
      )
  }

  /**
   * Alternative method that just checks if the server responds at all
   * Even a 403 means the server is running
   */
  isServerReachable(): Observable<boolean> {
    return this.http
      .options(`${environment.gatewayUrl}/actuator/health`, {
        headers: new HttpHeaders({
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        }),
      })
      .pipe(
        timeout(3000),
        map(() => true),
        catchError((error) => {
          // If we get any HTTP status code, the server is reachable
          if (error.status > 0) {
            return of(true)
          }
          // Only network errors (status 0) mean the server is unreachable
          console.warn("Server completely unreachable:", error)
          return of(false)
        }),
      )
  }
}
