import { Injectable } from "@angular/core"
import  { MatSnackBar } from "@angular/material/snack-bar"

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  /**
   * Show success notification
   * @param message Success message
   * @param duration Duration in milliseconds
   */
  success(message: string, duration = 3000): void {
    this.showNotification(message, "notification-success", duration)
  }

  /**
   * Show error notification
   * @param message Error message
   * @param duration Duration in milliseconds
   */
  error(message: string, duration = 5000): void {
    this.showNotification(message, "notification-error", duration)
  }

  /**
   * Show warning notification
   * @param message Warning message
   * @param duration Duration in milliseconds
   */
  warning(message: string, duration = 4000): void {
    this.showNotification(message, "notification-warning", duration)
  }

  /**
   * Show info notification
   * @param message Info message
   * @param duration Duration in milliseconds
   */
  info(message: string, duration = 3000): void {
    this.showNotification(message, "notification-info", duration)
  }

  private showNotification(message: string, panelClass: string, duration: number): void {
    this.snackBar.open(message, "Close", {
      duration: duration,
      panelClass: [panelClass],
      horizontalPosition: "end",
      verticalPosition: "top",
    })
  }
}
