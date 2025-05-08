import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { User } from '../../../core/models/user.model'; // Assuming User model exists
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

export interface AssignExpertDialogData {
  experts: User[]; // List of available experts
  caseTitle: string; // To display in the dialog
}

@Component({
  selector: 'app-assign-expert-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './assign-expert-dialog.component.html',
  styleUrls: ['./assign-expert-dialog.component.scss']
})
export class AssignExpertDialogComponent {
  selectedExpertId: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<AssignExpertDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignExpertDialogData
  ) {}

  onAssignClick(): void {
    if (this.selectedExpertId) {
      this.dialogRef.close(this.selectedExpertId);
    }
  }

  onCancelClick(): void {
    this.dialogRef.close(null);
  }
}
