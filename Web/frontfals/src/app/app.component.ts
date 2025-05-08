import { Component,  OnDestroy,  OnInit,  Renderer2 } from "@angular/core"
import  { AuthService } from "./core/services/auth.service"
import  { SidebarService } from "./core/services/sidebar.service"
import {filter, Subscription} from "rxjs"
import { MatSidenavContainer } from "@angular/material/sidenav"
import {NavigationEnd, Router, RouterLink, RouterOutlet} from "@angular/router"
import { NgClass, NgIf } from "@angular/common"
import { ThemeToggleComponent } from "./shared/components/theme-toggle/theme-toggle.component"
import { SidebarComponent } from "./shared/components/sidebar/sidebar.component"
import { ToolbarComponent } from "./shared/components/toolbar/component/toolbar.component"

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  standalone: true,
  imports: [
    RouterOutlet,
    NgIf,
    NgClass,
    SidebarComponent,
    ToolbarComponent,

  ],
})
export class AppComponent implements OnInit, OnDestroy {
  title = "Falsified Image Detection System"
  sidebarVisible = false
  private sub = new Subscription()
  isLandingPage = false;

  constructor(
    public authService: AuthService,
    private sidebarService: SidebarService,
    private renderer: Renderer2,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1) Apply stored theme
    const theme = localStorage.getItem("theme") ?? "light"
    this.renderer.addClass(document.body, `${theme}-theme`)
    this.renderer.removeClass(document.body, theme === "light" ? "dark-theme" : "light-theme")

    // 2) Bootstrap auth
    this.authService.autoLogin()

    // 3) Subscribe to sidebar visibility
    this.sub.add(
      this.sidebarService.sidebarVisible$.subscribe((visible) => {
        this.sidebarVisible = visible
      }),
    )

    // Check if current route is workflow page
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.isLandingPage = event.url === '/' ||
        event.url === '/features' ||
        event.url === '/workflow'   ||
        event.url === '/roles'   ||
        event.url === '/about'  ||
        event.url === '/login'  ||
        event.url === '/careers'  ||
        event.url === '/contact'  ||
        event.url === '/legal'  ||
        event.url === '/docs'  ||
        event.url === '/api'  ||
        event.url === '/pricing'  ||
        event.url === '/security'  ||
        event.url === '/how-it-works'  ||
        event.url === '/support'  ||
        event.url === '/blog'  ||
        event.url === '/auth/**'  ||
        event.url === '/#features' ||
        event.url === '/#workflow'   ||
        event.url === '/#roles'   ||
        event.url === '/#about'  ||


        event.url.includes('/register');
    });
  }


  ngOnDestroy(): void {
    this.sub.unsubscribe()
  }

  /** Called when user clicks menu button */
  toggleSidebar(): void {
    this.sidebarService.toggleSidebar()
  }

  /** Called when user logs out */
  logout(): void {
    this.authService.logout()
  }
}
