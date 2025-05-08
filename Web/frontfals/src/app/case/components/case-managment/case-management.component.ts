import { Component,  OnInit } from "@angular/core"
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms"
import  { MatDialog } from "@angular/material/dialog"
import  { MatSnackBar } from "@angular/material/snack-bar"
import  { CaseService } from "../../../core/services/case.service"
import  { AuthService } from "../../../core/services/auth.service"
import { ConfirmDialogComponent } from "../../../shared/components/confirm-dialog/confirm-dialog.component"
import { FilterComponent } from "../../../shared/components/filter/filter.component"
import {CaseDTO} from '../../../core/models/case.model';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {DatePipe, NgClass, NgForOf, NgIf} from '@angular/common';
import {Router} from '@angular/router';
import {StatusBadgeComponent} from '../../../shared/components/status-badge/status-badge.component';



@Component({
  selector: "app-case-management",
  templateUrl: "./case-management.component.html",
  styleUrls: ["./case-management.component.scss"],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatProgressSpinner,
    NgIf,
    NgForOf,
    DatePipe,
    StatusBadgeComponent
  ],
  standalone: true
})
export class CaseManagementComponent implements OnInit {
  // Form
  caseForm: FormGroup
  showValidationErrors = false

  // Cases data
  cases: CaseDTO[]=[];
  filteredCases: CaseDTO[] = []
  isLoading = false

  // Search and filter
  searchTerm = ""
  filterCriteria: any = {}
  showFilters = false

  // Pagination
  currentPage = 1
  pageSize = 10
  totalItems = 0
  paginationStart = 1
  paginationEnd = 10

  constructor(
    private fb: FormBuilder,
    private caseService: CaseService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {
    this.caseForm = this.fb.group({
      title: ["", Validators.required],
      investigatorId: ["", Validators.required],
      description: [""],
    })
  }

  ngOnInit(): void {
    this.initForm()
    this.loadCases()
  }

  initForm(): void {
    // Get current user ID for investigator ID
    const currentUser = this.authService.getCurrentUser()
    if (currentUser) {
      this.caseForm.patchValue({
        investigatorId: currentUser.id,
      })
    }
  }

  loadCases(): void {
    this.isLoading = true

    this.caseService.getCases().subscribe({
      next: (response) => {
        this.cases = response.cases
        this.totalItems = this.cases.length
        this.applyFilter()
        this.isLoading = false
      },
      error: (error) => {
        console.error("Error loading cases:", error)
        this.snackBar.open("Failed to load cases. Please try again.", "Close", {
          duration: 5000,
          panelClass: "error-snackbar",
        })
        this.isLoading = false
      },
    })
  }

  onSubmit(): void {
    this.showValidationErrors = true

    if (this.caseForm.valid) {
      this.isLoading = true

      const newCase = this.caseForm.value

      this.caseService.createCase(newCase).subscribe({
        next: (response) => {
          this.snackBar.open("Case created successfully!", "Close", {
            duration: 3000,
            panelClass: "success-snackbar",
          })
          this.resetForm()
          this.loadCases()
        },
        error: (error) => {
          console.error("Error creating case:", error)
          this.snackBar.open("Failed to create case. Please try again.", "Close", {
            duration: 5000,
            panelClass: "error-snackbar",
          })
          this.isLoading = false
        },
      })
    } else {
      // Form is invalid, show error message
      this.snackBar.open("Please fill in all required fields.", "Close", {
        duration: 3000,
        panelClass: "error-snackbar",
      })
    }
  }

  resetForm(): void {
    this.showValidationErrors = false
    this.caseForm.reset()
    this.initForm() // Re-initialize with default values
  }

  applyFilter(): void {
    // First apply search term filter
    let result = this.cases

    if (this.searchTerm) {
      const searchTermLower = this.searchTerm.toLowerCase()
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(searchTermLower) ||
          c.caseNumber.toLowerCase().includes(searchTermLower) ||
          (c.description && c.description.toLowerCase().includes(searchTermLower)),
      )
    }

    // Then apply additional filters
    if (this.filterCriteria.status) {
      result = result.filter((c) => c.status === this.filterCriteria.status)
    }

    if (this.filterCriteria.dateFrom) {
      result = result.filter((c) => new Date(c.createdAt) >= new Date(this.filterCriteria.dateFrom))
    }

    if (this.filterCriteria.dateTo) {
      result = result.filter((c) => new Date(c.createdAt) <= new Date(this.filterCriteria.dateTo))
    }

    // Update total count
    this.totalItems = result.length

    // Apply pagination
    const startIndex = (this.currentPage - 1) * this.pageSize
    this.filteredCases = result.slice(startIndex, startIndex + this.pageSize)

    // Update pagination info
    this.updatePaginationInfo()
  }

  updatePaginationInfo(): void {
    this.paginationStart = this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1
    this.paginationEnd = Math.min(this.currentPage * this.pageSize, this.totalItems)
  }

  toggleFilters(): void {
    const dialogRef = this.dialog.open(FilterComponent, {
      width: "400px",
      data: {
        filterCriteria: { ...this.filterCriteria },
        statusOptions: ["PENDING", "ACTIVE", "CLOSED"],
      },
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.filterCriteria = result
        this.applyFilter()
      }
    })
  }

  onPageSizeChange(): void {
    this.currentPage = 1 // Reset to first page when changing page size
    this.applyFilter()
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--
      this.applyFilter()
    }
  }

  nextPage(): void {
    if (this.currentPage * this.pageSize < this.totalItems) {
      this.currentPage++
      this.applyFilter()
    }
  }

  viewCase(id: string): void {
    // Navigate to case details page
    this.router.navigate(['/cases', id]);
  }

  editCase(id: string): void {
    // Navigate to case edit page or open edit dialog
    this.router.navigate(['/cases', id, 'edit']);
  }

  confirmDelete(caseItem: CaseDTO): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "350px",
      data: {
        title: "Confirm Delete",
        message: `Are you sure you want to delete case "${caseItem.title}"?`,
        confirmText: "Delete",
        cancelText: "Cancel",
      },
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.deleteCase(caseItem.id)
      }
    })
  }

  deleteCase(id: string): void {
    this.isLoading = true

    this.caseService.deleteCase(id).subscribe({
      next: () => {
        this.snackBar.open("Case deleted successfully!", "Close", {
          duration: 3000,
          panelClass: "success-snackbar",
        })
        this.loadCases()
      },
      error: (error) => {
        console.error("Error deleting case:", error)
        this.snackBar.open("Failed to delete case. Please try again.", "Close", {
          duration: 5000,
          panelClass: "error-snackbar",
        })
        this.isLoading = false
      },
    })
  }
}
