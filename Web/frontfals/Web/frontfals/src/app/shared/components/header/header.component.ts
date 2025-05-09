import { Component,OnInit } from "@angular/core"
import {  Router, RouterLink } from "@angular/router"
import  { AuthService } from "../../../core/services/auth.service"
import  { User } from "../../../core/models/user.model"

@Component({
  standalone: true,
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
  imports: [RouterLink],
})
export class HeaderComponent implements OnInit {
  currentUser: User | null = null

  constructor(
    public authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user
    })
  }

  logout(): void {
    this.authService.logout()
    this.router.navigate(["/login"])
  }
}
