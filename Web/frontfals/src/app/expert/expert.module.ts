import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule, Routes } from "@angular/router"
import { ReactiveFormsModule } from "@angular/forms"

import { ImageAnalysisComponent } from "./components/image-analysis/image-analysis.component"
import { ExpertReportsComponent } from "./components/expert-reports/expert-reports.component"
import { AnalysisDetailComponent } from "./components/analysis-detail/analysis-detail.component"
import { CreateReportComponent } from "./components/create-report/create-report.component"
import { SharedModule } from "../shared/shared.module"
import {ReportDetailComponent} from '../report/components/report-details/report-details.component';

const routes: Routes = [
  { path: "", redirectTo: "analysis", pathMatch: "full" },
  { path: "analysis", component: ImageAnalysisComponent },
  { path: "analysis/:id", component: AnalysisDetailComponent },
  { path: "reports", component: ExpertReportsComponent },
  { path: "reports/create", component: CreateReportComponent },
  { path: "reports/:reportId", component: ReportDetailComponent },

]

@NgModule({
  // REMOVE declarations for standalone components
  // declarations: [ImageAnalysisComponent, ExpertReportsComponent, AnalysisDetailComponent, CreateReportComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    SharedModule,
    // ADD standalone components to imports
    ImageAnalysisComponent,
    ExpertReportsComponent,
    AnalysisDetailComponent,
    CreateReportComponent
  ],
  // REMOVE declarations if empty
  // declarations: [],
})
export class ExpertModule {}
