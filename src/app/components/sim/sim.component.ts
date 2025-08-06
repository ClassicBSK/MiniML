import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { Router } from '@angular/router'; 

interface SimulationRow {
  timestamp: string;
  sampleId: string;
  prediction: 'Pass' | 'Fail';
  confidence: number;
  qualityScore: number;
  temp: number;
  pressure: number;
  humidity: number;
}

@Component({
  selector: 'app-sim',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './sim.component.html',
  styleUrls: ['./sim.component.scss']
})
export class SimComponent implements OnDestroy {
  simulationRunning = false;
  simulationCompleted = false;

  simulationData: SimulationRow[] = [];
  stats = { total: 0, pass: 0, fail: 0, avgConfidence: 0 };

  // Line chart (Quality Score over time)
  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Quality Score',
        data: [],
        borderColor: '#007bff',
        backgroundColor: 'rgba(0,123,255,0.1)',
        fill: true,
        tension: 0.3
      }
    ]
  };
  lineChartOptions: ChartConfiguration<'line'>['options'] = { responsive: true };

  // Donut chart (Pass/Fail breakdown)
  donutChartData = {
    labels: ['Pass', 'Fail'],
    datasets: [{ data: [0, 0], backgroundColor: ['#28a745', '#dc3545'] }]
  };

  private eventSource: EventSource | null = null;
  private lastMessageTime = Date.now();
  private timeoutCheck: any;

  constructor(private http: HttpClient, private router: Router) {}

  startSimulation(): void {
    this.resetSimulationState();
    this.simulationRunning = true;

    this.http.post('http://127.0.0.1:8000/api/start-simulation', {}).subscribe({
      next: () => {
        this.connectToStream();
      },
      error: (err) => {
        console.error('Failed to start simulation:', err);
        this.simulationRunning = false;
      }
    });
  }
  // takes to dashboard--------------------------------
  goHome(): void {
  // Stop stream if running
  if (this.eventSource) {
    this.eventSource.close();
    this.eventSource = null;
  }
  if (this.timeoutCheck) {
    clearInterval(this.timeoutCheck);
  }

  this.simulationRunning = false;
  this.router.navigate(['/dashboard']);
}

  private connectToStream(): void {
    this.eventSource = new EventSource('http://127.0.0.1:8000/api/simulation-stream');
    this.lastMessageTime = Date.now();

    this.eventSource.onmessage = (event) => {
      const row: SimulationRow = JSON.parse(event.data);
      this.lastMessageTime = Date.now();

      // Push to table
      this.simulationData.push(row);

      // Update stats
      this.stats.total++;
      if (row.prediction === 'Pass') {
        this.stats.pass++;
      } else {
        this.stats.fail++;
      }
      this.stats.avgConfidence =
        ((this.stats.avgConfidence * (this.stats.total - 1)) + row.confidence) / this.stats.total;

      // Update line chart (immutable update)
      this.lineChartData = {
        ...this.lineChartData,
        labels: [...(this.lineChartData.labels ?? []), row.timestamp],
        datasets: [
          {
            ...this.lineChartData.datasets[0],
            data: [...(this.lineChartData.datasets[0].data as number[]), row.qualityScore]
          }
        ]
      };

      // Update donut chart (immutable update)
      this.donutChartData = {
        ...this.donutChartData,
        datasets: [
          {
            ...this.donutChartData.datasets[0],
            data: [this.stats.pass, this.stats.fail]
          }
        ]
      };
    };

    this.eventSource.onerror = () => {
      console.warn('Stream closed by backend');
      this.endSimulation();
    };

    // Check if stream is dead (no messages for 5s)
    this.timeoutCheck = setInterval(() => {
      if (this.simulationRunning && Date.now() - this.lastMessageTime > 5000) {
        console.log('No data for 5s → ending simulation');
        this.endSimulation();
      }
    }, 2000);
  }

  private endSimulation(): void {
    this.simulationRunning = false;
    this.simulationCompleted = true;

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.timeoutCheck) {
      clearInterval(this.timeoutCheck);
    }
  }

  private resetSimulationState(): void {
    this.simulationData = [];
    this.stats = { total: 0, pass: 0, fail: 0, avgConfidence: 0 };

    this.lineChartData = {
      labels: [],
      datasets: [
        {
          label: 'Quality Score',
          data: [],
          borderColor: '#007bff',
          backgroundColor: 'rgba(0,123,255,0.1)',
          fill: true,
          tension: 0.3
        }
      ]
    };

    this.donutChartData = {
      labels: ['Pass', 'Fail'],
      datasets: [{ data: [0, 0], backgroundColor: ['#28a745', '#dc3545'] }]
    };

    this.simulationCompleted = false;
    this.simulationRunning = false;
  }

  ngOnDestroy(): void {
    if (this.eventSource) {
      this.eventSource.close();
    }
    if (this.timeoutCheck) {
      clearInterval(this.timeoutCheck);
    }
  }
}
