// dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';
import { Chart } from 'chart.js/auto';
import { forkJoin } from 'rxjs';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  standalone: true,
  imports: [
    NgIf
  ],
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  userRoleData: any = {};
  roleDistributionChart: any;
  roleActivityChart: any;
  roleComparisonChart: any;
  casesByRoleChart: any;
  loading = true;
  selectedTimeframe = 'month';
  roleColors = {
    admin: '#4e73df',
    expert: '#1cc88a',
    investigator: '#f6c23e',
    lawyer: '#e74a3b',
    judge: '#36b9cc'
  };

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;

    // Fetch all the data needed for dashboard
    forkJoin({
      roleDistribution: this.adminService.getRoleDistribution(),
      roleActivity: this.adminService.getRoleActivity(this.selectedTimeframe),
      casesByRole: this.adminService.getCasesByRole(),
      roleEfficiency: this.adminService.getRoleEfficiency()
    }).subscribe(
      result => {
        this.userRoleData = result;
        this.initializeCharts();
        this.loading = false;
      },
      error => {
        console.error('Error fetching dashboard data:', error);
        this.loading = false;
      }
    );
  }

  changeTimeframe(timeframe: string): void {
    this.selectedTimeframe = timeframe;
    this.loadDashboardData();
  }

  initializeCharts(): void {
    this.initRoleDistributionChart();
    this.initRoleActivityChart();
    this.initRoleComparisonChart();
    this.initCasesByRoleChart();
  }

  initRoleDistributionChart(): void {
    const ctx = document.getElementById('roleDistributionChart') as HTMLCanvasElement;
    if (this.roleDistributionChart) {
      this.roleDistributionChart.destroy();
    }

    const { labels, counts, colors } = this.processRoleDistributionData();

    this.roleDistributionChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: counts,
          backgroundColor: colors,
          hoverBackgroundColor: colors,
          hoverBorderColor: "rgba(234, 236, 244, 1)",
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
          },
          tooltip: {
            backgroundColor: "rgb(255,255,255)",
            bodyColor: "#858796",
            borderColor: '#dddfeb',
            borderWidth: 1,
            padding: 15,
            displayColors: false,
            caretPadding: 10,
          }
        },
        cutout: '70%'
      }
    });
  }

  initRoleActivityChart(): void {
    const ctx = document.getElementById('roleActivityChart') as HTMLCanvasElement;
    if (this.roleActivityChart) {
      this.roleActivityChart.destroy();
    }

    const { labels, datasets } = this.processRoleActivityData();

    this.roleActivityChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(0, 0, 0, 0.05)"
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        }
      }
    });
  }

  initRoleComparisonChart(): void {
    const ctx = document.getElementById('roleComparisonChart') as HTMLCanvasElement;
    if (this.roleComparisonChart) {
      this.roleComparisonChart.destroy();
    }

    const { labels, data } = this.processRoleEfficiencyData();

    this.roleComparisonChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Efficiency Score',
          data: data,
          backgroundColor: "rgba(78, 115, 223, 0.2)",
          borderColor: "rgba(78, 115, 223, 1)",
          pointBackgroundColor: "rgba(78, 115, 223, 1)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgba(78, 115, 223, 1)"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 20
            }
          }
        }
      }
    });
  }

  initCasesByRoleChart(): void {
    const ctx = document.getElementById('casesByRoleChart') as HTMLCanvasElement;
    if (this.casesByRoleChart) {
      this.casesByRoleChart.destroy();
    }

    const { labels, data, colors } = this.processCasesByRoleData();

    this.casesByRoleChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Cases Handled',
          data: data,
          backgroundColor: colors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(0, 0, 0, 0.05)"
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  processRoleDistributionData() {
    const data = this.userRoleData.roleDistribution;
    const labels = Object.keys(data);
    const counts = Object.values(data);
    const colors = labels.map(role => this.roleColors[role] || '#' + Math.floor(Math.random()*16777215).toString(16));

    return { labels, counts, colors };
  }

  processRoleActivityData() {
    const data = this.userRoleData.roleActivity;
    const labels = data.timeLabels;

    const datasets = Object.keys(data.activities).map(role => {
      return {
        label: role.charAt(0).toUpperCase() + role.slice(1),
        data: data.activities[role],
        borderColor: this.roleColors[role] || '#' + Math.floor(Math.random()*16777215).toString(16),
        backgroundColor: 'transparent',
        pointBackgroundColor: this.roleColors[role] || '#' + Math.floor(Math.random()*16777215).toString(16),
        tension: 0.3
      };
    });

    return { labels, datasets };
  }

  processRoleEfficiencyData() {
    const data = this.userRoleData.roleEfficiency;
    const labels = Object.keys(data);
    const dataValues = Object.values(data);

    return { labels, data: dataValues };
  }

  processCasesByRoleData() {
    const data = this.userRoleData.casesByRole;
    const labels = Object.keys(data);
    const counts = Object.values(data);
    const colors = labels.map(role => this.roleColors[role] || '#' + Math.floor(Math.random()*16777215).toString(16));

    return { labels, data: counts, colors };
  }
}
