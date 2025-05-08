import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { NgClass, NgIf } from '@angular/common';
import { FormValidationService } from '../../../core/services/form-validation.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  imports: [ReactiveFormsModule, NgClass, NgIf, RouterLink],
  standalone: true,
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  loading = false;
  token = '';
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private toastr: ToastrService,
    private formValidationService: FormValidationService,
  ) {}

  ngOnInit(): void {
    this.resetPasswordForm = this.formBuilder.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    }, {
      validators: this.formValidationService.passwordMatchValidator('password', 'confirmPassword')
    });

    // Get token from route parameters
    this.token = this.route.snapshot.queryParams['token'] || '';

    if (!this.token) {
      this.toastr.error('Invalid or missing reset token', 'Error');
      this.router.navigate(['/forgot-password']);
    }

    // Redirect to dashboard if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid) {
      this.formValidationService.markFormGroupTouched(this.resetPasswordForm);
      return;
    }

    this.loading = true;

    this.authService
      .resetPassword({
        token: this.token,
        password: this.resetPasswordForm.value.password,
        confirmPassword: this.resetPasswordForm.value.confirmPassword,
      })
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.toastr.success('Password reset successful. Please login with your new password.', 'Success');
          this.router.navigate(['/login']);
        },
        error: (error) => {
          let errorMessage = 'Failed to reset password';

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
    const control = this.resetPasswordForm.get(controlName);
    if (control && control.touched && control.errors) {
      const fieldName = controlName === 'password' ? 'Password' : 'Confirm Password';
      return this.formValidationService.getErrorMessage(control, fieldName);
    }
    return '';
  }
}
