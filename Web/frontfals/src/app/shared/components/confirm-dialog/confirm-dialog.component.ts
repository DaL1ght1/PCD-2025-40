import { Component, Inject } from "@angular/core"
import { CommonModule } from "@angular/common"
import { MAT_DIALOG_DATA,  MatDialogRef, MatDialogModule } from "@angular/material/dialog"

export interface ConfirmationDialogData {
  title: string
  message: string
  detail?: string
  confirmText?: string
  cancelText?: string
  confirmClass?: string
}

@Component({
  selector: "app-confirmation-dialog",
  templateUrl: "./confirm-dialog.component.html",
  styleUrls: ["./confirm-dialog.component.scss"],
  standalone: true,
  imports: [CommonModule, MatDialogModule],
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {}
}
