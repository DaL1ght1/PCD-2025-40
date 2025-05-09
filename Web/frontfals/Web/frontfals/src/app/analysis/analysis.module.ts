import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule, type Routes } from "@angular/router"
import { SharedModule } from "../shared/shared.module"
import { AnalysisListComponent } from "./components/analysis-list/analysis-list.component" // Import the component

const routes: Routes = [
  { path: "", component: AnalysisListComponent }, // Define the route
]

@NgModule({
  declarations: [],
  imports: [CommonModule, AnalysisListComponent,SharedModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AnalysisModule {}
