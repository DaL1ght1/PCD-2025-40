import { Injectable } from "@angular/core"
import  { HttpClient, HttpErrorResponse } from "@angular/common/http"
import {  Observable, of, throwError } from "rxjs"
import  { User } from "../models/user.model"
import { environment } from "../../../environments/environment"
import  { NotificationService } from "./notification.service"
import {catchError, map, retry, tap} from 'rxjs/operators';

export interface CreateUserRequest {
  firstname: string
  lastname: string
  email: string
  roles: string[]
  status: "Active" | "Inactive" | "Pending"
  password?: string
  enabled?: boolean
}

export interface UpdateUserRequest {
  firstname?: string
  lastname?: string
  email?: string
  roles?: string[]
  status?: "Active" | "Inactive" | "Pending"
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  errors?: any
}

@Injectable({
  providedIn: "root",
})
export class UserService {
  private userApiUrl = `${environment.userApiUrl}`;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
  ) {}

  /**
   * Get all users
   * @returns Observable of User array
   */
  getUsers(): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>(`${this.userApiUrl}/get-all`).pipe(
      map(response => response.data || []),
      catchError(this.handleError)
    );
  }

  /**
   * Get a user by ID
   * @param id User ID
   * @returns Observable of User or undefined
   */
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.userApiUrl}/${id}`).pipe(
      retry(1),
      catchError((error) => {
        console.error("Error loading user:", error)
        throw error
      }),
    )
  }

  /**
   * Create a new user
   * @param userData User data to create
   * @returns Observable of created User
   */
  createUser(userData: CreateUserRequest): Observable<User> {

    return this.http.post<ApiResponse<User>>(this.userApiUrl, userData).pipe(
      map(response => {
        if (response.success && response.data) {
          this.notificationService.success('User created successfully');
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to create user');
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Update an existing user
   * @param id User ID
   * @param userData User data to update
   * @returns Observable of updated User or undefined
   */
  updateUser(id: string, userData: UpdateUserRequest): Observable<User | undefined> {

    return this.http.put<ApiResponse<User>>(`${this.userApiUrl}/${id}`, userData).pipe(
      map(response => {
        if (response.success && response.data) {
          this.notificationService.success('User updated successfully');
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to update user');
        }
      }),
      catchError(this.handleError)
    );

  }

  /**
   * Delete a user
   * @param id User ID
   * @returns Observable of success boolean
   */
  deleteUser(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<boolean>>(`${this.userApiUrl}/${id}`).pipe(
      map(response => {
        if (response.success) {
          this.notificationService.success('User deleted successfully');
          return true;
        } else {
          throw new Error(response.message || 'Failed to delete user');
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Bulk delete users
   * @param ids Array of user IDs to delete
   * @returns Observable of success boolean
   */
  bulkDeleteUsers(ids: string[]): Observable<boolean> {
    return this.http.post<ApiResponse<boolean>>(`${this.userApiUrl}/bulk-delete`, { ids }).pipe(
      map(response => {
        if (response.success) {
          this.notificationService.success(`${ids.length} users deleted successfully`);
          return true;
        } else {
          throw new Error(response.message || 'Failed to delete users');
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Handle HTTP errors
   * @param error HTTP error
   * @returns Observable error
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = "An unknown error occurred"

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`
    } else {
      // Server-side error
      errorMessage = error.error?.message || `Error Code: ${error.status}, Message: ${error.message}`
    }

    this.notificationService.error(errorMessage)
    return throwError(() => new Error(errorMessage))
  }
}
