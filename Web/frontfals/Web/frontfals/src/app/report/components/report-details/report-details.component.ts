import { Component, OnInit } from '@angular/core';
import {CommonModule, NgIf, NgOptimizedImage} from '@angular/common';
import {HttpClientModule} from '@angular/common/http';
import {LoadingSpinnerComponent} from '../../../shared/components/loading-spinner/loading-spinner.component';
import {Observable, of} from 'rxjs';
import {ReportResponse} from '../../../core/models/report.model';
import {ReportService} from '../../../core/services/report.service';
import {ActivatedRoute} from '@angular/router';
import {catchError, tap} from 'rxjs/operators';
import { Location } from '@angular/common';


@Component({
  selector: 'app-report-detail',
  standalone: true,
  imports: [CommonModule, HttpClientModule, LoadingSpinnerComponent, NgIf, NgOptimizedImage],
  templateUrl: './report-details.component.html',
  styleUrls: ['./report-details.component.scss']
})
export class ReportDetailComponent implements OnInit {
  report$: Observable<ReportResponse | null> = of(null);
  loading = true;
  error: string | null = null;
  reportId: string | null = null;

  constructor(
    private reportService: ReportService,
    private route: ActivatedRoute,
  private location: Location
  ) {}

  ngOnInit(): void {
    this.reportId = this.route.snapshot.paramMap.get('reportId');

    if (this.reportId) {
      this.fetchReport(this.reportId);
    } else {
      this.error = 'Report ID not provided';
      this.loading = false;
    }
  }

  fetchReport(reportId: string): void {
    this.loading = true;
    this.report$ = this.reportService.getReport(reportId).pipe(
      tap(() => this.loading = false),
      catchError(error => {
        this.loading = false;
        this.error = 'Failed to load report. Please try again later.';
        console.error('Error fetching report:', error);
        return of(null);
      })
    );
  }
  goBack(): void {
    this.location.back();
  }
}
