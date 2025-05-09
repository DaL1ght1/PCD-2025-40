import { Component, OnInit, Inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from "@angular/material/dialog";
import { User } from "../../../core/models/user.model";
import { CreateUserRequest, UpdateUserRequest } from "../../../core/services/admin.service";

export interface UserFormDialogData {
  user?: User;
  isEdit: boolean;
}

@Component({
  selector: "app-user-dialog",
  templateUrl: "./user-dialog.component.html",
  styleUrls: ["./user-dialog.component.scss"],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
})
export class UserDialogComponent implements OnInit {
  userForm: FormGroup;
  submitted = false;
  showPassword = false;

  constructor(
    public dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserFormDialogData,
    private fb: FormBuilder,
  ) {
    this.userForm = this.fb.group({
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ["", Validators.required],
      status: ["Active", Validators.required],
      password: [
        "",
        this.data.isEdit ? [Validators.minLength(8)] : [Validators.required, Validators.minLength(8)]
      ],
      address: ['']
    });
  }

  ngOnInit(): void {
    if (this.data.isEdit && this.data.user) {
      this.userForm.patchValue({
        firstname: this.data.user.firstname,
        lastname: this.data.user.lastname,
        email: this.data.user.email,
        role: this.data.user.role[0],
        status: this.data.user.enabled ? "Active" : this.data.user.enabled === false ? "Inactive" : "Pending",
        password: "",
        address: this.data.user.address || ""
      });
    }
  }

  get f() {
    return this.userForm.controls;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.userForm.invalid) {
      return;
    }

    const formValues = this.userForm.value;
    const activeStatus = formValues.status === "Active";

    const commonData = {
      firstname: formValues.firstname,
      lastname: formValues.lastname,
      email: formValues.email,
      address: formValues.address || undefined,
      password: formValues.password || undefined,
    };

    let finalUserData: CreateUserRequest | UpdateUserRequest;

    if (this.data.isEdit) {
      finalUserData = {
        ...commonData,
        role: [formValues.role],
        active: activeStatus
      } as UpdateUserRequest;
    } else {
      finalUserData = {
        ...commonData,
        role: formValues.role,
        active: activeStatus
      } as CreateUserRequest;
    }

    this.dialogRef.close(finalUserData);
  }
}
