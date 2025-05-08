import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule, Routes } from "@angular/router"
import {FormsModule, ReactiveFormsModule} from "@angular/forms"
import { NgxDropzoneModule } from "ngx-dropzone"

import { SubmitCaseComponent } from "./components/submit-case/submit-case.component"
import { InvestigatorCasesComponent } from "./components/investigator-cases/investigator-cases.component"
import { SharedModule } from "../shared/shared.module"

const routes: Routes = [
  { path: "", redirectTo: "cases", pathMatch: "full" },
  { path: "submit", component: SubmitCaseComponent },
  { path: "cases", component: InvestigatorCasesComponent },
]

@NgModule({
  // REMOVE declarations for standalone components
  // declarations: [SubmitCaseComponent, InvestigatorCasesComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    NgxDropzoneModule,
    SharedModule,
    FormsModule,
    // ADD standalone components to imports
    SubmitCaseComponent,
    InvestigatorCasesComponent
  ],
  // REMOVE declarations if empty
  // declarations: [],
})
export class InvestigatorModule {}
