import { Component, Input } from "@angular/core"
import {NgClass} from '@angular/common';


@Component({
  standalone: true,
  selector: "app-filter",
  templateUrl: "./filter.component.html",
  styleUrls: ["./filter.component.scss"],

  imports: [
    NgClass
  ]
})
export class FilterComponent {
  @Input() title = "Filter"
  @Input() isCollapsed = false

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed
  }
}
