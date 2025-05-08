import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SecureStorageService } from '../services/secure-storage.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private secureStorage: SecureStorageService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const tokens = JSON.parse(this.secureStorage.getItem('auth_tokens') || '{}');
    const accessToken = tokens.access_token;
    if (accessToken) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }
    return next.handle(request);
  }
}
