import { Component, OnInit, OnDestroy, HostListener } from "@angular/core";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { NgClass, NgIf, NgOptimizedImage } from "@angular/common";
import { Subscription } from "rxjs";
import { AuthService } from "../../../core/services/auth.service";
import { SidebarService } from "../../../core/services/sidebar.service";
import { ThemeToggleComponent } from "../theme-toggle/theme-toggle.component";
import { User } from "../../../core/models/user.model";
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatTooltipModule} from '@angular/material/tooltip';

@Component({
  selector: "app-sidebar",
  templateUrl: "./sidebar.component.html",
  styleUrls: ["./sidebar.component.scss"],
  imports: [RouterLink, RouterLinkActive, NgIf, NgClass, ThemeToggleComponent, MatTooltipModule, MatButtonModule ,MatCardModule ],
  standalone: true,
})
export class SidebarComponent implements OnInit, OnDestroy {
  isExpanded = true;
  isMobileOpen = false;
  isMobile = false;
  currentUser: User | null = null;
  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private sidebarService: SidebarService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if mobile on init
    this.checkIfMobile();

    // Subscribe to sidebar service
    this.subscriptions.add(
      this.sidebarService.sidebarVisible$.subscribe((visible) => {
        if (this.isMobile) {
          this.isMobileOpen = visible;
        } else {
          this.isExpanded = visible;
        }
      })
    );

    // Subscribe to current user
    this.subscriptions.add(
      this.authService.currentUser$.subscribe((user) => {
        this.currentUser = user;
      })
    );

    // Set initial state
    if (this.isMobile) {
      this.isExpanded = true;
      this.isMobileOpen = false;
    } else {
      // Get saved state from localStorage
      const savedState = localStorage.getItem("sidebarExpanded");
      this.isExpanded = savedState === null ? true : savedState === "true";
      this.sidebarService.setSidebarVisible(this.isExpanded);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  @HostListener("window:resize", ["$event"])
  onResize() {
    this.checkIfMobile();
  }

  checkIfMobile(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 992;

    // If transitioning from desktop to mobile
    if (!wasMobile && this.isMobile) {
      this.isMobileOpen = false;
    }
  }

  toggleSidebar(): void {
    if (this.isMobile) {
      this.isMobileOpen = !this.isMobileOpen;
      this.sidebarService.setSidebarVisible(this.isMobileOpen);
    } else {
      this.isExpanded = !this.isExpanded;
      localStorage.setItem("sidebarExpanded", this.isExpanded.toString());
      this.sidebarService.setSidebarVisible(this.isExpanded);
    }
  }

  closeMobileSidebar(): void {
    if (this.isMobile && this.isMobileOpen) {
      this.isMobileOpen = false;
      this.sidebarService.setSidebarVisible(false);
    }
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  getUserInitials(): string {
    if (!this.currentUser) return "";

    const firstInitial = this.currentUser.firstname ? this.currentUser.firstname.charAt(0) : "";
    const lastInitial = this.currentUser.lastname ? this.currentUser.lastname.charAt(0) : "";

    return (firstInitial + lastInitial).toUpperCase();
  }

  formatRole(role: string): string {
    if (!role) return "User";

    // Remove ROLE_ prefix if present
    const formattedRole = role.replace("ROLE_", "");

    // Capitalize first letter, lowercase the rest
    return formattedRole.charAt(0).toUpperCase() + formattedRole.slice(1).toLowerCase();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(["/login"]);
  }
}
