import { Component, Input } from "@angular/core";
import { NgClass } from '@angular/common';

@Component({
  standalone: true,
  selector: "app-status-badge",
  templateUrl: "./status-badge.component.html",
  styleUrls: ["./status-badge.component.scss"],
  imports: [NgClass]
})
export class StatusBadgeComponent {
  @Input() status = "";

  getBadgeClass(): string {
    const statusLower = this.status.toLowerCase().replace(/_/g, '-');
    return `badge-${statusLower}`;
  }

  getStatusLabel(): string {
    return this.status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }
}
