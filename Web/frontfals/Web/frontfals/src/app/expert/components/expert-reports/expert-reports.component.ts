import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReportService } from '../../../core/services/report.service';
import { ToastrService } from 'ngx-toastr';
import { ReportResponse } from '../../../core/models/report.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import {DatePipe, NgClass, NgForOf, NgIf} from '@angular/common';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { AuthService } from '../../../core/services/auth.service';
import { finalize, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-expert-reports',
  templateUrl: './expert-reports.component.html',
  styleUrls: ['./expert-reports.component.scss'],
  imports: [
    LoadingSpinnerComponent,
    RouterLink,
    DatePipe,
    StatusBadgeComponent,
    NgForOf,
    NgIf,
    NgClass,
  ],
  standalone: true,
})
export class ExpertReportsComponent implements OnInit {
  reports: ReportResponse[] = []; // Paginated subset of reports
  fullReports: ReportResponse[] = []; // All reports fetched from backend
  loading = true;
  errorMessage: string | null = null;

  // Pagination properties
  currentPage = 1;
  pageSize = 10; // Default page size
  totalElements = 0;
  totalPages = 0;

  constructor(
    private reportService: ReportService,
    private router: Router,
    private toastr: ToastrService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.loading = true;
    this.errorMessage = null;
    const expertId = this.authService.getCurrentUser()?.id;

    if (!expertId || typeof expertId !== 'string') {
      this.loading = false;
      this.errorMessage = 'Expert ID not available or invalid. Cannot load reports.';
      this.toastr.error(this.errorMessage, 'Error');
      return;
    }

    this.reportService.getReportsByExpert(expertId)
      .pipe(
        finalize(() => (this.loading = false)),
        catchError((error: any) => {
          const errorMsg = error.message || 'Unknown error occurred';
          this.errorMessage = `Failed to load expert reports: ${errorMsg}`;
          console.error('Error loading expert reports:', error);
          this.toastr.error(this.errorMessage, 'Error');
          return of([]);
        })
      )
      .subscribe((reports: ReportResponse[]) => {
        if (Array.isArray(reports)) {
          this.fullReports = reports;
          this.totalElements = reports.length;
          this.totalPages = Math.ceil(this.totalElements / this.pageSize);
          this.updatePaginatedReports();
        } else {
          this.errorMessage = 'Invalid response format: Expected an array of reports.';
          this.toastr.error(this.errorMessage, 'Error');
          this.fullReports = [];
          this.reports = [];
          this.totalElements = 0;
          this.totalPages = 0;
        }
      });
  }

  // Update the paginated subset of reports based on currentPage and pageSize
  private updatePaginatedReports(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.reports = this.fullReports.slice(startIndex, endIndex);
  }

  viewReport(reportId: string): void {
    this.router.navigate(['/expert/reports', reportId]);
  }

  exportReport(reportId: string): void {
    this.reportService.exportReport(reportId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const filename = `report_${reportId}.pdf`;
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        this.toastr.success('Report exported successfully', 'Success');
      },
      error: (error) => {
        console.error('Export failed:', error);
        this.toastr.error('Failed to export report', 'Error');
      },
    });
  }

  changePage(page: number, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    this.currentPage = page;
    this.updatePaginatedReports();
  }

  // Generate page numbers for pagination (e.g., show 5 pages at a time)
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }
}
