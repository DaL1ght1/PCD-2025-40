import { Component,  OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterLink } from "@angular/router"
import { ReactiveFormsModule,  FormBuilder,  FormGroup } from "@angular/forms"
import  { CaseService } from "../../../core/services/case.service"
import  { ToastrService } from "ngx-toastr"
import { CaseDTO,  CaseSearchResponse, CaseStatus } from "../../../core/models/case.model"
import { LoadingSpinnerComponent } from "../../../shared/components/loading-spinner/loading-spinner.component"
import { StatusBadgeComponent } from "../../../shared/components/status-badge/status-badge.component"
import { finalize, catchError } from "rxjs/operators"
import { of } from "rxjs"

@Component({
  selector: "app-all-cases",
  templateUrl: "./all-cases.component.html",
  styleUrls: ["./all-cases.component.scss"],
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, LoadingSpinnerComponent, StatusBadgeComponent],
})
export class AllCasesComponent implements OnInit {
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
  caseStatuses = CaseStatus

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
      status: [null],
      investigatorId: [""],
      expertId: [""],
      startDate: [null],
      closedAt: [null],
    })
  }

  ngOnInit(): void {
    this.loadAllCases()
  }

  loadAllCases(): void {
    this.loading = true
    this.errorMessage = null

    const { title, status, investigatorId, expertId, startDate, closedAt } = this.filterForm.value

    this.caseService
      .searchCases(
        title || undefined,
        status || undefined,
        investigatorId || undefined,
        expertId || undefined,
        startDate ? new Date(startDate).toISOString() : undefined,
        closedAt ? new Date(closedAt).toISOString() : undefined,
        this.currentPage,
        this.pageSize,
        this.sortBy,
        this.sortDirection,
      )
      .pipe(
        finalize(() => (this.loading = false)),
        catchError((error) => {
          this.errorMessage = "Failed to load cases: " + error.message
          console.error("Error loading cases:", error)
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
    this.loadAllCases()
  }

  resetFilters(): void {
    this.filterForm.reset({
      title: "",
      status: null,
      investigatorId: "",
      expertId: "",
      startDate: null,
      closedAt: null,
    })
    this.currentPage = 0
    this.loadAllCases()
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page
      this.loadAllCases()
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
    this.loadAllCases()
  }

  getSortIcon(field: string): string {
    if (this.sortBy !== field) return "fa-sort"
    return this.sortDirection === "ASC" ? "fa-sort-up" : "fa-sort-down"
  }

  getStatusClass(status: CaseStatus): string {
    switch (status) {
      case CaseStatus.PENDING:
        return "bg-secondary"
      case CaseStatus.UNDER_REVIEW:
        return "bg-warning"
      case CaseStatus.COMPLETED:
        return "bg-success"
      default:
        return "bg-secondary"
    }
  }
}
