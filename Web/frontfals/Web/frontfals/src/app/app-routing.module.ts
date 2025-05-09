import { NgModule } from "@angular/core"
import { RouterModule,Routes } from "@angular/router"
import { AuthGuard } from "./core/guards/auth.guard"
import { RoleGuard } from "./core/guards/role.guard"
import { LoginComponent } from "./auth/components/login/login.component"
import { RegisterComponent } from "./auth/components/register/register.component"
import { ForgotPasswordComponent } from "./auth/components/forgot-password/forgot-password.component"
import { ResetPasswordComponent } from "./auth/components/reset-password/reset-password.component"
import { DashboardComponent } from "./dashboard/components/dashboard/dashboard.component"
import { NotFoundComponent } from "./shared/components/not-found/not-found.component"
import { ProfileComponent } from "./profile/components/profile/profile.component"
import { SettingsComponent } from "./settings/components/settings/settings.component"
import { LandingPageComponent } from "./landing-page/landing-page.component"
import {ActivationComponent} from './auth/components/activation/activation.component';
const routes: Routes = [
  {
    path: "",
    loadChildren: () => import("./landing-page/landing-page.routes").then(mod => mod.LANDING_ROUTES)
  },
  { path: "login", component: LoginComponent },
  { path: "register", component: RegisterComponent },
  { path: 'auth/activate', component: ActivationComponent },
  { path: "forgot-password", component: ForgotPasswordComponent },
  { path: "reset-password", component: ResetPasswordComponent },
  {
    path: "dashboard",
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  {
    path: "profile",
    component: ProfileComponent,
    canActivate: [AuthGuard],
  },
  {
    path: "settings",
    component: SettingsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: "admin",
    loadChildren: () => import("./admin/admin.module").then((m) => m.AdminModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ["ROLE_ADMIN"] },
  },
  {
    path: "expert",
    loadChildren: () => import("./expert/expert.module").then((m) => m.ExpertModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ["ROLE_EXPERT"] },
  },
  {
    path: "investigator",
    loadChildren: () => import("./investigator/investigator.module").then((m) => m.InvestigatorModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ["ROLE_INVESTIGATOR"] },
  },
  {
    path: "lawyer",
    loadChildren: () => import("./lawyer/lawyer.module").then((m) => m.LawyerModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ["ROLE_LAWYER"] },
  },
  {
    path: "judge",
    loadChildren: () => import("./judge/judge.module").then((m) => m.JudgeModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ["ROLE_JUDGE"] },
  },
  {
    path: "cases",
    loadChildren: () => import("./case/case.module").then((m) => m.CaseModule),
    canActivate: [AuthGuard],
  },
  {
    path: "reports",
    loadChildren: () => import("./report/report.module").then((m) => m.ReportModule),
    canActivate: [AuthGuard],
  },
  {
    path: "images",
    loadChildren: () => import("./image/image.module").then((m) => m.ImageModule),
    canActivate: [AuthGuard],
  },



  { path: "**", component: NotFoundComponent },
]
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
