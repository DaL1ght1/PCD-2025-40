import { Injectable } from "@angular/core"
import  { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from "@angular/common/http"
import  { Observable } from "rxjs"
import { environment } from "../../../environments/environment"

@Injectable()
export class BaseUrlInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip modification for absolute URLs and OPTIONS requests (CORS preflight)
    if (req.url.startsWith("http://") || req.url.startsWith("https://") || req.method === "OPTIONS") {
      return next.handle(req)
    }

    // Use gateway URL for all API requests
    const apiReq = req.clone({
      url: `${environment.gatewayUrl}${req.url.startsWith("/") ? req.url : "/" + req.url}`,
    })

    // For debugging
    console.debug("Request URL after BaseUrlInterceptor:", apiReq.url)
    return next.handle(apiReq)
  }
}
