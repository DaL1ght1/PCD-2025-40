import { Injectable } from "@angular/core"
import {  AbstractControl, FormGroup,  ValidationErrors,  ValidatorFn } from "@angular/forms"

@Injectable({
  providedIn: "root",
})
export class FormValidationService {
  /**
   * Get validation error message for a form control
   */
  getErrorMessage(control: AbstractControl, fieldName: string): string {
    if (control.hasError("required")) {
      return `${fieldName} is required`
    }

    if (control.hasError("email")) {
      return `Please enter a valid email address`
    }

    if (control.hasError("minlength")) {
      const requiredLength = control.getError("minlength").requiredLength
      return `${fieldName} must be at least ${requiredLength} characters`
    }

    if (control.hasError("maxlength")) {
      const requiredLength = control.getError("maxlength").requiredLength
      return `${fieldName} cannot exceed ${requiredLength} characters`
    }

    if (control.hasError("pattern")) {
      return `${fieldName} format is invalid`
    }

    if (control.hasError("passwordMismatch")) {
      return `Passwords do not match`
    }

    if (control.hasError("invalidFileType")) {
      return `Invalid file type. Allowed types: ${control.getError("invalidFileType").allowedTypes}`
    }

    if (control.hasError("maxFileSize")) {
      const maxSize = control.getError("maxFileSize").maxSize / (1024 * 1024)
      return `File size cannot exceed ${maxSize} MB`
    }

    return "Invalid input"
  }

  /**
   * Mark all form controls as touched to trigger validation
   */
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key)
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control)
      } else {
        control?.markAsTouched()
      }
    })
  }

  /**
   * Custom validator for password matching
   */
  passwordMatchValidator(controlName: string, matchingControlName: string): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const control = (formGroup as FormGroup).controls[controlName]
      const matchingControl = (formGroup as FormGroup).controls[matchingControlName]

      if (matchingControl.errors && !matchingControl.errors["passwordMismatch"]) {
        return null
      }

      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ passwordMismatch: true })
        return { passwordMismatch: true }
      } else {
        matchingControl.setErrors(null)
        return null
      }
    }
  }

  /**
   * Custom validator for file type
   */
  fileTypeValidator(allowedTypes: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !(control.value instanceof File)) {
        return null
      }

      const file = control.value as File
      const fileType = file.type

      if (!allowedTypes.includes(fileType)) {
        return {
          invalidFileType: {
            allowedTypes: allowedTypes.join(", "),
          },
        }
      }

      return null
    }
  }

  /**
   * Custom validator for file size
   */
  fileSizeValidator(maxSize: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !(control.value instanceof File)) {
        return null
      }

      const file = control.value as File

      if (file.size > maxSize) {
        return {
          maxFileSize: {
            maxSize: maxSize,
            actualSize: file.size,
          },
        }
      }

      return null
    }
  }
}
