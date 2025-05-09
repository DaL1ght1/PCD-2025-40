import { Injectable } from "@angular/core"
import  { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from "@angular/common/http"
import  { Observable } from "rxjs"

@Injectable()
export class CorsInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Clone the request and add CORS headers
    const corsRequest = request.clone({
      setHeaders: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Origin, Content-Type, Accept, Authorization, X-Requested-With",
      },
      withCredentials: true, // Include cookies in cross-site requests
    })

    return next.handle(corsRequest)
  }
}
