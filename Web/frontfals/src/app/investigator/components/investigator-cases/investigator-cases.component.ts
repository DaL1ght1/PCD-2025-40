import { Component, OnInit } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { CaseService } from "../../../core/services/case.service";
import { ToastrService } from "ngx-toastr";
import { CaseDTO, CaseStatus, CaseSearchResponse } from "../../../core/models/case.model";
import { FormsModule } from "@angular/forms";
import { LoadingSpinnerComponent } from "../../../shared/components/loading-spinner/loading-spinner.component";
import {DatePipe, NgClass, NgForOf, NgIf, TitleCasePipe} from "@angular/common";
import { StatusBadgeComponent } from "../../../shared/components/status-badge/status-badge.component";
import { finalize, catchError } from "rxjs/operators";
import { of } from "rxjs";
import { AuthService } from "../../../core/services/auth.service"; // Import AuthService

@Component({
  imports: [
    RouterLink,
    FormsModule,
    LoadingSpinnerComponent,
    NgForOf,
    StatusBadgeComponent,
    NgIf,
    DatePipe,
    NgClass,
    TitleCasePipe,
  ],
  standalone: true,
  selector: "app-investigator-cases",
  templateUrl: "./investigator-cases.component.html",
  styleUrls: ["./investigator-cases.component.scss"],
})
export class InvestigatorCasesComponent implements OnInit {
  casesResponse: CaseSearchResponse = {
    cases: [],
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
  };
  filteredCases: CaseDTO[] = [];
  loading = true;
  statusFilter: CaseStatus | "" = ""; // Type as CaseStatus | "" to allow empty selection
  dateFilter: string = "";
  searchFilter: string = "";
  currentPage: number = 1;
  pageSize: number = 10;
  investigatorId: string | null = null; // Store the logged-in investigator's ID

  constructor(
    private caseService: CaseService,
    private toastr: ToastrService,
    private router: Router,
    private authService: AuthService // Inject AuthService
  ) {}

  ngOnInit(): void {
    // Fetch the logged-in investigator's ID
    const user = this.authService.getCurrentUser();
    this.investigatorId = user?.id || null;
    if (!this.investigatorId) {
      this.toastr.error("Investigator ID not available. Cannot load cases.", "Error");
      this.loading = false;
      return;
    }
    this.loadCases();
  }

  loadCases(): void {
    this.loading = true;
    const pageIndex = this.currentPage - 1;

    this.caseService
      .getCases(
        pageIndex,
        this.pageSize
      )
      .pipe(
        finalize(() => (this.loading = false)),
        catchError((err) => {
          console.error("Failed to load cases:", err);
          this.toastr.error(err.message || "Failed to load cases. Please try again later.", "Error");
          this.casesResponse = { cases: [], totalElements: 0, totalPages: 0, currentPage: 0 };
          this.filteredCases = [];
          return of(this.casesResponse);
        })
      )
      .subscribe((response: CaseSearchResponse) => {
        this.casesResponse = response;
        this.filteredCases = [...(response.cases || [])];
      });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadCases();
  }

  resetFilters(): void {
    this.statusFilter = "";
    this.dateFilter = "";
    this.searchFilter = "";
    this.currentPage = 1;
    this.loadCases();
  }

  viewReports(id: string): void {
    this.router.navigate([`/investigator/cases/${id}/reports`]);
  }

  getStatusClass(status: CaseStatus | string): string {
    const statusLower = status.toString().toLowerCase();

    switch (statusLower) {
      case "pending":
        return "bg-warning";
      case "in_progress":
      case "in progress":
        return "bg-info";
      case "completed":
        return "bg-success";
      case "rejected":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  }

  get totalPages(): number {
    return this.casesResponse.totalPages;
  }

  getPages(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number, event: Event): void {
    event.preventDefault();
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadCases();
    }
  }

  previousPage(event: Event): void {
    event.preventDefault();
    this.goToPage(this.currentPage - 1, event);
  }

  nextPage(event: Event): void {
    event.preventDefault();
    this.goToPage(this.currentPage + 1, event);
  }

  protected readonly CaseStatus = CaseStatus;
  protected readonly Math = Math;
}
