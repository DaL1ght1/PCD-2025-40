import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../../core/services/report.service';
import { ReportResponse } from '../../../core/models/report.model';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-report-list',
  templateUrl: './report-list.component.html',
  styleUrl: './report-list.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    StatusBadgeComponent,
    DatePipe,
  ],
})
export class ReportListComponent implements OnInit {
  reports: ReportResponse[] = [];
  loading = true;
  errorMessage: string | null = null;

  constructor(
    private reportService: ReportService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.loading = true;
    this.errorMessage = null;

    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) {
      this.errorMessage = 'User ID not available. Cannot load reports.';
      this.loading = false;
      return;
    }
    this.reportService.getReportsByExpert(userId)
      .pipe(
        finalize(() => this.loading = false),
        catchError(error => {
          this.errorMessage = 'Failed to load reports: ' + error.message;
          console.error('Error loading reports:', error);
          return of([]);
        })
      )
      .subscribe(reports => {
        this.reports = reports;
      });
  }

  viewReport(reportId: string): void {
    this.router.navigate(['/reports', reportId]);
  }

  exportReport(reportId: string): void {
    this.reportService.exportReport(reportId).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const filename = `report_${reportId}.pdf`;
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: error => {
        console.error('Export failed:', error);
      }
    });
  }
}
