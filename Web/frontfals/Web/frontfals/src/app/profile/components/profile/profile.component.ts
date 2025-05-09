import { Component,OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import {  FormBuilder,FormGroup, ReactiveFormsModule, Validators } from "@angular/forms"
import  { AuthService } from "../../../core/services/auth.service"
import  { User } from "../../../core/models/user.model"
import  { ToastrService } from "ngx-toastr"

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"],
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup
  currentUser: User | null = null
  loading = false

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastr: ToastrService,
  ) {
    this.profileForm = this.fb.group({
      firstname: ["", Validators.required],
      lastname: ["", Validators.required],
      email: [{ value: "", disabled: true }],
      role: [{ value: "", disabled: true }],
    })
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user
      if (user) {
        this.profileForm.patchValue({
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          role: user.role[0],
        })
      }
    })
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      return
    }

    this.loading = true
    // Here you would typically call a service to update the profile
    // For now, we'll just show a success message
    setTimeout(() => {
      this.loading = false
      this.toastr.success("Profile updated successfully", "Success")
    }, 1000)
  }
}
