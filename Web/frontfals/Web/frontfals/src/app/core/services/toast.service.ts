import { Injectable } from "@angular/core"
import { Subject } from "rxjs"

export interface Toast {
  message: string
  type: "success" | "error" | "info" | "warning"
  id: number
}

@Injectable({
  providedIn: "root",
})
export class ToastService {
  private toasts: Toast[] = []
  private toastSubject = new Subject<Toast[]>()
  toasts$ = this.toastSubject.asObservable()
  private nextId = 1

  constructor() {}

  show(message: string, type: "success" | "error" | "info" | "warning" = "info"): void {
    const toast: Toast = {
      message,
      type,
      id: this.nextId++,
    }

    this.toasts.push(toast)
    this.toastSubject.next([...this.toasts])

    // Auto-remove after 5 seconds
    setTimeout(() => {
      this.remove(toast.id)
    }, 5000)
  }

  remove(id: number): void {
    this.toasts = this.toasts.filter((t) => t.id !== id)
    this.toastSubject.next([...this.toasts])
  }

  clear(): void {
    this.toasts = []
    this.toastSubject.next([])
  }
}
