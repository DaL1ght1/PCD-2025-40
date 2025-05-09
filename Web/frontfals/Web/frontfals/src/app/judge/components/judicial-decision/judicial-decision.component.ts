import { Component,  OnInit } from "@angular/core"
import  { CaseService } from "../../../core/services/case.service"
import  { ToastrService } from "ngx-toastr"
import { LoadingSpinnerComponent } from "../../../shared/components/loading-spinner/loading-spinner.component"
import { DatePipe, NgClass, NgForOf, NgIf } from "@angular/common"
import { StatusBadgeComponent } from "../../../shared/components/status-badge/status-badge.component"
import { RouterLink } from "@angular/router"
import { CaseStatus } from "../../../core/models/case.model"
import { finalize, catchError } from "rxjs/operators"
import { of } from "rxjs"

interface JudicialDecisionView {
  id: string
  caseNumber: string
  title: string
  verdict?: string
  judicialNotes?: string
  closedAt?: string
  status: CaseStatus
}

@Component({
  selector: "app-judicial-decision",
  templateUrl: "./judicial-decision.component.html",
  styleUrls: ["./judicial-decision.component.scss"],
  standalone: true,
  imports: [LoadingSpinnerComponent, NgIf, NgClass, NgForOf, StatusBadgeComponent, RouterLink, DatePipe],
})
export class JudicialDecisionComponent implements OnInit {
  decisions: JudicialDecisionView[] = []
  loading = false
  currentPage = 0
  pageSize = 10
  totalElements = 0
  totalPages = 0
  sortBy = "closedAt"
  sortDirection: "ASC" | "DESC" = "DESC"

  constructor(
    private caseService: CaseService,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.loadJudicialDecisions()
  }

  loadJudicialDecisions(): void {
    this.loading = true
    this.caseService
      .searchCases(
        undefined, // title
        CaseStatus.COMPLETED, // status
        undefined, // investigatorId
        undefined, // expertId
        undefined, // startDate
        undefined, // closedAt
        this.currentPage,
        this.pageSize,
        this.sortBy,
        this.sortDirection,
      )
      .pipe(
        finalize(() => (this.loading = false)),
        catchError((error) => {
          console.error("Failed to load judicial decisions:", error)
          this.toastr.error(error.message || "Failed to load judicial decisions", "Error")
          return of({ cases: [], totalElements: 0, totalPages: 0, currentPage: 0 })
        }),
      )
      .subscribe((response) => {
        this.decisions = (response.cases || [])
          .filter((c) => c.status === CaseStatus.COMPLETED && c.verdict)
          .map((caseDTO) => ({
            id: caseDTO.id,
            caseNumber: caseDTO.caseNumber,
            title: caseDTO.title,
            verdict: caseDTO.verdict,
            judicialNotes: caseDTO.judicialNotes,
            closedAt: caseDTO.closedAt,
            status: caseDTO.status,
          }))

        this.totalElements = response.totalElements || 0
        this.totalPages = response.totalPages || 0
        this.currentPage = response.currentPage || 0
      })
  }

  getDecisionClass(verdict?: string): string {
    if (!verdict) return "bg-secondary"
    switch (verdict.toLowerCase()) {
      case "authentic":
        return "bg-success"
      case "falsified":
        return "bg-danger"
      case "inconclusive":
        return "bg-warning"
      default:
        return "bg-secondary"
    }
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page
      this.loadJudicialDecisions()
    }
  }

  sort(field: string): void {
    if (this.sortBy === field) {
      // Toggle direction if clicking the same field
      this.sortDirection = this.sortDirection === "ASC" ? "DESC" : "ASC"
    } else {
      this.sortBy = field
      this.sortDirection = "DESC"
    }
    this.loadJudicialDecisions()
  }

  getSortIcon(field: string): string {
    if (this.sortBy !== field) return "fa-sort"
    return this.sortDirection === "ASC" ? "fa-sort-up" : "fa-sort-down"
  }
}
