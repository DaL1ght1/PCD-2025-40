import { Component, OnInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { NgClass, NgForOf, NgIf } from '@angular/common';

@Component({
  selector: 'app-activation',
  templateUrl: './activation.component.html',
  styleUrls: ['./activation.component.scss'],
  imports: [ReactiveFormsModule, NgClass, NgIf, RouterLink, NgForOf],
  standalone: true,
})
export class ActivationComponent implements OnInit {
  activationForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  success = '';
  email = '';

  @ViewChildren('inputRef') codeInputs: QueryList<ElementRef<HTMLInputElement>>;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService
  ) {
    this.activationForm = this.formBuilder.group({
      digit1: ['', [Validators.required, Validators.pattern('[0-9]')]],
      digit2: ['', [Validators.required, Validators.pattern('[0-9]')]],
      digit3: ['', [Validators.required, Validators.pattern('[0-9]')]],
      digit4: ['', [Validators.required, Validators.pattern('[0-9]')]],
      digit5: ['', [Validators.required, Validators.pattern('[0-9]')]],
      digit6: ['', [Validators.required, Validators.pattern('[0-9]')]],
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.email = params['email'] || '';
    });

    const token = this.route.snapshot.queryParams['token'];
    if (token) {
      this.activateWithToken(token);
    }
  }

  restrictToNumbers(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^0-9]/g, '');
    this.activationForm.get(`digit${index + 1}`)?.setValue(value);
    input.value = value;
  }

  onDigitInput(event: any, currentIndex: number): void {
    const input = event.target;
    const value = input.value;

    if (value.length === 1 && currentIndex < 5) {
      this.codeInputs.toArray()[currentIndex + 1].nativeElement.focus();
    }

    if (event.key === 'Backspace' && value.length === 0 && currentIndex > 0) {
      this.codeInputs.toArray()[currentIndex - 1].nativeElement.focus();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const pastedText = clipboardData.getData('text').trim();

    if (/^\d{6}$/.test(pastedText)) {
      const digits = pastedText.split('');

      this.activationForm.patchValue({
        digit1: digits[0],
        digit2: digits[1],
        digit3: digits[2],
        digit4: digits[4],
        digit5: digits[5],
        digit6: digits[6],
      });

      this.codeInputs.toArray()[5].nativeElement.focus();
    }
  }

  // In ActivationComponent
  onSubmit(): void {
    this.submitted = true;

    if (this.activationForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const code =
      this.activationForm.value.digit1 +
      this.activationForm.value.digit2 +
      this.activationForm.value.digit3 +
      this.activationForm.value.digit4 +
      this.activationForm.value.digit5 +
      this.activationForm.value.digit6;

    this.authService.activateAccount(code).subscribe({
      next: () => {
        this.success = 'Your account has been successfully activated!';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.error = error.message || 'Activation failed. Please try again.';
        this.loading = false;
      },
    });
  }

  activateWithToken(token: string): void {
    this.loading = true;
    this.error = '';

    this.authService.activateAccountWithToken(token).subscribe({
      next: () => {
        this.success = 'Your account has been successfully activated!';
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (error) => {
        this.error = error.message || 'Activation failed. Please try again.';
        this.loading = false;
      },
    });
  }

  resendCode(): void {
    if (!this.email) {
      this.toastr.error('Email address is required to resend the code', 'Error');
      return;
    }

    this.authService.resendActivationCode(this.email).subscribe({
      next: () => {
        // Success toast is handled in AuthService
      },
      error: (error) => {
        this.toastr.error(error.message || 'Failed to resend activation code', 'Error');
      },
    });
  }
}
