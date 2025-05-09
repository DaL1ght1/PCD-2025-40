import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { NgClass, NgIf } from '@angular/common';
import { FormValidationService } from '../../../core/services/form-validation.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  imports: [ReactiveFormsModule, NgClass, NgIf, RouterLink],
  standalone: true,
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  loading = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService,
    private formValidationService: FormValidationService,
  ) {}

  ngOnInit(): void {
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });

    // Redirect to dashboard if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.formValidationService.markFormGroupTouched(this.forgotPasswordForm);
      return;
    }

    this.loading = true;

    this.authService
      .forgotPassword({ email: this.forgotPasswordForm.value.email })
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.toastr.success('Password reset instructions sent to your email', 'Success');
          this.router.navigate(['/login']);
        },
        error: (error) => {
          let errorMessage = 'Failed to send password reset email';

          if (error.status === 0) {
            errorMessage = 'Cannot connect to server. Please try again later.';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }

          this.toastr.error(errorMessage, 'Error');
        },
      });
  }

  getErrorMessage(controlName: string): string {
    const control = this.forgotPasswordForm.get(controlName);
    if (control && control.touched && control.errors) {
      return this.formValidationService.getErrorMessage(control, 'Email');
    }
    return '';
  }
}
