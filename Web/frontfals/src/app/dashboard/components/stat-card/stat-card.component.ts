import { Component, Input } from "@angular/core"
import {NgClass} from '@angular/common';

@Component({
  selector: "app-stat-card",
  templateUrl: "./stat-card.component.html",
  styleUrls: ["./stat-card.component.scss"],
  imports: [
    NgClass
  ],
  standalone: true
})
export class StatCardComponent {
  @Input() title = ""
  @Input() value: number | string = 0
  @Input() icon = "fas fa-chart-line"
  @Input() color = "primary" // primary, info, success, warning, danger
}
