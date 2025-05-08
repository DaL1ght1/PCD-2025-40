import { Component,  OnInit } from "@angular/core"
import {  FormBuilder,  FormGroup, ReactiveFormsModule, Validators } from "@angular/forms"
import {  Router,  ActivatedRoute, RouterLink } from "@angular/router"
import  { AuthService } from "../../../core/services/auth.service"
import  { ToastrService } from "ngx-toastr"
import { NgClass, NgIf } from "@angular/common"
import  { FormValidationService } from "../../../core/services/form-validation.service"
import { finalize } from "rxjs/operators"
import  { HealthCheckService } from "../../../core/services/heath-check.service"

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
  imports: [ReactiveFormsModule, NgClass, NgIf, RouterLink],
  standalone: true,
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup
  loading = false
  returnUrl = "/dashboard"
  hidePassword = true
  serverReachable = true

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private healthService: HealthCheckService,
    private toastr: ToastrService,
    private formValidationService: FormValidationService,
  ) {}

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    })

    // Get return url from route parameters or default to '/dashboard'
    this.returnUrl = this.route.snapshot.queryParams["returnUrl"] || "/dashboard"

    // Redirect to dashboard if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl])
    }

    // Check if server is reachable
    this.checkServerConnection()
  }

  checkServerConnection(): void {
    this.healthService.isServerReachable().subscribe((reachable) => {
      this.serverReachable = reachable
      if (!reachable) {
        this.toastr.error(
          "Cannot connect to the server. Please check your network connection or try again later.",
          "Connection Error",
        )
      }
    })
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.formValidationService.markFormGroupTouched(this.loginForm)
      return
    }

    // If server is not reachable, show error and don't attempt login
    if (!this.serverReachable) {
      this.toastr.error(
        "Cannot connect to the server. Please check your network connection or try again later.",
        "Connection Error",
      )
      this.checkServerConnection(); // Optionally re-check connection
      return
    }

    this.loading = true

    this.authService
      .login({
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
      })
      .pipe(
        finalize(() => {
          this.loading = false
        }),
      )
      .subscribe({
        next: (response) => {
          this.toastr.success("Login successful", "Success")
          this.router.navigate([this.returnUrl])
        },
        error: (error) => {
          console.error("Login error details:", error)
          let errorMessage = "An unexpected error occurred during login. Please try again." // Default message
          let errorTitle = "Login Failed"

          if (error.status === 0) { // Network error or server unreachable
            errorMessage = "Cannot connect to the server. Please check your network connection or try again later."
            errorTitle = "Connection Error"
            this.serverReachable = false // Update serverReachable state
          } else if (error.status === 401) { // Unauthorized - typically wrong credentials
            errorMessage = "Invalid email or password. Please check your credentials and try again."
            // errorTitle remains "Login Failed"
          } else if (error.status === 403) { // Forbidden - various reasons like inactive account, locked account, etc.
            // Attempt to parse error.error.message if it exists and is a string
            const backendMessage = typeof error.error?.message === 'string' ? error.error.message.toLowerCase() : '';

            if (backendMessage.includes("account not activated") || backendMessage.includes("pending activation")) {
              errorMessage = "Your account has not been activated. Please check your email for an activation link or contact support."
              errorTitle = "Account Not Activated"
            } else if (backendMessage.includes("account locked") || backendMessage.includes("account disabled")) {
              errorMessage = "Your account has been locked or disabled. Please contact support."
              errorTitle = "Account Locked"
            } else if (backendMessage.includes("verify your email") || backendMessage.includes("email not verified")) {
              errorMessage = "Please verify your email address before logging in. Check your inbox for a verification email."
              errorTitle = "Email Verification Required"
            } else if (error.error?.message) { // Use backend message for other 403s if available
              errorMessage = error.error.message
            } else {
              errorMessage = "Access denied. You do not have permission to log in with these credentials." // Generic 403
            }
          } else if (error.message && error.message.includes("Invalid authentication response")) { // Non-standard error format
            errorMessage = "The server returned an invalid response. Please contact support if the issue persists."
          } else if (error.error?.message && typeof error.error.message === 'string') { // General backend error message for other statuses
            errorMessage = error.error.message
          } else if (error.message) { // Fallback to the HttpErrorResponse's message property
            errorMessage = error.message
          }

          this.toastr.error(errorMessage, errorTitle)
        },
      })
  }

  getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName)
    if (control && control.touched && control.errors) {
      return this.formValidationService.getErrorMessage(control, controlName === "email" ? "Email" : "Password")
    }
    return ""
  }
}
