import { Component, Input } from "@angular/core";
import {CaseDTO} from "../../../core/models/case.model";
import {StatusBadgeComponent} from '../../../shared/components/status-badge/status-badge.component';
import {DatePipe, NgForOf, NgIf} from '@angular/common';
import {RouterLink} from '@angular/router';

@Component({
  selector: "app-recent-cases",
  templateUrl: "./recent-cases.component.html",
  imports: [
    StatusBadgeComponent,
    DatePipe,
    RouterLink,
    NgForOf,
    NgIf

  ],
  standalone: true
})
export class RecentCasesComponent {
  @Input({required:true}) cases: CaseDTO[] = []
}
