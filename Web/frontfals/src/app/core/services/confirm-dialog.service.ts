import { Injectable } from "@angular/core"

@Injectable({
  providedIn: "root",
})
export class ConfirmDialogService {
  constructor() {}

  confirm(title: string, message: string, callback: () => void): void {
    const result = window.confirm(`${title}\n\n${message}`)

    if (result) {
      callback()
    }
  }
}
