import { Component, OnInit } from "@angular/core";
import { AuthService } from "../../../core/services/auth.service";
import { Observable } from "rxjs";
import { AdminService } from "../../../core/services/admin.service";
import { CaseService } from "../../../core/services/case.service";
import { ToastrService } from "ngx-toastr";
import {CaseDTO, CaseSearchResponse, CaseStatisticsDTO} from "../../../core/models/case.model"; // Use CaseDTO and CaseSearchResponse
import { User } from "../../../core/models/user.model";
import { LoadingSpinnerComponent } from "../../../shared/components/loading-spinner/loading-spinner.component";
import { StatCardComponent } from "../stat-card/stat-card.component";
import { ActivityChartComponent } from "../activity-chart/activity-chart.component";
import { CaseStatusChartComponent } from "../case-status-chart/case-status-chart.component";
import { RecentCasesComponent } from "../recent-cases/recent-cases.component";
import {Router, RouterLink} from "@angular/router";
import {AsyncPipe, NgIf} from "@angular/common";
import {ThemeToggleComponent} from '../../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
  imports: [
    LoadingSpinnerComponent,
    StatCardComponent,
    ActivityChartComponent,
    CaseStatusChartComponent,
    RecentCasesComponent,
    RouterLink,
    NgIf,
    AsyncPipe,
  ],
  standalone: true,
})
export class DashboardComponent implements OnInit {
  userRoles$: Observable<string[]>;
  stats: any = {
    totalCases: 0,
    pendingCases: 0,
    inProgressCases: 0,
    completedCases: 0,
    totalUsers: 0,
    totalImages: 0,
    totalAnalyses: 0,
    detectionRate: 0,
  };
  recentCases: CaseDTO[] = []; // Use CaseDTO[]
  loading = true;
  currentUser: User | null = null;

  constructor(
    protected authService: AuthService,
    private adminService: AdminService,
    private caseService: CaseService,
    private toastr: ToastrService,
    private router: Router ,
  ) {
    this.userRoles$ = this.authService.getUserRole();
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      // Load admin or user dashboard based on roles after user is loaded
      if (user) {
        this.userRoles$.subscribe(roles => {
          if (roles.includes('ROLE_ADMIN')) {
            this.loadAdminDashboard();
          } else {
            this.loadUserDashboard();
          }
        });
      } else {
        this.loading = false; // No user, not loading dashboard data
      }
    });
    // Initial check if user is already loaded (e.g., from autoLogin)
    if (this.authService.getCurrentUser()) {
      this.userRoles$.subscribe(roles => {
        if (roles.includes('ROLE_ADMIN')) {
          this.loadAdminDashboard();
        } else {
          this.loadUserDashboard();
        }
      });
    } else {
      this.loading = false; // Not logged in, not loading
    }
  }

  loadAdminDashboard(): void {
    this.loading = true;
    this.adminService.getSystemStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.loading = false;
      },
      error: (error) => {
        console.error("Failed to load dashboard data:", error);
        this.toastr.error("Failed to load dashboard data", "Error");
        this.stats = {
          totalCases: 0,
          pendingCases: 0,
          inProgressCases: 0,
          completedCases: 0,
          totalUsers: 0,
          totalImages: 0,
          totalAnalyses: 0,
          detectionRate: 0,
        };
        this.loading = false;
      },
    });
    // Fetch recent cases for Admin (e.g., all recent cases)
    this.caseService.getCases(0, 5).subscribe({ // Fetch first 5 cases (page 0, size 5)
      next: (response: CaseSearchResponse) => { // Expect CaseSearchResponse
        const cases = response.cases || []; // Access 'cases' property
        this.recentCases = cases;
      },
      error: (error) => {
        console.error("Failed to load recent cases:", error);
        this.toastr.error("Failed to load recent cases", "Error");
        this.recentCases = [];
      },
      complete: () => {
      },
    });
  }

  loadUserDashboard(): void {
    this.loading = true;
    const userId = this.authService.getCurrentUser()?.id; // Get current user ID
    if (!userId) {
      this.loading = false;
      this.toastr.error("User ID not available. Cannot load dashboard data.", "Error");
      return;
    }
    this.caseService.getCasesByInvestigator(userId, 0, 5).subscribe({ // Fetch first 5 cases for this investigator
      next: (cases: CaseDTO[]) => { // This endpoint returns CaseDTO[] directly
        this.recentCases = cases; // Use the cases directly
        // Calculate stats based on the fetched cases if needed, or call getCaseStatistics()
        // The backend getCaseStatistics() gives total counts, which might be better for a dashboard overview.
        this.caseService.getCaseStatistics().subscribe({
          next: (stats: CaseStatisticsDTO) => {
            this.stats = stats; // Use the statistics DTO
            this.loading = false;
          },
          error: (statsError) => {
            console.error("Failed to load case statistics:", statsError);
            this.toastr.error("Failed to load case statistics", "Error");
            this.stats = { totalCases: cases.length, pendingCases: 0, inProgressCases: 0, completedCases: 0 }; // Fallback stats
            this.loading = false;
          }
        });
      },
      error: (error) => {
        console.error("Failed to load dashboard data:", error);
        this.toastr.error("Failed to load dashboard data", "Error");
        this.loading = false;
        this.recentCases = [];
        this.stats = {
          totalCases: 0,
          pendingCases: 0,
          inProgressCases: 0,
          completedCases: 0,
        };
      },
    });
  }

  logout(): void {
    this.authService.logout()
    this.router.navigate(["/login"])
  }
}
