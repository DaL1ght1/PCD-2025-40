import { Component } from '@angular/core';
import  { ActivatedRoute } from "@angular/router"


@Component({
  selector: 'app-case-list',
  imports: [],
  templateUrl: './case-list.component.html',
  styleUrl: './case-list.component.scss',
  standalone: true
})


export class CaseListComponent {
  caseId: string | null = null

  constructor(private route: ActivatedRoute) {
    this.caseId = this.route.snapshot.paramMap.get("caseid")
  }
}
