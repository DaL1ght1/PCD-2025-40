import { Component, Inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { CaseDTO, CaseStatus, CaseUpdateRequest } from "../../../core/models/case.model"; // Import CaseDTO and CaseUpdateRequest
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { CommonModule } from "@angular/common";
import {CaseService} from '../../../core/services/case.service';
import { finalize, catchError } from "rxjs/operators";
import { of } from "rxjs";
import { ToastrService } from "ngx-toastr";

export interface CaseDialogData {
  caseId?: string; // Pass case ID to fetch data in the dialog
  case?: CaseDTO; // Can optionally pass the case object if already available
  mode: "view" | "edit";
}

@Component({
  selector: "app-case-dialog",
  templateUrl: './case-dialog.component.html',
  styleUrl: './case-dialog.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
})
export class CaseDialogComponent implements OnInit {
  caseForm: FormGroup;
  mode: "view" | "edit";
  isLoading = true;
  caseData: CaseDTO | null = null; // To store fetched CaseDTO

  // Expose CaseStatus enum to template
  CaseStatus = CaseStatus;


  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CaseDialogComponent>,
    private caseService: CaseService,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: CaseDialogData // Use the dialog data interface
  ) {
    this.mode = data.mode;
    // Initialize form with validators matching CaseUpdateRequest (optional fields)
    this.caseForm = this.fb.group({
      title: ['', [Validators.minLength(3), Validators.max(100)]], // Title is optional in update but min/max apply if present
      description: ['', [Validators.max(2000)]], // Description is optional in update
      status: [null, Validators.required], // Status is required for updating status
      assignedExpertId: [''], // Optional
      verdict: [''], // Optional
      judicialNotes: ['', [Validators.max(2000)]], // Optional judicial notes
      // imageIds and analysisIds are managed elsewhere, not typically updated via simple dialog form
    });

    // Disable form fields if mode is 'view'
    if (this.mode === 'view') {
      this.caseForm.disable();
    }
  }

  ngOnInit(): void {
    // Fetch case data if caseId is provided or case object is passed
    if (this.data.caseId) {
      this.loadCase(this.data.caseId);
    } else if (this.data.case) {
      this.caseData = this.data.case;
      this.patchForm(this.caseData);
      this.isLoading = false;
    } else {
      // This should not happen in 'view' or 'edit' mode
      this.toastr.error("Case data missing for dialog.");
      this.dialogRef.close();
    }
  }

  loadCase(caseId: string): void {
    this.isLoading = true;
    this.caseService.getCaseById(caseId)
      .pipe(
        finalize(() => this.isLoading = false),
        catchError(error => {
          this.toastr.error(error.message || 'Failed to load case data for dialog.', 'Error');
          this.dialogRef.close(); // Close dialog on error
          return of(null);
        })
      )
      .subscribe(caseDTO => {
        if (caseDTO) {
          this.caseData = caseDTO;
          this.patchForm(caseDTO);
        }
      });
  }

  patchForm(caseDTO: CaseDTO): void {
    // Patch form with data from the fetched CaseDTO
    this.caseForm.patchValue({
      title: caseDTO.title,
      description: caseDTO.description,
      status: caseDTO.status,
      assignedExpertId: caseDTO.assignedExpertId,
      verdict: caseDTO.verdict,
      judicialNotes: caseDTO.judicialNotes,
    });
    // Note: IncidentDate, location, additionalNotes are not in CaseDTO, so they are removed here.
    // If you need them, they must be added to the backend Case model and DTO.
  }

  save(): void {
    if (this.caseForm.invalid) {
      this.toastr.warning("Please correct the errors in the form.", "Validation Failed");
      this.caseForm.markAllAsTouched();
      return;
    }

    // Collect only the fields that were touched or have values for the update request
    const formValues = this.caseForm.value;
    const updateRequest: CaseUpdateRequest = {};

    // Conditionally add properties to the update request if they are present or explicitly changed
    if (formValues.title !== null && formValues.title !== undefined) updateRequest.title = formValues.title;
    if (formValues.description !== null && formValues.description !== undefined) updateRequest.description = formValues.description;
    if (formValues.status !== null && formValues.status !== undefined) updateRequest.status = formValues.status;
    if (formValues.assignedExpertId !== null && formValues.assignedExpertId !== undefined) updateRequest.assignedExpertId = formValues.assignedExpertId;
    if (formValues.verdict !== null && formValues.verdict !== undefined) updateRequest.verdict = formValues.verdict;
    if (formValues.judicialNotes !== null && formValues.judicialNotes !== undefined) updateRequest.judicialNotes = formValues.judicialNotes;

    // Add other fields from CaseUpdateRequest if your dialog handles them (e.g., imageIds, analysisIds)
    // if (this.caseData?.imageIds) updateRequest.imageIds = this.caseData.imageIds; // Example: Keep existing imageIds unless dialog allows changing them
    // if (this.caseData?.analysisIds) updateRequest.analysisIds = this.caseData.analysisIds; // Example


    // Pass the update request back to the component that opened the dialog
    this.dialogRef.close(updateRequest);
  }

  // Convenience getter for easy access to form fields (optional, but useful)
  get f() { return this.caseForm.controls; }

}
