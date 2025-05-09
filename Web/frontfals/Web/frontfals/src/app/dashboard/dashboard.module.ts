import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common" // Import CommonModule
import { RouterModule } from "@angular/router"
import { BaseChartDirective } from "ng2-charts"

import { DashboardComponent } from "./components/dashboard/dashboard.component"
import { SharedModule } from "../shared/shared.module"
import { StatCardComponent } from "./components/stat-card/stat-card.component"
import { RecentCasesComponent } from "./components/recent-cases/recent-cases.component"
import { ActivityChartComponent } from "./components/activity-chart/activity-chart.component"
import { CaseStatusChartComponent } from "./components/case-status-chart/case-status-chart.component"

// Assuming these components are NOT standalone and declared here
// If they ARE standalone, remove from declarations and add to imports
@NgModule({

  imports: [
    CommonModule, // Add CommonModule here
    RouterModule,
    BaseChartDirective,
    SharedModule,
    DashboardComponent,
    StatCardComponent,
    RecentCasesComponent,
    ActivityChartComponent,
    CaseStatusChartComponent,
    // If components above were standalone, add them here instead of declarations
  ],
  exports: [
    StatCardComponent
  ]
})
export class DashboardModule {}
