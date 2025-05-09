import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule, type Routes } from "@angular/router"
import { ReactiveFormsModule } from "@angular/forms"

import { CaseReportsComponent } from "./components/case-reports/case-reports.component"
import { CaseDetailComponent } from "./components/case-detail/case-detail.component"
import { JudicialDecisionComponent } from "./components/judicial-decision/judicial-decision.component"
import { AllCasesComponent } from "./components/all-cases/all-cases.component"
import { SharedModule } from "../shared/shared.module"

const routes: Routes = [
  { path: "", redirectTo: "dashboard", pathMatch: "full" },
  { path: "dashboard", component: JudicialDecisionComponent },
  { path: "reports", component: CaseReportsComponent },
  { path: "reports/:id", component: CaseDetailComponent },
  { path: "decisions", component: JudicialDecisionComponent },
  { path: "all-cases", component: AllCasesComponent },
]

@NgModule({
  imports: [

    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    SharedModule
  ],
})
export class JudgeModule {}
