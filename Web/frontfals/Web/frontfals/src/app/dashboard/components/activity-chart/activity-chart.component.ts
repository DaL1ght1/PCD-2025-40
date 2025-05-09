import { Component, OnInit } from "@angular/core";
import { ChartConfiguration } from "chart.js";

import {BaseChartDirective} from 'ng2-charts';

@Component({
  selector: "app-activity-chart",
  templateUrl: "./activity-chart.component.html",
  styleUrls: ["./activity-chart.component.scss"],
  imports: [
    BaseChartDirective

  ],
  standalone: true
})
export class ActivityChartComponent implements OnInit {
  public chartData: ChartConfiguration["data"] = {
    datasets: [
      {
        data: [65, 59, 80, 81, 56, 55, 40],
        label: "Cases",
        backgroundColor: "rgba(63, 81, 181, 0.2)",
        borderColor: "rgba(63, 81, 181, 1)",
        pointBackgroundColor: "rgba(63, 81, 181, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(63, 81, 181, 1)",
        fill: "origin",
      },
      {
        data: [28, 48, 40, 19, 86, 27, 90],
        label: "Analyses",
        backgroundColor: "rgba(33, 150, 243, 0.2)",
        borderColor: "rgba(33, 150, 243, 1)",
        pointBackgroundColor: "rgba(33, 150, 243, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(33, 150, 243, 1)",
        fill: "origin",
      },
    ],
    labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  };

  public chartOptions: ChartConfiguration["options"] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: {
        tension: 0.4,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
    },
  };

  constructor() {}

  ngOnInit(): void {
    // You could load real data here from a service
  }
}
