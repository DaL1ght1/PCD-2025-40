import { Component, Input, Output, EventEmitter } from "@angular/core"
import {NgClass, NgIf} from '@angular/common';



@Component({
  imports: [
    NgIf,
    NgClass

  ],
  standalone: true,
  selector: "app-alert",
  templateUrl: "./alert.component.html",
  styleUrls: ["./alert.component.scss"],

})
export class AlertComponent {
  @Input() type: "success" | "info" | "warning" | "danger" = "info"
  @Input() title?: string
  @Input() message = ""
  @Input() dismissible = true
  @Input() visible = true
  @Output() closed = new EventEmitter<void>()

  close(): void {
    this.visible = false
    this.closed.emit()
  }
}
