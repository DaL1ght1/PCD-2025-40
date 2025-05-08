import { Component,  OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterLink } from "@angular/router"
import  { CaseService } from "../../../core/services/case.service"
import  { AuthService } from "../../../core/services/auth.service"
import  { ToastrService } from "ngx-toastr"
import {CaseDTO, CaseStatus} from "../../../core/models/case.model"
import { LoadingSpinnerComponent } from "../../../shared/components/loading-spinner/loading-spinner.component"
import { StatusBadgeComponent } from "../../../shared/components/status-badge/status-badge.component"
import { forkJoin, of } from "rxjs"
import { catchError, finalize, map } from "rxjs/operators"

interface CaseMetrics {
  totalCases: number
  pendingReview: number
  completedCases: number
  recentDecisions: CaseDTO[]
}

@Component({
  selector: "app-judge-dashboard",
  templateUrl: "./judge-dashboard.component.html",
  styleUrls: ["./judge-dashboard.component.scss"],
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent, StatusBadgeComponent],
})
export class JudgeDashboardComponent implements OnInit {
  metrics: CaseMetrics = {
    totalCases: 0,
    pendingReview: 0,
    completedCases: 0,
    recentDecisions: [],
  }
  loading = true
  error: string | null = null
  recentCases: CaseDTO[] = []

  constructor(
    private caseService: CaseService,
    private authService: AuthService,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.loadDashboardData()
  }

  loadDashboardData(): void {
    this.loading = true
    this.error = null

    // Load all required data in parallel using the correct searchCases parameters
    forkJoin({
      allCases: this.caseService
        .searchCases(
          undefined, // title
          undefined, // status
          undefined, // investigatorId
          undefined, // expertId
          undefined, // startDate
          undefined, // closedAt
          0, // page
          1, // size (we only need the count)
          "createdAt", // sortBy
          "DESC", // sortDirection
        )
        .pipe(
          catchError((err) => {
            console.error("Error loading all cases:", err)
            return of({ cases: [], totalElements: 0, totalPages: 0, currentPage: 0 })
          }),
          map((response) => response.totalElements || 0),
        ),
      pendingCases: this.caseService
        .searchCases(
          undefined, // title
          CaseStatus.UNDER_REVIEW, // status
          undefined, // investigatorId
          undefined, // expertId
          undefined, // startDate
          undefined, // closedAt
          0, // page
          5, // size (we only need a few for display)
          "createdAt", // sortBy
          "DESC", // sortDirection
        )
        .pipe(
          catchError((err) => {
            console.error("Error loading pending cases:", err)
            return of({ cases: [], totalElements: 0, totalPages: 0, currentPage: 0 })
          }),
        ),
      completedCases: this.caseService
        .searchCases(
          undefined, // title
          CaseStatus.COMPLETED, // status
          undefined, // investigatorId
          undefined, // expertId
          undefined, // startDate
          undefined, // closedAt
          0, // page
          5, // size (we only need a few for display)
          "closedAt", // sortBy
          "DESC", // sortDirection
        )
        .pipe(
          catchError((err) => {
            console.error("Error loading completed cases:", err)
            return of({ cases: [], totalElements: 0, totalPages: 0, currentPage: 0 })
          }),
        ),
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (results) => {
          // Calculate metrics
          this.metrics.totalCases = results.allCases
          this.metrics.pendingReview = results.pendingCases.totalElements || 0
          this.metrics.completedCases = results.completedCases.totalElements || 0

          // Get recent decisions (completed cases with verdicts)
          this.metrics.recentDecisions = (results.completedCases.cases || [])
            .filter((c) => c.verdict)
            .sort((a, b) => new Date(b.closedAt || 0).getTime() - new Date(a.closedAt || 0).getTime())
            .slice(0, 5)

          // Get recent cases for review
          this.recentCases = (results.pendingCases.cases || [])
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
            .slice(0, 5)
        },
        error: (err) => {
          this.error = "Failed to load dashboard data: " + err.message
          this.toastr.error(this.error, "Error")
        },
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
}
