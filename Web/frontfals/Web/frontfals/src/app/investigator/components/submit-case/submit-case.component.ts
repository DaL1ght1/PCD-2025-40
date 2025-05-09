import { Component, OnInit } from "@angular/core"
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms"
import {Router, RouterLink} from "@angular/router"
import{ CaseService } from "../../../core/services/case.service" // Import CaseService
import{ CaseCreationRequest } from "../../../core/models/case.model" // Import CaseCreationRequest
import{ ToastrService } from "ngx-toastr"
import {NgxDropzoneChangeEvent, NgxDropzoneModule} from "ngx-dropzone"
import {DecimalPipe, NgClass, NgForOf, NgIf} from '@angular/common';
import { finalize, catchError } from "rxjs/operators"
import { of } from "rxjs"
import { AuthService } from "../../../core/services/auth.service"; // Import AuthService


@Component({
  imports: [
    ReactiveFormsModule,
    NgClass,
    NgIf,
    NgxDropzoneModule,
    NgForOf,
    DecimalPipe,
    RouterLink

  ],
  standalone: true,
  selector: "app-submit-case",
  templateUrl: "./submit-case.component.html",
  styleUrls: ["./submit-case.component.scss"],
})
export class SubmitCaseComponent implements OnInit {
  caseForm: FormGroup
  loading = false
  files: File[] = [] // Files selected in the dropzone

  constructor(
    private fb: FormBuilder,
    private caseService: CaseService, // Inject CaseService
    private router: Router,
    private toastr: ToastrService,
    private authService: AuthService // Inject AuthService
  ) {
    // Initialize form with validators matching CaseCreationRequest
    this.caseForm = this.fb.group({
      title: ["", [Validators.required, Validators.minLength(3), Validators.max(100)]], // Match backend validation
      description: ["", [Validators.max(2000)]], // Match backend validation
      // incidentDate, location, additionalNotes are NOT in CaseCreationRequest
      // They should be removed from the form or handled separately if needed later in the workflow
      // For now, removing them from the form.
      // incidentDate: ["", Validators.required],
      // location: [""],
      // additionalNotes: [""],

      // investigatorId is required by CaseCreationRequest
      // Set a default from the current user, but keep it required in the form definition
      investigatorId: [this.authService.getCurrentUser()?.id, [Validators.required]],

      // imageIds is part of CaseCreationRequest, but typically populated *after* image upload
      // It's better to upload images separately and then potentially link them to the case after creation.
      // If you *must* include image IDs on case creation, you'd upload files first, get IDs, and put them here.
      // For this form, we'll collect the files, but the onSubmit will need adjustment or image upload moved.
      // Let's remove `images` as a form control and handle `files` separately for now.
      // images: [null], // Removed as it doesn't match CaseCreationRequest

      // We won't add imageIds to the form initially, they'd be added after upload (if doing it this way)
    })
  }

  ngOnInit(): void {
    // Set the investigatorId default value here if not set in the constructor
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && !this.caseForm.value.investigatorId) {
      this.caseForm.patchValue({ investigatorId: currentUser.id });
    }
    // Disable investigatorId if it's auto-populated and shouldn't be changed?
    // this.caseForm.get('investigatorId')?.disable(); // Optional: disable if auto-set
  }

  onSelect(event: NgxDropzoneChangeEvent): void {
    // Handle files selected in the dropzone
    this.files.push(...event.addedFiles)
    // Note: These files are NOT automatically attached to the caseForm like a typical file input
    // You would need to implement file upload logic here or in onSubmit to get image IDs.
  }

  onRemove(file: File): void {
    // Handle file removal from the dropzone list
    this.files.splice(this.files.indexOf(file), 1)
  }

  onSubmit(): void {
    // Check if the form is valid based on CaseCreationRequest fields
    if (this.caseForm.invalid) {
      this.toastr.error("Please fill all required fields correctly", "Validation Error")
      this.caseForm.markAllAsTouched() // Mark fields to show errors
      return
    }

    // Check if images are selected (assuming images will be linked somehow after case creation)
    if (this.files.length === 0) {
      // If images are uploaded separately later, this check might be removed
      this.toastr.warning("Please upload at least one image", "Information")
      // Decide if you *require* images on submission. If not, remove this return.
      // return;
    }


    this.loading = true
    const formValue = this.caseForm.value; // Get form values for title, description, investigatorId

    const caseCreationRequest: CaseCreationRequest = {
      title: formValue.title,
      description: formValue.description,
      investigatorId: formValue.investigatorId,
      imageIds: [] // Start with empty array, images will be linked later
      // If you upload images *before* creating the case and have their IDs, populate imageIds here.
    };

    // Call the createCase endpoint
    this.caseService.createCase(caseCreationRequest) // Use createCase endpoint
      .pipe(
        finalize(() => { this.loading = false; }), // Ensure loading is false regardless of success/error
        catchError((error) => { // Handle specific API errors
          console.error("Case submission error:", error);
          this.toastr.error(error.message || "Failed to submit case", "Error");
          return of(null); // Return null or throw error based on desired handling
        })
      )
      .subscribe((response) => {
        if (response) { // Check if response is not null due to catchError returning null
          this.toastr.success("Case submitted successfully", "Success");

          // --- IMAGE UPLOAD AFTER CASE CREATION (example logic) ---
          // This is a common pattern: create the case first, then upload images using the returned case ID.
          // You would then navigate to the case detail page to show the uploaded images.
          // If you collected files in 'this.files', you'd upload them *now* one by one or in batch,
          // using `this.imageService.uploadImage(file, response.id, userId)`.
          // For simplicity in this onSubmit, we'll just navigate after case creation.

          this.router.navigate(["/investigator/cases"]); // Navigate to the cases list
        }
      });
  }
}
