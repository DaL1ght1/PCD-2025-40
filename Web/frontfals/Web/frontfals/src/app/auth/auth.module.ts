import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common" // Import CommonModule
import { RouterModule } from "@angular/router"
import { ReactiveFormsModule } from "@angular/forms" // Import ReactiveFormsModule

import { LoginComponent } from "./components/login/login.component"
import { RegisterComponent } from "./components/register/register.component"
import { ForgotPasswordComponent } from "./components/forgot-password/forgot-password.component"
import { ResetPasswordComponent } from "./components/reset-password/reset-password.component"
import { SharedModule } from "../shared/shared.module"

@NgModule({
  declarations: [],
  imports: [
    CommonModule, // Add CommonModule here
    RouterModule,
    ReactiveFormsModule, // Add ReactiveFormsModule here
    SharedModule,
    LoginComponent, RegisterComponent, ForgotPasswordComponent, ResetPasswordComponent
  ],
})
export class AuthModule {}
