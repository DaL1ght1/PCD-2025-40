import {Component, OnInit} from "@angular/core";
import {CommonModule, DatePipe} from '@angular/common';
import {RouterLink} from '@angular/router';
import {LawyerService} from "../../../core/services/lawyer.service";
import {UserService} from "../../../core/services/user.service";
import {CaseDTO, CaseSearchResponse, CaseStatus} from "../../../core/models/case.model";
import {User} from "../../../core/models/user.model";
import {of} from "rxjs";
import {catchError, finalize, map, tap} from "rxjs/operators";
import {LoadingSpinnerComponent} from "../../../shared/components/loading-spinner/loading-spinner.component";
import {StatusBadgeComponent} from "../../../shared/components/status-badge/status-badge.component";
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {AssignExpertDialogComponent} from '../assign-expert-dialog/assign-expert-dialog.component';
import {NotificationService} from "../../../core/services/notification.service";
import {ToastrService} from 'ngx-toastr';

@Component({
  standalone: true,
  selector: "app-lawyer-dashboard",
  templateUrl: "./lawyer-dashboard.component.html",
  styleUrls: ["./lawyer-dashboard.component.scss"],
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    StatusBadgeComponent,
    DatePipe,
    RouterLink,
    MatDialogModule
  ],
})
export class LawyerDashboardComponent implements OnInit {
  casesResponse: CaseSearchResponse = { cases: [], totalElements: 0, totalPages: 0, currentPage: 0 };
  loading = true;
  error: string | null = null;
  currentPage = 1;
  pageSize = 10;
  experts: User[] = [];
  isAssigning: { [caseId: string]: boolean } = {};
  paginationStartItem = 0;
  paginationEndItem = 0;
  loadingExperts = false;

  constructor(
    private lawyerService: LawyerService,
    private userService: UserService,
    private dialog: MatDialog,
    private notificationService: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadCasesForLawyer();
    this.loadExperts();
  }

  loadExperts(): void {
    this.loadingExperts = true;

    // Use the dedicated experts endpoint from the LawyerService
    this.lawyerService.getExperts().subscribe({
      next: (experts) => {
        console.log("Experts loaded:", experts);
        this.experts = experts;
        this.loadingExperts = false;
      },
      error: (err) => {
        console.error('Failed to load experts:', err);
        this.notificationService.error('Could not load available experts.');
        this.loadingExperts = false;
      }
    });

    if (!this.lawyerService['getExperts']) {
      this.userService.getUsers().subscribe({
        next: (users) => {
          console.log("All users loaded:", users);
          this.experts = users.filter(user => {
            if (Array.isArray(user.role)) {
              return user.role.includes('ROLE_EXPERT');
            } else if (typeof user.role === 'string') {
              return user.role === 'ROLE_EXPERT' ;
            }
            return false;
          });
          console.log("Filtered experts:", this.experts);
          this.loadingExperts = false;
        },
        error: (err) => {
          console.error('Failed to load experts from user service:', err);
          this.notificationService.error('Could not load available experts.');
          this.loadingExperts = false;
        }
      });
    }
  }

  loadCasesForLawyer(page: number = 0): void {
    this.loading = true;
    this.error = null;

    this.lawyerService.getLawyerCases(
      undefined,
      page,
      this.pageSize
    ).pipe(
      map((response) => {
        const filteredCases = response.cases.filter(caseItem => caseItem.status !== 'ARCHIVED');
        return {
          ...response,
          cases: filteredCases
        };
      }),
      tap((filteredResponse) => {
        this.casesResponse = filteredResponse;
        this.calculatePaginationDisplay(filteredResponse);
        this.loading = false;
      }),
      catchError((err) => {
        this.loading = false;
        this.error = 'Failed to load cases: ' + err.message;
        this.casesResponse = { cases: [], totalElements: 0, totalPages: 0, currentPage: 0 };
        this.calculatePaginationDisplay(this.casesResponse);
        return of(this.casesResponse);
      })
    ).subscribe();
  }

  calculatePaginationDisplay(response: CaseSearchResponse): void {
    if (response.totalElements === 0) {
      this.paginationStartItem = 0;
      this.paginationEndItem = 0;
    } else {
      this.paginationStartItem = response.currentPage * this.pageSize + 1;
      this.paginationEndItem = Math.min((response.currentPage + 1) * this.pageSize, response.totalElements);
    }
    this.currentPage = response.currentPage + 1;
  }

  openAssignExpertDialog(caseItem: CaseDTO): void {
    // Debug logs
    console.log("Opening assign expert dialog");
    console.log("Loading experts status:", this.loadingExperts);
    console.log("Available experts:", this.experts);

    if (this.loadingExperts) {
      this.notificationService.info('Loading experts, please wait...');
      return;
    }

    // Manually check again if experts are loaded
    if (this.experts.length === 0) {
      console.log("No experts found, attempting to reload experts");
      this.loadExperts();

      // If still no experts after reload attempt, show warning
      if (this.experts.length === 0) {
        this.notificationService.warning('No experts available in the system. Please add experts before assigning.');
        return;
      }
    }

    const dialogRef = this.dialog.open(AssignExpertDialogComponent, {
      width: '450px',
      data: {
        experts: this.experts,
        caseTitle: caseItem.title,
        currentExpertId: caseItem.assignedExpertId
      }
    });

    dialogRef.afterClosed().subscribe(selectedExpertId => {
      if (selectedExpertId) {
        this.assignExpert(caseItem.id, selectedExpertId);
      }
    });
  }

  assignExpert(caseId: string, expertId: string): void {
    this.isAssigning[caseId] = true;
    this.lawyerService.assignExpertToCase(caseId, expertId)
      .pipe(
        finalize(() => this.isAssigning[caseId] = false)
      )
      .subscribe({
        next: (updatedCase) => {
          this.notificationService.success(`Expert assigned successfully to case ${updatedCase.caseNumber}`);
          const index = this.casesResponse.cases.findIndex(c => c.id === caseId);
          if (index !== -1) {
            this.casesResponse.cases[index] = updatedCase;
            this.casesResponse.cases = [...this.casesResponse.cases];
          } else {
            this.loadCasesForLawyer(this.currentPage - 1);
          }
        },
        error: (err) => {
          // Error handling is done in the service through the handleError method
          // which calls the notification service
        }
      });
  }

  goToPage(page: number, event: Event): void {
    event.preventDefault();
    const zeroBasedPage = page - 1;
    if (zeroBasedPage >= 0 && zeroBasedPage < this.casesResponse.totalPages && page !== this.currentPage) {
      this.loadCasesForLawyer(zeroBasedPage);
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

  /**
   * Get expert name by ID
   * @param expertId The ID of the expert
   * @returns The expert's full name or 'Unknown Expert' if not found
   */
  getExpertName(expertId: string): string {
    const expert = this.experts.find(e => e.id === expertId);
    return expert ? `${expert.firstname} ${expert.lastname}` : 'Unknown Expert';
  }

  protected readonly Math = Math;
  protected readonly CaseStatus = CaseStatus;
}
