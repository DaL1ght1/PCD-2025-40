import { NgModule } from "@angular/core"
import { BaseChartDirective } from "ng2-charts"
import { Chart, registerables } from "chart.js"

// Register all Chart.js components
Chart.register(...registerables)

@NgModule({
  imports: [BaseChartDirective],
  exports: [BaseChartDirective],
})
export class ChartModule {}
