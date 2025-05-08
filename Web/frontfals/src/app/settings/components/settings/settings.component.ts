import { Component } from "@angular/core"
import { CommonModule } from "@angular/common"
import {  FormBuilder,FormGroup, ReactiveFormsModule } from "@angular/forms"
import  { ToastrService } from "ngx-toastr"

@Component({
  selector: "app-settings",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.scss"],
})
export class SettingsComponent {
  notificationSettings: FormGroup
  securitySettings: FormGroup
  loading = false

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
  ) {
    this.notificationSettings = this.fb.group({
      emailNotifications: [true],
      caseUpdates: [true],
      analysisCompleted: [true],
      systemAnnouncements: [false],
    })

    this.securitySettings = this.fb.group({
      twoFactorAuth: [false],
      sessionTimeout: ["30"],
    })
  }

  saveNotificationSettings(): void {
    this.loading = true
    // Simulate API call
    setTimeout(() => {
      this.loading = false
      this.toastr.success("Notification settings saved", "Success")
    }, 1000)
  }

  saveSecuritySettings(): void {
    this.loading = true
    // Simulate API call
    setTimeout(() => {
      this.loading = false
      this.toastr.success("Security settings saved", "Success")
    }, 1000)
  }
}
