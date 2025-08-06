import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NgChartsModule } from 'ng2-charts';
import { Router } from '@angular/router';
import { ChartOptions, ChartData } from 'chart.js';

interface TrainingMetricsResponse {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  trainingLoss: number[];
  trainingAccuracy: number[];
  confusionMatrix: {
    tp: number;
    tn: number;
    fp: number;
    fn: number;
  };
}

@Component({
  selector: 'app-train',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './train.component.html',
  styleUrls: ['./train.component.scss']
})
export class TrainComponent {
  trainingInProgress = false;
  modelTrained = false;

  metrics = {
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1: 0
  };

  // --- Training Metrics Line Chart ---
  trainingChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        label: 'Training Accuracy',
        data: [],
        borderColor: '#28a745', // green
        backgroundColor: 'rgba(40,167,69,0.1)',
        yAxisID: 'y',
        fill: false,
        tension: 0.3
      },
      {
        label: 'Training Loss',
        data: [],
        borderColor: '#dc3545', // red
        backgroundColor: 'rgba(220,53,69,0.1)',
        yAxisID: 'y1',
        fill: false,
        tension: 0.3
      }
    ]
  };

  trainingChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top' },
      title: { display: false }
    },
    scales: {
      y: {
        type: 'linear',
        position: 'left',
        min: 0,
        max: 1,
        title: { display: true, text: 'Accuracy' }
      },
      y1: {
        type: 'linear',
        position: 'right',
        min: 0,
        max: 1.2,
        title: { display: true, text: 'Loss' },
        grid: { drawOnChartArea: false }
      }
    }
  };

  // --- Confusion Matrix Doughnut Chart ---
  confusionMatrixData: ChartData<'doughnut'> = {
    labels: ['True Positive', 'True Negative', 'False Positive', 'False Negative'],
    datasets: [
      {
        data: [0, 0, 0, 0],
        backgroundColor: ['#28a745', '#007bff', '#ffc107', '#dc3545'],
        hoverOffset: 10
      }
    ]
  };

  confusionMatrixOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: { position: 'right' },
      title: { display: false }
    }
  };

  constructor(private http: HttpClient, private router: Router) {}

  trainModel(): void {
    this.trainingInProgress = true;
    this.modelTrained = false;

    const dateRangesStr = localStorage.getItem('dateRanges');
    if (!dateRangesStr) {
      console.error('No date ranges found in local storage.');
      this.trainingInProgress = false;
      return;
    }
    const dateRanges = JSON.parse(dateRangesStr);

    const payload = {
      trainStart: dateRanges.trainStart,
      trainEnd: dateRanges.trainEnd,
      testStart: dateRanges.testStart,
      testEnd: dateRanges.testEnd
    };

    this.http.post<TrainingMetricsResponse>('http://127.0.0.1:8000/api/train-model', payload).subscribe({
      next: (res) => {
        this.metrics = {
          accuracy: res.accuracy,
          precision: res.precision,
          recall: res.recall,
          f1: res.f1
        };

        this.trainingChartData.labels = res.trainingLoss.map((_, i) => `${i + 1}`);
        this.trainingChartData.datasets[0].data = res.trainingAccuracy;
        this.trainingChartData.datasets[1].data = res.trainingLoss;

        this.confusionMatrixData.datasets[0].data = [
          res.confusionMatrix.tp,
          res.confusionMatrix.tn,
          res.confusionMatrix.fp,
          res.confusionMatrix.fn
        ];

        this.modelTrained = true;
        this.trainingInProgress = false;
      },
      error: (err) => {
        console.error('Training failed:', err);
        this.trainingInProgress = false;
        this.modelTrained = false;
      }
    });
  }

  goToNext(): void {
    this.router.navigate(['/sim']);
  }
}
