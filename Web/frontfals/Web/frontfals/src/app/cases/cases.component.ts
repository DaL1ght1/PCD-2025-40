import {Component, OnInit, OnDestroy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { CaseCreationRequest, CaseDTO, CaseStatus } from '../core/models/case.model';
import { CaseService } from '../core/services/case.service';
import { NotificationService } from '../core/services/notification.service';
import { CaseDialogComponent } from '../case/components/case-dialog/case-dialog.component';
import { ConfirmDialogComponent } from '../shared/components/confirm-dialog/confirm-dialog.component';
import { CaseFilterComponent } from '../case/components/case-filter/case-filter.component';

@Component({
  selector: 'app-cases',
  templateUrl: './cases.component.html',
  styleUrls: ['./cases.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule,
    MatSnackBarModule,
    CaseFilterComponent,
  ],
})
export class CasesComponent implements OnInit, OnDestroy {

  cases: CaseDTO[] = [];
  filteredCases: CaseDTO[] = [];
  selectedCases: string[] = [];

  viewMode: 'grid' | 'list' = 'grid';
  searchQuery = '';

  // Properly initialize the activeFilters object
  activeFilters = {
    title: '',
    status: '',
    investigatorId: '',
    expertId: '',
    startDate: '',
    endDate: '',
    sortBy: '',
    sortDirection: ''
  };

  isLoading = false;
  isProcessing = false;

  currentPage = 1;
  pageSize = 12;
  totalPages = 1;
  totalElements = 0;

  sortField: keyof CaseDTO = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  private subscriptions = new Subscription();

  constructor(
    private caseService: CaseService,
    private dialog: MatDialog,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadCases(0);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /** Load cases from the server using searchCases with filters and pagination */
  loadCases(page: number = 0): void {
    this.isLoading = true;
    this.caseService
      .searchCases(
        this.activeFilters.title,
        this.activeFilters.status as CaseStatus,
        this.activeFilters.investigatorId,
        this.activeFilters.expertId,
        this.activeFilters.startDate,
        this.activeFilters.endDate,
        page,
        this.pageSize,
        this.sortField,
        this.sortDirection.toUpperCase() as 'ASC' | 'DESC'
      )
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          this.cases = response.cases;
          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
          this.currentPage = response.currentPage + 1; // API is 0-based, UI is 1-based
          this.applyLocalSearch();
        },
        error: (error) => {
          console.error('Error loading cases:', error);
          this.notificationService.error('Failed to load cases.');
        },
      });
  }

  /** Apply local filtering based on searchQuery */
  applyLocalSearch(): void {
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      this.filteredCases = this.cases.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.caseNumber.toLowerCase().includes(query) ||
          (c.description && c.description.toLowerCase().includes(query))
      );
    } else {
      this.filteredCases = [...this.cases];
    }
  }

  onFilterChange(filters: any): void {
    this.activeFilters = filters;
    this.resetAndLoad();
  }

  onSearch(): void {
    this.resetAndLoad();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.resetAndLoad();
  }

  resetAndLoad(): void {
    this.currentPage = 1;
    this.loadCases(0);
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  setSorting(field: keyof CaseDTO): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'desc';
    }
    this.loadCases(this.currentPage - 1);
  }

  getSortIcon(field: keyof CaseDTO): string {
    return this.sortField !== field
      ? 'unfold_more'
      : this.sortDirection === 'asc'
        ? 'arrow_upward'
        : 'arrow_downward';
  }

  openCaseForm(caseData?: CaseDTO): void {
    const dialogRef = this.dialog.open(CaseDialogComponent, {
      width: '800px',
      data: {
        case: caseData,
        isEdit: !!caseData,
      },
      panelClass: 'custom-dialog-container',
      disableClose: true,
    });

    const sub = dialogRef.afterClosed().subscribe((result: CaseCreationRequest) => {
      if (result) {
        this.isProcessing = true;
        const serviceCall = caseData
          ? this.caseService.updateCase(caseData.id, result)
          : this.caseService.createCase(result);
        serviceCall.pipe(finalize(() => (this.isProcessing = false))).subscribe({
          next: () => {
            this.loadCases(this.currentPage - 1);
            this.notificationService.success(
              caseData ? 'Case updated successfully' : 'Case created successfully'
            );
          },
          error: (err) => {
            console.error('Error saving case:', err);
            this.notificationService.error('Failed to save case.');
          },
        });
      }
    });
    this.subscriptions.add(sub);
  }

  viewCaseDetails(caseId: string): void {
    this.router.navigate(['/cases', caseId]);
  }

  deleteCase(caseData: CaseDTO, event: Event): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Case',
        message: 'Are you sure you want to delete this case?',
        detail: `${caseData.title} (${caseData.caseNumber})`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmClass: 'btn-danger',
      },
      panelClass: 'custom-dialog-container',
    });

    const sub = dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.isProcessing = true;
        this.caseService
          .deleteCase(caseData.id)
          .pipe(finalize(() => (this.isProcessing = false)))
          .subscribe({
            next: () => {
              this.loadCases(this.currentPage - 1);
              this.notificationService.success('Case deleted successfully');
            },
            error: (err) => {
              console.error('Error deleting case:', err);
              this.notificationService.error('Failed to delete case.');
            },
          });
      }
    });
    this.subscriptions.add(sub);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.loadCases(page - 1);
    }
  }

  toggleCaseSelection(caseId: string, event: Event): void {
    event.stopPropagation();
    const idx = this.selectedCases.indexOf(caseId);
    if (idx === -1) {
      this.selectedCases.push(caseId);
    } else {
      this.selectedCases.splice(idx, 1);
    }
  }

  isCaseSelected(caseId: string): boolean {
    return this.selectedCases.includes(caseId);
  }

  selectAllCases(): void {
    if (this.selectedCases.length === this.filteredCases.length) {
      this.selectedCases = [];
    } else {
      this.selectedCases = this.filteredCases.map((c) => c.id);
    }
  }

  bulkDeleteCases(): void {
    if (this.selectedCases.length === 0) {
      this.notificationService.warning('No cases selected');
      return;
    }
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Cases',
        message: `Are you sure you want to delete ${this.selectedCases.length} selected cases?`,
        detail: 'This action cannot be undone.',
        confirmText: 'Delete All',
        cancelText: 'Cancel',
        confirmClass: 'btn-danger',
      },
      panelClass: 'custom-dialog-container',
    });

    const sub = dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.isProcessing = true;
        setTimeout(() => {
          this.cases = this.cases.filter((c) => !this.selectedCases.includes(c.id));
          this.selectedCases = [];
          this.applyLocalSearch();
          this.isProcessing = false;
          this.notificationService.success(`${this.selectedCases.length} cases deleted successfully`);
          this.loadCases(this.currentPage - 1);
        }, 1000);
      }
    });
    this.subscriptions.add(sub);
  }

  getStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      [CaseStatus.PENDING]: 'status-pending',
      [CaseStatus.ASSIGNED]: 'status-assigned',
      [CaseStatus.IN_PROGRESS]: 'status-in-progress',
      [CaseStatus.ANALYSIS_COMPLETE]: 'status-analysis-complete',
      [CaseStatus.UNDER_REVIEW]: 'status-under-review',
      [CaseStatus.COMPLETED]: 'status-completed',
      [CaseStatus.REJECTED]: 'status-rejected',
      [CaseStatus.ARCHIVED]: 'status-archived',
    };
    return statusMap[status] || 'status-unknown';
  }

  protected readonly Object = Object;
}
