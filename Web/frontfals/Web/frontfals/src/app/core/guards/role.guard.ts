import { Injectable } from "@angular/core"
import {CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree} from "@angular/router"
import  { AuthService } from "../services/auth.service"
import  { ToastrService } from "ngx-toastr"
import {catchError, map} from 'rxjs/operators';
import {Observable, of} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | boolean | UrlTree {
    const requiredRoles = route.data['roles'] as Array<string>;

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    return this.authService.getUserRole().pipe(
      map(userRoles => {
        const hasRole = userRoles.some(role => requiredRoles.includes(role));
        if (hasRole) {
          return true;
        }
        this.toastr.error('You do not have permission to access this page', 'Access Denied');
        return this.router.createUrlTree(['/dashboard']);
      }),
      catchError(() => {
        this.toastr.error('Error checking user role', 'Access Denied');
        return of(this.router.createUrlTree(['/dashboard']));
      })
    );
  }
}
