import { Injectable,  Renderer2,  RendererFactory2 } from "@angular/core"
import { BehaviorSubject } from "rxjs"

export type Theme = "light" | "dark"

@Injectable({
  providedIn: "root",
})
export class ThemeService {
  private renderer: Renderer2
  private themeSubject = new BehaviorSubject<Theme>(this.getStoredTheme())
  public theme$ = this.themeSubject.asObservable()

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null)
    this.initTheme()
  }

  private getStoredTheme(): Theme {
    const storedTheme = localStorage.getItem("theme") as Theme

    // Always default to light theme if no stored preference
    if (!storedTheme) {
      return "light"
    }

    // Only accept valid theme values
    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme
    }

    // If system preference is for dark mode and no stored preference, still default to light
    // This ensures we always start with light theme as requested
    return "light"
  }

  private initTheme(): void {
    const theme = this.themeSubject.value
    this.applyTheme(theme)
  }

  public toggleTheme(): void {
    const newTheme = this.themeSubject.value === "light" ? "dark" : "light"
    this.setTheme(newTheme)
  }

  public setTheme(theme: Theme): void {
    this.themeSubject.next(theme)
    localStorage.setItem("theme", theme)
    this.applyTheme(theme)
  }

  private applyTheme(theme: Theme): void {
    const body = document.body

    if (theme === "dark") {
      this.renderer.addClass(body, "dark-theme")
      this.renderer.removeClass(body, "light-theme")
    } else {
      this.renderer.addClass(body, "light-theme")
      this.renderer.removeClass(body, "dark-theme")
    }

    // Update Material components that might be in overlays
    this.updateMaterialOverlays(theme)

    // Fix sidebar visibility after theme change
    setTimeout(() => {
      this.fixSidebarVisibility()
    }, 100)
  }

  private updateMaterialOverlays(theme: Theme): void {
    // Find all overlay containers and update their theme
    const overlayContainers = document.querySelectorAll(".cdk-overlay-container")

    overlayContainers.forEach((container) => {
      if (theme === "dark") {
        container.classList.add("dark-theme")
        container.classList.remove("light-theme")
      } else {
        container.classList.add("light-theme")
        container.classList.remove("dark-theme")
      }
    })
  }

  public fixSidebarVisibility(): void {
    // Fix for Angular Material sidenav
    const sidenavs = document.querySelectorAll(".mat-drawer, .mat-sidenav")
    sidenavs.forEach((sidenav) => {
      // Ensure the sidebar is visible
      ;(sidenav as HTMLElement).style.display = "block"
      ;(sidenav as HTMLElement).style.visibility = "visible"

      // Reset any transforms that might be hiding it
      ;(sidenav as HTMLElement).style.transform = "none"
    })

    // Fix for any custom sidebar implementation
    const sidebars = document.querySelectorAll(".sidebar")
    sidebars.forEach((sidebar) => {
      // Ensure the sidebar is visible
      ;(sidebar as HTMLElement).style.display = "block"
      ;(sidebar as HTMLElement).style.visibility = "visible"

      // Reset any transforms that might be hiding it
      ;(sidebar as HTMLElement).style.transform = "none"
    })

    // Force a reflow to ensure changes take effect
    document.body.offsetHeight
  }

  public getCurrentTheme(): Theme {
    return this.themeSubject.value
  }
}
