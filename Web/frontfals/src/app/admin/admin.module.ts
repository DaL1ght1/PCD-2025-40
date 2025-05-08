import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule,Routes } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import { SharedModule } from "../shared/shared.module";
import { DashboardComponent } from "./components/admin-dashboard/dashboard.component";
import { UserManagementComponent } from "./components/user-management/user-management.component";
import { UserDialogComponent } from "./components/user-dialog/user-dialog.component";
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
const routes: Routes = [
  { path: "", redirectTo: "users", pathMatch: "full" },
  { path: "users", component: UserManagementComponent },
  { path: "stats", component: DashboardComponent },
];
@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    MatMenuModule,
    MatInputModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatPaginatorModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatCardModule,
    MatDialogModule,
    DashboardComponent,
    UserManagementComponent,
    UserDialogComponent
  ],
  exports: [RouterModule]
})
export class AdminModule {}
