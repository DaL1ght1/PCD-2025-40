import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import {Observable, of, throwError} from "rxjs";
import { environment } from "../../../environments/environment";
import { User } from "../models/user.model";
import { SystemStats } from "../models/stats.model";
import { catchError, map, retry } from "rxjs/operators";
import { NotificationService } from './notification.service';

export interface CreateUserRequest {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  role: string; // Matches backend CreateUserRequest's Role enum (e.g., "JUDGE")
  active: boolean;
  address?: string;
}

export interface UpdateUserRequest {
  firstname?: string;
  lastname?: string;
  email?: string;
  password?: string;
  role?: string[]; // Matches backend UpdateUserRequest's Role enum
  active?: boolean;
  address?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any;
}

@Injectable({
  providedIn: "root"
})
export class AdminService {
  private adminApiUrl = environment.adminApiUrl;
  private userApiUrl = environment.userApiUrl;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {
    console.log('NotificationService in AdminService:', notificationService);
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.adminApiUrl}/users`).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  createUser(userData: CreateUserRequest): Observable<User> {
    return this.http.post<ApiResponse<User>>(this.userApiUrl, userData).pipe(
      map(response => {
        if (response.success && response.data) {
          this.notificationService.success('User created successfully');
          return response.data;
        }
        throw new Error(response.message || 'Failed to create user');
      }),
      catchError(this.handleError)
    );
  }

  updateUser(id: string, userData: UpdateUserRequest): Observable<User | undefined> {
    return this.http.put<ApiResponse<User>>(`${this.adminApiUrl}/${id}`, userData).pipe(
      map(response => {
        if (response.success && response.data) {
          this.notificationService.success('User updated successfully');
          return response.data;
        }
        throw new Error(response.message || 'Failed to update user');
      }),
      catchError(this.handleError)
    );
  }

  deleteUser(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<boolean> | null>(`${this.adminApiUrl}/${id}`).pipe(
      map(response => {
        // Handle cases where response is null (e.g., HTTP 204 No Content) or unexpected
        if (!response || response.success) {
          this.notificationService.success('User deleted successfully');
          return true;
        }
        throw new Error(response.message || 'Failed to delete user');
      }),
      catchError(this.handleError)
    );
  }

  getSystemStats(): Observable<SystemStats> {
    return this.http.get<SystemStats>(`${this.adminApiUrl}/stats`).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  bulkDeleteUsers(ids: string[]): Observable<boolean> {
    return this.http.post<ApiResponse<boolean>>(`${this.adminApiUrl}/bulk-delete`, { ids }).pipe(
      map(response => {
        if (response.success) {
          this.notificationService.success(`${ids.length} users deleted successfully`);
          return true;
        }
        throw new Error(response.message || 'Failed to delete users');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get distribution of users by role
   */
  getRoleDistribution(): Observable<any> {
    return this.http.get<any>(`${this.adminApiUrl}/role-distribution`).pipe(
      catchError(() => {
        // If API fails, return mock data for development
        return of({
          admin: 5,
          expert: 12,
          investigator: 18,
          lawyer: 9,
          judge: 4
        });
      })
    );
  }

  /**
   * Get role activity over time
   * @param timeframe - week, month, or year
   */
  getRoleActivity(timeframe: string): Observable<any> {
    return this.http.get<any>(`${this.adminApiUrl}/role-activity?timeframe=${timeframe}`).pipe(
      catchError(() => {
        // If API fails, return mock data
        let timeLabels: string[];
        let mockData: any = { timeLabels: [], activities: {} };

        switch (timeframe) {
          case 'week':
            timeLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            break;
          case 'month':
            timeLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            break;
          case 'year':
            timeLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            break;
          default:
            timeLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        }

        mockData.timeLabels = timeLabels;
        mockData.activities = {
          admin: this.generateRandomData(timeLabels.length, 10, 30),
          expert: this.generateRandomData(timeLabels.length, 20, 60),
          investigator: this.generateRandomData(timeLabels.length, 30, 80),
          lawyer: this.generateRandomData(timeLabels.length, 15, 45),
          judge: this.generateRandomData(timeLabels.length, 5, 25)
        };

        return of(mockData);
      })
    );
  }

  /**
   * Get cases handled by each role
   */
  getCasesByRole(): Observable<any> {
    return this.http.get<any>(`${this.adminApiUrl}/by-role`).pipe(
      catchError(() => {
        // Mock data
        return of({
          admin: 15,
          expert: 87,
          investigator: 124,
          lawyer: 93,
          judge: 48
        });
      })
    );
  }

  /**
   * Get efficiency metrics for each role
   */
  getRoleEfficiency(): Observable<any> {
    return this.http.get<any>(`${this.adminApiUrl}/role-efficiency`).pipe(
      catchError(() => {
        // Mock data
        return of({
          'Case Processing': 85,
          'Response Time': 72,
          'Documentation Quality': 91,
          'Collaboration': 68,
          'Decision Making': 79
        });
      })
    );
  }

  /**
   * Generate random data within range for mocking
   */
  private generateRandomData(length: number, min: number, max: number): number[] {
    return Array(length).fill(0).map(() => Math.floor(Math.random() * (max - min + 1)) + min);
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = "An unknown error occurred";

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = error.error?.message || `Error Code: ${error.status || 'unknown'}, Message: ${error.message}`;
    }

    this.notificationService.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
