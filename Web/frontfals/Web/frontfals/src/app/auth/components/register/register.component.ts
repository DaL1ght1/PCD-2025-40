import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { NgClass, NgIf } from '@angular/common';
import { FormValidationService } from '../../../core/services/form-validation.service';
import { finalize } from 'rxjs/operators';
import { RegisterRequest } from '../../../core/models/auth.model';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [ReactiveFormsModule, NgClass, NgIf, RouterLink],
  standalone: true,
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService,
    private formValidationService: FormValidationService,
  ) {}

  ngOnInit(): void {
    this.registerForm = this.formBuilder.group({
      firstname: ['', [Validators.required, Validators.minLength(2)]],
      lastname: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      role: ['', [Validators.required]],
    }, {
      validators: this.formValidationService.passwordMatchValidator('password', 'confirmPassword')
    });

    // Redirect to dashboard if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.formValidationService.markFormGroupTouched(this.registerForm);
      return;
    }

    this.loading = true;

    const registerData: RegisterRequest = {
      firstname: this.registerForm.value.firstname,
      lastname: this.registerForm.value.lastname,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      role: this.registerForm.value.role,
    };

    this.authService
      .register(registerData)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.toastr.success('Registration successful. Please check your email to verify your account.', 'Success');
          this.router.navigate(['auth/activate'], { queryParams: { email: registerData.email } });
        },
        error: (error) => {
          let errorMessage = 'Registration failed';
          if (error.status === 0) {
            errorMessage = 'Cannot connect to server. Please try again later.';
          } else if (error.message) {
            errorMessage = error.message;
          }
          this.toastr.error(errorMessage, 'Registration Failed');
        },
      });
  }
  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
    if (control && control.touched && control.errors) {
      const fieldName = controlName.charAt(0).toUpperCase() + controlName.slice(1);
      return this.formValidationService.getErrorMessage(control, fieldName);
    }
    return '';
  }
}
