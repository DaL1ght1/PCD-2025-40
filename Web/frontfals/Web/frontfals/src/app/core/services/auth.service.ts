import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { BehaviorSubject, Observable, of, throwError, timer } from "rxjs";
import { catchError, tap, switchMap, map, retryWhen, delayWhen } from "rxjs/operators";
import { Router } from "@angular/router";
import { environment } from "../../../environments/environment";
import { User } from "../models/user.model";
import { JwtHelperService } from "@auth0/angular-jwt";
import { SecureStorageService } from "./secure-storage.service";
import { AuthRequest, AuthResponse, RegisterRequest, ForgotPasswordRequest, ResetPasswordRequest } from "../models/auth.model";
import { ToastrService } from "ngx-toastr";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private jwtHelper = new JwtHelperService();
  private tokenExpirationTimer: any;
  private readonly refreshBeforeExpiration = 5 * 60 * 1000; // 5 minutes
  private isRefreshingToken = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private secureStorage: SecureStorageService,
    private toastr: ToastrService,
  ) {
    window.addEventListener("storage", (event) => {
      if (event.key === "logout") {
        this.logout();
      }
    });
  }

  login(authRequest: AuthRequest): Observable<AuthResponse> {
    const headers = new HttpHeaders({
      "Content-Type": "application/json",
    });

    return this.http.post<AuthResponse>(`${environment.authApiUrl}/authenticate`, authRequest, { headers }).pipe(
      tap((response) => {
        this.validateAuthResponse(response);
        const roles = this.extractRoles(response);
        this.handleAuthentication(response, roles);
      }),
      switchMap((response) => {
        const userId = response.id || response.user_id || "";
        return this.getUserProfile(userId).pipe(
          tap((user) => {
            user.role = this.secureStorage.getItem("roles") ? JSON.parse(this.secureStorage.getItem("roles")!) : [];
            this.currentUserSubject.next(user);
            this.secureStorage.setItem("userData", JSON.stringify(user));
          }),
          map(() => response),
          catchError((error) => {
            console.warn("Failed to get user profile, using fallback:", error);
            const fallbackUser: User = {
              enabled: true,
              id: userId,
              email: authRequest.email,
              role: this.extractRoles(response),
              firstname: authRequest.email.split("@")[0],
              lastname: "",
            };
            this.currentUserSubject.next(fallbackUser);
            this.secureStorage.setItem("userData", JSON.stringify(fallbackUser));
            return of(response);
          }),
        );
      }),
      catchError((error) => {
        const errorMessage = this.parseError(error);
        console.error("Login error:", error);
        this.toastr.error(errorMessage, "Login Failed");
        return throwError(() => new Error(errorMessage));
      }),
    );
  }




  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.secureStorage.getItem("refreshToken");
    const userId = this.secureStorage.getItem("userId");
    const roles = this.secureStorage.getItem("roles");

    if (!refreshToken || !userId || !roles) {
      console.error("Missing required data for token refresh", { refreshToken, userId, roles });
      this.currentUserSubject.next(null);
      this.logout();
      return throwError(() => new Error("Missing required data for token refresh"));
    }

    const headers = new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: `Bearer ${refreshToken}`,
    });

    return this.http.post<AuthResponse>(`${environment.authApiUrl}/refresh-token`, {}, { headers }).pipe(
      retryWhen((errors) =>
        errors.pipe(
          delayWhen((_, index) => timer(Math.min(1000 * (index + 1), 5000))),
          map((error, index) => {
            if (index >= 2) {
              console.error("Max retries reached for token refresh");
              throw error;
            }
            console.warn(`Retry ${index + 1} for refresh token`);
            return error;
          }),
        ),
      ),
      tap((response) => {
        this.validateAuthResponse(response);
        const roles = this.extractRoles(response);
        this.handleAuthentication(response, roles);

        const responseUserId = response.id || response.user_id || userId;
        if (responseUserId !== userId) {
          console.warn("User ID mismatch:", responseUserId, "vs stored:", userId);
        }

        try {
          const userData = this.secureStorage.getItem("userData");
          if (userData && userData !== "[object Object]" && userData.startsWith("{")) {
            const user: User = JSON.parse(userData);
            user.role = roles;
            this.currentUserSubject.next(user);
            this.secureStorage.setItem("userData", JSON.stringify(user));
          } else {
            this.getUserProfile(responseUserId).subscribe({
              next: (user) => {
                user.role = roles;
                this.currentUserSubject.next(user);
                this.secureStorage.setItem("userData", JSON.stringify(user));
              },
              error: (err) => console.error("Failed to fetch user profile:", err),
            });
          }
        } catch (e) {
          console.warn("Error updating user data:", e);
        }
      }),
      catchError((error) => {
        const errorMessage = this.parseError(error);
        console.error("Token refresh error:", errorMessage, error);
        this.toastr.error("Session expired. Please log in again.", "Session Expired");
        this.logout();
        return throwError(() => new Error(errorMessage));
      }),
    );
  }

  register(registerRequest: RegisterRequest): Observable<any> {
    return this.http.post(`${environment.authApiUrl}/register`, registerRequest).pipe(
      catchError((error) => {
        const errorMessage = this.parseError(error);
        console.error("Registration error:", errorMessage, error);
        this.toastr.error(errorMessage, "Registration Failed");
        return throwError(() => new Error(errorMessage));
      }),
    );
  }

  activateAccount(code: string): Observable<string> {
    return this.http
      .get(`${environment.authApiUrl}/activate`, {
        params: { token: code },
        responseType: 'text', // Expect plain text response
      })
      .pipe(
        tap((response) => {
          if (response.includes('successfully')) {
            this.toastr.success('Account activated successfully', 'Success');
          }
        }),
        catchError((error) => {
          const errorMessage = this.parseError(error);
          console.error('Activation error:', errorMessage, error);
          this.toastr.error(errorMessage, 'Activation Failed');
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Activate account with token
  activateAccountWithToken(token: string): Observable<string> {
    return this.http
      .get(`${environment.authApiUrl}/activate`, {
        params: { token },
        responseType: 'text', // Expect plain text response
      })
      .pipe(
        tap((response) => {
          if (response.includes('successfully')) {
            this.toastr.success('Account activated successfully', 'Success');
          }
        }),
        catchError((error) => {
          const errorMessage = this.parseError(error);
          console.error('Activation error:', errorMessage, error);
          this.toastr.error(errorMessage, 'Activation Failed');
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Resend activation code
  resendActivationCode(email: string): Observable<string> {
    return this.http
      .post(
        `${environment.authApiUrl}/resend-activation`,
        { email },
        { responseType: 'text' } // Expect plain text response
      )
      .pipe(
        tap((response) => {
          if (response.includes('successfully')) {
            this.toastr.success('A new activation code has been sent to your email', 'Success');
          }
        }),
        catchError((error) => {
          const errorMessage = this.parseError(error);
          console.error('Resend activation error:', errorMessage, error);
          this.toastr.error(errorMessage, 'Error');
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<any> {
    return this.http.post(`${environment.authApiUrl}/forgot-password`, request).pipe(
      catchError((error) => {
        const errorMessage = this.parseError(error);
        console.error("Forgot password error:", errorMessage, error);
        this.toastr.error(errorMessage, "Forgot Password Failed");
        return throwError(() => new Error(errorMessage));
      }),
    );
  }

  resetPassword(request: ResetPasswordRequest): Observable<any> {
    return this.http.post(`${environment.authApiUrl}/reset-password`, request).pipe(
      catchError((error) => {
        const errorMessage = this.parseError(error);
        console.error("Reset password error:", errorMessage, error);
        this.toastr.error(errorMessage, "Reset Password Failed");
        return throwError(() => new Error(errorMessage));
      }),
    );
  }

  autoLogin(): void {
    const userData = this.secureStorage.getItem("userData");
    const tokenExpiration = this.secureStorage.getItem("tokenExpiration");
    const token = this.secureStorage.getItem("token");
    const roles = this.secureStorage.getItem("roles");
    const userId = this.secureStorage.getItem("userId");

    if (!userData || !tokenExpiration || !token || !roles || !userId) {
      this.currentUserSubject.next(null);
      return;
    }

    try {
      const user: User = JSON.parse(userData);
      const parsedRoles = JSON.parse(roles);
      if (!userData.startsWith("{") || !Array.isArray(parsedRoles)) {
        throw new Error("Invalid stored data format");
      }

      user.role = parsedRoles;
      const expirationDate = new Date(tokenExpiration);
      const now = new Date();

      if (expirationDate <= now || this.jwtHelper.isTokenExpired(token)) {
        this.attemptRefreshToken();
        return;
      }

      const decodedToken = this.jwtHelper.decodeToken(token);
      if (!decodedToken || decodedToken.sub !== user.email) {
        this.attemptRefreshToken();
        return;
      }

      this.currentUserSubject.next(user);
      this.scheduleTokenRefresh(expirationDate);
    } catch (error) {
      this.clearStorage();
      this.currentUserSubject.next(null);
    }
  }

  private attemptRefreshToken(): void {
    if (this.isRefreshingToken) {
      return;
    }

    const refreshToken = this.secureStorage.getItem("refreshToken");
    const userId = this.secureStorage.getItem("userId");
    const roles = this.secureStorage.getItem("roles");

    if (!refreshToken || !userId || !roles) {
      this.logout();
      return;
    }

    this.isRefreshingToken = true;
    this.refreshToken().subscribe({
      next: () => {
        this.isRefreshingToken = false;
      },
      error: (err) => {
        this.isRefreshingToken = false;
        this.logout();
      },
    });
  }

  public isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) {
      return true;
    }
    try {
      return this.jwtHelper.isTokenExpired(token);
    } catch (e) {
      console.error('Error checking token expiration', e);
      return true;
    }
  }

  getUserProfile(userId: string): Observable<User> {
    if (!userId) {
      return throwError(() => new Error("User ID is required"));
    }

    return this.http.get<User>(`${environment.userApiUrl}/${userId}`).pipe(
      retryWhen((errors) =>
        errors.pipe(
          delayWhen((_, index) => timer(Math.min(1000 * (index + 1), 3000))),
          map((error, index) => {
            if (index >= 2) throw error;
            console.warn(`Retry ${index + 1} for user profile`);
            return error;
          }),
        ),
      ),
      catchError((error) => {
        console.error("Failed to fetch user profile:", error);
        return throwError(() => new Error("Unable to fetch user profile"));
      }),
    );
  }

  logout(): void {
    localStorage.setItem("logout", Date.now().toString());
    this.clearStorage();
    this.currentUserSubject.next(null);
    this.isRefreshingToken = false;

    this.router.navigate(["/"]).then(() => {
      this.toastr.info("You have been logged out", "Logged Out");
    });
  }

  private clearStorage(): void {
    this.secureStorage.clear();
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      return !this.jwtHelper.isTokenExpired(token);
    } catch (error) {
      console.error("Error checking token:", error);
      return false;
    }
  }

  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    return !!(user && user.role && user.role.includes(role));
  }

  getToken(): string | null {
    return this.secureStorage.getItem("token");
  }

  getUserRole(): Observable<string[]> {
    const user = this.currentUserSubject.value;
    return of(user && user.role ? user.role : []);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private handleAuthentication(response: AuthResponse, roles: string[]): void {
    if (!response.access_token || !response.refresh_token) {
      throw new Error("Invalid authentication response: Missing tokens");
    }

    try {
      const decodedToken = this.jwtHelper.decodeToken(response.access_token);
      if (!decodedToken || !decodedToken.exp) {
        throw new Error("Invalid token format: Missing expiration");
      }

      const userId = response.id || response.user_id || this.secureStorage.getItem("userId") || "";
      const expirationDate = new Date(decodedToken.exp * 1000);
      this.secureStorage.setItem("token", response.access_token);
      this.secureStorage.setItem("refreshToken", response.refresh_token);
      this.secureStorage.setItem("tokenExpiration", expirationDate.toISOString());
      this.secureStorage.setItem("userId", userId);
      this.secureStorage.setItem("roles", JSON.stringify(roles));

      this.scheduleTokenRefresh(expirationDate);
    } catch (error) {
      console.error("Error in handleAuthentication:", error);
      throw error;
    }
  }

  private scheduleTokenRefresh(expirationDate: Date): void {
    const expiresIn = expirationDate.getTime() - new Date().getTime();
    const refreshTime = Math.max(expiresIn - this.refreshBeforeExpiration, 0);

    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }

    this.tokenExpirationTimer = setTimeout(() => {
      this.attemptRefreshToken();
    }, refreshTime);
  }

  private validateAuthResponse(response: AuthResponse): void {
    if (!response || !response.access_token) {
      throw new Error("Invalid authentication response: Missing access_token");
    }
    if (!response.refresh_token) {
      throw new Error("Invalid authentication response: Missing refresh_token");
    }
    if (this.jwtHelper.isTokenExpired(response.access_token)) {
      throw new Error("Received expired access token");
    }
  }

  private extractRoles(response: AuthResponse): string[] {
    try {
      const decodedToken = this.jwtHelper.decodeToken(response.access_token);
      if (response.role && typeof response.role === "string") {
        return [`ROLE_${response.role}`];
      } else if (Array.isArray(decodedToken.roles)) {
        return decodedToken.roles;
      } else if (Array.isArray(decodedToken.authorities)) {
        return decodedToken.authorities;
      } else if (typeof decodedToken.role === "string") {
        return [`ROLE_${decodedToken.role}`];
      }
      const storedRoles = this.secureStorage.getItem("roles");
      return storedRoles && storedRoles.startsWith("[") ? JSON.parse(storedRoles) : ["ROLE_USER"];
    } catch (e) {
      console.warn("Error extracting roles:", e);
      return ["ROLE_USER"];
    }
  }

  private parseError(error: any): string {
    if (!error) return "Unknown error occurred";
    if (error.status === 0) return "Cannot connect to server. Check your network.";
    if (error.status === 401) return error.error?.error || "Invalid credentials or session expired";
    if (error.status === 403) {
      if (error.error?.error?.includes("Invalid refresh token")) {
        return "Session expired: Invalid refresh token";
      }
      if (error.error?.error?.includes("User not found")) {
        return "User account not found";
      }
      return error.error?.error || "Access denied: Insufficient permissions";
    }
    if (error.status === 400) {
      if (error.error?.error) return error.error.error;
      if (error.error?.errors && Array.isArray(error.error.errors)) return error.error.errors.join(", ");
      return "Bad request: Invalid data provided";
    }
    if (error.status >= 500) return "Server error. Try again later.";
    return error.error?.error || error.message || "An unexpected error occurred";
  }

  public updateCurrentUser(user: User): void {
    if (!user) {
      console.error("Attempting to update user with null value");
      return;
    }

    if (!user.role || user.role.length === 0) {
      const rolesStr = this.secureStorage.getItem("roles");
      user.role = rolesStr && rolesStr.startsWith("[") ? JSON.parse(rolesStr) : [];
    }

    this.currentUserSubject.next(user);
    this.secureStorage.setItem("userData", JSON.stringify(user));
  }
}
