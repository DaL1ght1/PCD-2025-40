import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { MatIconModule } from "@angular/material/icon"
import { MatButtonModule } from "@angular/material/button"
import { MatTooltipModule } from "@angular/material/tooltip"
import  { ThemeService } from "../../../core/services/theme.service"
import  { Theme } from "../../../core/services/theme.service"

@Component({
  selector: "app-theme-toggle",
  templateUrl: "./theme-toggle.component.html",
  styleUrls: ["./theme-toggle.component.scss"],
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
})
export class ThemeToggleComponent implements OnInit {
  currentTheme: Theme = "light"

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeService.theme$.subscribe((theme) => {
      this.currentTheme = theme
    })
  }

  toggleTheme(): void {
    this.themeService.toggleTheme()
  }
}
