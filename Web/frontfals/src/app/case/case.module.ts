import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Routes } from "@angular/router";
import { SharedModule } from "../shared/shared.module";
import { CaseDialogComponent } from "./components/case-dialog/case-dialog.component";
import { CaseListComponent } from "./components/case-list/case-list.component";
import { CaseManagementComponent } from "./components/case-managment/case-management.component";
import {ReportDetailComponent} from '../report/components/report-details/report-details.component';

const routes: Routes = [
  { path: "", component: CaseManagementComponent },
  { path: ":caseid", component: CaseListComponent },
  { path: "reports/:reportId", component: ReportDetailComponent },

];

@NgModule({
  declarations: [], // No components declared here since they are standalone
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes)], // Only import modules
  exports: [RouterModule],
})
export class CaseModule {}
