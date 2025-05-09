import { Component, OnInit } from "@angular/core";
import { ChartConfiguration } from "chart.js";

import {BaseChartDirective} from 'ng2-charts';

@Component({
  selector: "app-case-status-chart",
  templateUrl: "./case-status-chart.component.html",
  styleUrls: ["./case-status-chart.component.scss"],
  imports: [
    BaseChartDirective

  ],
  standalone: true
})
export class CaseStatusChartComponent implements OnInit {
  public chartData: ChartConfiguration["data"] = {
    datasets: [
      {
        data: [25, 40, 30, 5],
        backgroundColor: [
          "rgba(255, 152, 0, 0.7)", // Pending - Orange
          "rgba(33, 150, 243, 0.7)", // In Progress - Blue
          "rgba(76, 175, 80, 0.7)", // Completed - Green
          "rgba(244, 67, 54, 0.7)", // Rejected - Red
        ],
        hoverBackgroundColor: [
          "rgba(255, 152, 0, 1)",
          "rgba(33, 150, 243, 1)",
          "rgba(76, 175, 80, 1)",
          "rgba(244, 67, 54, 1)",
        ],
      },
    ],
    labels: ["Pending", "In Progress", "Completed", "Rejected"],
  };

  public chartOptions: ChartConfiguration["options"] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "right",
      },
    },
  };

  constructor() {}

  ngOnInit(): void {

  }
}
