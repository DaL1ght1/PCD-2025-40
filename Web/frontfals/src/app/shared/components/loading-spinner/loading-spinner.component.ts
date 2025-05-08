import { Component, Input } from "@angular/core"
import {NgIf} from '@angular/common';

@Component({
  standalone: true,
  selector: "app-loading-spinner",
  templateUrl: "./loading-spinner.component.html",
  styleUrls: ["./loading-spinner.component.scss"],

  imports: [
    NgIf
  ]
})
export class LoadingSpinnerComponent {
  @Input() message?: string
}
