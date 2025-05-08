import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule, Routes } from "@angular/router"
import { SharedModule } from "../shared/shared.module"
import { LawyerDashboardComponent } from "./components/lawyer-dashboard/lawyer-dashboard.component"
import { LegalDocumentsComponent } from "./components/legal-documents/legal-documents.component"

// Define routes for the lawyer feature
const routes: Routes = [
  { path: "", redirectTo: "cases", pathMatch: "full" },
  { path: "cases", component: LawyerDashboardComponent },
  { path: "documents", component: LegalDocumentsComponent },
]

@NgModule({
  // REMOVE declarations for standalone components
  // declarations: [LawyerDashboardComponent, LegalDocumentsComponent],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes),
    // ADD standalone components to imports
    LawyerDashboardComponent,
    LegalDocumentsComponent
  ],
  // REMOVE declarations if empty
  // declarations: [],
  exports: [RouterModule], // Keep exports if needed
})
export class LawyerModule {}
