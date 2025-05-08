import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class SidebarService {
  private sidebarVisibleSubject = new BehaviorSubject<boolean>(true);
  public sidebarVisible$: Observable<boolean> = this.sidebarVisibleSubject.asObservable();

  constructor() {
    // Initialize from localStorage if available
    const savedState = localStorage.getItem("sidebarExpanded");
    if (savedState !== null) {
      this.sidebarVisibleSubject.next(savedState === "true");
    }
  }

  setSidebarVisible(isVisible: boolean): void {
    this.sidebarVisibleSubject.next(isVisible);
  }

  showSidebar(): void {
    this.sidebarVisibleSubject.next(true);
    localStorage.setItem("sidebarExpanded", "true");
  }

  hideSidebar(): void {
    this.sidebarVisibleSubject.next(false);
    localStorage.setItem("sidebarExpanded", "false");
  }

  toggleSidebar(): void {
    const newState = !this.sidebarVisibleSubject.value;
    this.sidebarVisibleSubject.next(newState);
    localStorage.setItem("sidebarExpanded", newState.toString());
  }
}
