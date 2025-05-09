import { Component,  OnInit } from "@angular/core"
import  { CaseService } from "../../../core/services/case.service"
import  { ToastrService } from "ngx-toastr"
import  { CaseDTO, CaseSearchResponse } from "../../../core/models/case.model"
import {DatePipe, NgClass, NgForOf, NgIf} from "@angular/common"
import { RouterLink } from "@angular/router"
import { LoadingSpinnerComponent } from "../../../shared/components/loading-spinner/loading-spinner.component"
import { StatusBadgeComponent } from "../../../shared/components/status-badge/status-badge.component"
import { finalize, catchError } from "rxjs/operators"
import { of } from "rxjs"
import {  FormBuilder,  FormGroup, ReactiveFormsModule } from "@angular/forms"

@Component({
  imports: [NgIf, LoadingSpinnerComponent, NgForOf, StatusBadgeComponent, DatePipe, RouterLink, ReactiveFormsModule, NgClass],
  standalone: true,
  selector: "app-case-reports",
  templateUrl: "./case-reports.component.html",
  styleUrls: ["./case-reports.component.scss"],
})
export class CaseReportsComponent implements OnInit {
  cases: CaseDTO[] = []
  loading = false
  errorMessage: string | null = null

  // Pagination
  currentPage = 0
  pageSize = 10
  totalElements = 0
  totalPages = 0

  // Filtering
  filterForm: FormGroup

  // Sorting
  sortBy = "createdAt"
  sortDirection: "ASC" | "DESC" = "DESC"

  constructor(
    private caseService: CaseService,
    private toastr: ToastrService,
    private fb: FormBuilder,
  ) {
    this.filterForm = this.fb.group({
      title: [""],
      status: ["UNDER_REVIEW"], // Default to showing archived cases
    })
  }

  ngOnInit(): void {
    this.loadCasesForReview()
  }

  loadCasesForReview(): void {
    this.loading = true
    this.errorMessage = null

    const { title, status } = this.filterForm.value

    this.caseService
      .searchCases(
        title || undefined,
        status || undefined,
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
          this.errorMessage = "Failed to load cases for review: " + error.message
          console.error("Error loading cases for review:", error)
          this.toastr.error(this.errorMessage, "Error")
          return of({ cases: [], totalElements: 0, totalPages: 0, currentPage: 0 } as CaseSearchResponse)
        }),
      )
      .subscribe((response: CaseSearchResponse) => {
        this.cases = response.cases || []
        this.totalElements = response.totalElements || 0
        this.totalPages = response.totalPages || 0
        this.currentPage = response.currentPage || 0
      })
  }

  applyFilters(): void {
    this.currentPage = 0 // Reset to first page when applying filters
    this.loadCasesForReview()
  }

  resetFilters(): void {
    this.filterForm.reset({
      title: "",
      status: "UNDER_REVIEW", // Reset to default status
    })
    this.currentPage = 0
    this.loadCasesForReview()
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page
      this.loadCasesForReview()
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
    this.loadCasesForReview()
  }

  getSortIcon(field: string): string {
    if (this.sortBy !== field) return "fa-sort"
    return this.sortDirection === "ASC" ? "fa-sort-up" : "fa-sort-down"
  }
}
