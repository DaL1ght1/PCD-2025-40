import { Component,  OnInit,  OnDestroy } from "@angular/core"
import { CommonModule } from "@angular/common"
import  { Subscription } from "rxjs"
import  { ToastService, Toast } from "../../../core/services/toast.service"

@Component({
  selector: "app-toast-container",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container position-fixed bottom-0 end-0 p-3">
      <div
        *ngFor="let toast of toasts"
        class="toast show"
        [ngClass]="getToastClass(toast.type)"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div class="toast-header">
          <strong class="me-auto">{{ getToastTitle(toast.type) }}</strong>
          <button type="button" class="btn-close" (click)="removeToast(toast.id)"></button>
        </div>
        <div class="toast-body">
          {{ toast.message }}
        </div>
      </div>
    </div>
  `,
  styles: [
    `
    .toast-container {
      z-index: 1100;
    }
  `,
  ],
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  toasts: Toast[] = []
  private subscription: Subscription | null = null

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.subscription = this.toastService.toasts$.subscribe((toasts) => {
      this.toasts = toasts
    })
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  removeToast(id: number): void {
    this.toastService.remove(id)
  }

  getToastClass(type: string): string {
    switch (type) {
      case "success":
        return "bg-success text-white"
      case "error":
        return "bg-danger text-white"
      case "warning":
        return "bg-warning"
      case "info":
        return "bg-info"
      default:
        return ""
    }
  }

  getToastTitle(type: string): string {
    switch (type) {
      case "success":
        return "Success"
      case "error":
        return "Error"
      case "warning":
        return "Warning"
      case "info":
        return "Information"
      default:
        return "Notification"
    }
  }
}
