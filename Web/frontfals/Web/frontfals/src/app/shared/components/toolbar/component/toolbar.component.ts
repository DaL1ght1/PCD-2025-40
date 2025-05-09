import { Component, Input, type OnInit, type OnDestroy } from "@angular/core"
import  { Router } from "@angular/router"
import { Subscription } from "rxjs"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import { MatTooltipModule } from "@angular/material/tooltip"
import { ThemeToggleComponent } from "../../theme-toggle/theme-toggle.component"
import  { ThemeService } from "../../../../core/services/theme.service"
import  { SidebarService } from "../../../../core/services/sidebar.service"
import  { AuthService } from "../../../../core/services/auth.service"

@Component({
  selector: "app-toolbar",
  templateUrl: "./toolbar.component.html",
  styleUrls: ["./toolbar.component.scss"],
  standalone: true,
  imports: [CommonModule, RouterModule, MatTooltipModule],
})
export class ToolbarComponent implements OnInit, OnDestroy {
  @Input() title = "Falsified Image Detection System"

  isDarkTheme = false
  private subscriptions = new Subscription()
  unreadNotifications = 3 // Example count, you can set this dynamically

  constructor(
    private router: Router,
    public authService: AuthService,
    private sidebarService: SidebarService,
    private themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    // Subscribe to theme changes
    this.subscriptions.add(
      this.themeService.theme$.subscribe((theme) => {
        this.isDarkTheme = theme === "dark"
      }),
    )
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe()
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar()
  }

  logout(): void {
    this.authService.logout()
    this.router.navigate(["/login"])
  }

  toggleNotifications(): void {
    // This would typically open a notifications panel or dropdown
    // For demo purposes, let's clear the notifications when clicked
    this.unreadNotifications = 0
  }
}
