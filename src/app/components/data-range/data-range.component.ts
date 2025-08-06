import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NgChartsModule } from 'ng2-charts';
import { Router } from '@angular/router';
import { ChartOptions, ChartData } from 'chart.js';

@Component({
  selector: 'app-data-range',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './data-range.component.html',
  styleUrls: ['./data-range.component.scss']
})
export class DateRangesComponent {
  constructor(private http: HttpClient, private router: Router) {}

  datasetRange = {
    start: new Date(localStorage.getItem('datasetStart') || '2021-01-01'),
    end: new Date(localStorage.getItem('datasetEnd') || '2021-12-31')
  };

  trainingStart = '';
  trainingEnd = '';
  testingStart = '';
  testingEnd = '';
  simulationStart = '';
  simulationEnd = '';

  validationMessage = '';
  validationSuccess = false;

  summary = {
    training: '',
    testing: '',
    simulation: ''
  };

  barChartLabels = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  barChartData: ChartData<'bar'> = {
    labels: this.barChartLabels,
    datasets: [{
      label: 'Volume',
      data: Array(12).fill(0),
      backgroundColor: Array(12).fill('#cccccc')
    }]
  };

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Selected Date Ranges Summary'
      }
    },
    scales: {
      x: { title: { display: true, text: 'Timeline (Year)' } },
      y: { title: { display: true, text: 'Volume' }, beginAtZero: true }
    }
  };

  private getColorMap(): string[] {
    const getMonthIndices = (start: string, end: string): number[] => {
      const startMonth = new Date(start).getMonth();
      const endMonth = new Date(end).getMonth();
      return Array.from(
        { length: endMonth - startMonth + 1 },
        (_, i) => startMonth + i
      );
    };

    const trainingMonths = getMonthIndices(this.trainingStart, this.trainingEnd);
    const testingMonths = getMonthIndices(this.testingStart, this.testingEnd);
    const simulationMonths = getMonthIndices(this.simulationStart, this.simulationEnd);

    return this.barChartLabels.map((_, i) => {
      if (trainingMonths.includes(i)) return '#28a745'; // green
      if (testingMonths.includes(i)) return '#fd7e14'; // orange
      if (simulationMonths.includes(i)) return '#007bff'; // blue
      return '#cccccc'; // gray
    });
  }

  onValidateRanges(): void {
    const tStart = new Date(this.trainingStart);
    const tEnd = new Date(this.trainingEnd);
    const testStart = new Date(this.testingStart);
    const testEnd = new Date(this.testingEnd);
    const simStart = new Date(this.simulationStart);
    const simEnd = new Date(this.simulationEnd);
    const dsStart = new Date(this.datasetRange.start);
    const dsEnd = new Date(this.datasetRange.end);

    // Validation checks
    if (![tStart, tEnd, testStart, testEnd, simStart, simEnd].every(
      d => d instanceof Date && !isNaN(d.getTime()))
    ) {
      this.validationMessage = 'Please fill in all date fields.';
      this.validationSuccess = false;
      return;
    }

    if (![tStart, tEnd, testStart, testEnd, simStart, simEnd].every(
      d => d >= dsStart && d <= dsEnd)
    ) {
      this.validationMessage = 'One or more dates are outside the dataset range.';
      this.validationSuccess = false;
      return;
    }

    if (!(tStart <= tEnd)) {
      this.validationMessage = 'Training start date must be before end date.';
      this.validationSuccess = false;
      return;
    }
    if (!(tEnd < testStart)) {
      this.validationMessage = 'Training must end before Testing starts.';
      this.validationSuccess = false;
      return;
    }
    if (!(testStart <= testEnd)) {
      this.validationMessage = 'Testing start date must be before end date.';
      this.validationSuccess = false;
      return;
    }
    if (!(testEnd < simStart)) {
      this.validationMessage = 'Testing must end before Simulation starts.';
      this.validationSuccess = false;
      return;
    }
    if (!(simStart <= simEnd)) {
      this.validationMessage = 'Simulation start date must be before end date.';
      this.validationSuccess = false;
      return;
    }

    // Send to backend
    this.http.post<any>('http://127.0.0.1:8000/api/validate-date-ranges', {
      trainStart: tStart.toISOString(),
      trainEnd: tEnd.toISOString(),
      testStart: testStart.toISOString(),
      testEnd: testEnd.toISOString(),
      simStart: simStart.toISOString(),
      simEnd: simEnd.toISOString()
    }).subscribe({
      next: (res) => {
        this.validationSuccess = true;
        this.validationMessage = '✔ Date ranges validated successfully!';
        this.summary.training = `${res.training.duration} days (${res.training.start} - ${res.training.end})`;
        this.summary.testing = `${res.testing.duration} days (${res.testing.start} - ${res.testing.end})`;
        this.summary.simulation = `${res.simulation.duration} days (${res.simulation.start} - ${res.simulation.end})`;

        // Update chart in one go
        this.barChartData = {
          labels: this.barChartLabels,
          datasets: [{
            label: 'Volume',
            data: res.monthlyVolume || Array(12).fill(0),
            backgroundColor: this.getColorMap()
          }]
        };

        // Save validated dates
        localStorage.setItem('dateRanges', JSON.stringify({
          trainStart: tStart.toISOString(),
          trainEnd: tEnd.toISOString(),
          testStart: testStart.toISOString(),
          testEnd: testEnd.toISOString(),
          simStart: simStart.toISOString(),
          simEnd: simEnd.toISOString()
        }));
      },
      error: () => {
        this.validationSuccess = false;
        this.validationMessage = 'Backend validation failed.';
      }
    });
  }

  goToNext(): void {
    if (this.validationSuccess) {
      this.router.navigate(['/train']);
    }
  }
}
