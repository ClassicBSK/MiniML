import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { NgChartsModule } from 'ng2-charts';
import { ActivatedRoute, Router } from '@angular/router';
import { ChartOptions, ChartData } from 'chart.js';
import { environment } from '../../../environment';

interface trainRes{
  loss:number[],
  accuracy:number[]
}
interface TrainingMetricsResponse {
  train: trainRes;
  tp: number;
  tn: number;
  fp: number;
  fn: number;
  
}

@Component({
  selector: 'app-train',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './train.component.html',
  styleUrls: ['./train.component.scss']
})
export class TrainComponent {
  simId!:number;
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

  constructor(private http: HttpClient, private router: Router,private route: ActivatedRoute) {}
  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam !== null) {
      this.simId = Number(idParam);  // convert string to number
      // console.log('User ID:', this.simId);
    } else {
      console.error('User ID not found in route');
    }
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    this.http.get<TrainingMetricsResponse>(`${environment.apiUrl}ML/model/${this.simId}`,{headers}).subscribe({
      next: (res) => {
        // console.log(res)
        var accuracy=(res.tp+res.tn)/(res.tp+res.tn+res.fn+res.fp)
        if((res.tp+res.fp)!=0){
          var precision=(res.tp)/(res.tp+res.fp);
        }else{
          var precision=0;
        }
        if((res.tp+res.fn)!=0){
          var recall=(res.tp)/(res.tp+res.fn);
        }else{
          var recall=0;
        }
        if((precision+recall)!=0){
          var f1=2*(precision*recall)/(precision+recall)
        }else{
          var f1=0
        }
        this.metrics = {
          accuracy: this.truncateToTwoDecimals(accuracy),
          precision: this.truncateToTwoDecimals(precision),
          recall: this.truncateToTwoDecimals(recall),
          f1: this.truncateToTwoDecimals(f1)
        };
        this.confusionMatrixData.datasets[0].data = [
          res.tp,
          res.tn,
          res.fp,
          res.fn
        ];

        this.modelTrained = true;
        this.trainingInProgress = false;
      },
      error: (err:HttpErrorResponse) => {
        if(err.status==401){
          this.router.navigate(["/dashboard"])
        }
        console.error('Training failed:', err);
        this.trainingInProgress = false;
        this.modelTrained = false;
      }
    });
  }
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
      trainStart: this.parseLocalDateTimeString(dateRanges.trainStart),
      trainEnd: this.parseLocalDateTimeString(dateRanges.trainEnd),
      testStart: this.parseLocalDateTimeString(dateRanges.testStart),
      testEnd: this.parseLocalDateTimeString(dateRanges.testEnd),
      validStart:this.parseLocalDateTimeString(dateRanges.validStart),
      validEnd:this.parseLocalDateTimeString(dateRanges.validEnd)
    };
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    // console.log(payload)
    this.http.post<TrainingMetricsResponse>(`${environment.apiUrl}ML/train/${this.simId}`, payload,{headers}).subscribe({
      next: (res) => {
        // console.log(res)
        var accuracy=(res.tp+res.tn)/(res.tp+res.tn+res.fn+res.fp)
        if((res.tp+res.fp)!=0){
          var precision=(res.tp)/(res.tp+res.fp);
        }else{
          var precision=0;
        }
        if((res.tp+res.fn)!=0){
          var recall=(res.tp)/(res.tp+res.fn);
        }else{
          var recall=0;
        }
        if((precision+recall)!=0){
          var f1=2*(precision*recall)/(precision+recall)
        }else{
          var f1=0
        }
        this.metrics = {
          accuracy: this.truncateToTwoDecimals(accuracy),
          precision: this.truncateToTwoDecimals(precision),
          recall: this.truncateToTwoDecimals(recall),
          f1: this.truncateToTwoDecimals(f1)
        };

        this.trainingChartData.labels = res.train.loss.map((_, i) => `${i + 1}`);
        this.trainingChartData.datasets[0].data = res.train.accuracy;
        this.trainingChartData.datasets[1].data = res.train.loss;

        this.confusionMatrixData.datasets[0].data = [
          res.tp,
          res.tn,
          res.fp,
          res.fn
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
  truncateToTwoDecimals(num: number): number {
    return Math.trunc(num * 100) / 100;
  }
  parseLocalDateTimeString(dateStr: string): Date {
    const parts = dateStr.split(/[- :]/); // [YYYY, MM, DD, HH, mm, ss]

    if (parts.length < 6) {
      throw new Error("Invalid date format. Expected 'YYYY-MM-DD HH:mm:ss'");
    }

    return new Date(
      Number(parts[0]),        // year
      Number(parts[1]) - 1,    // month (0-based)
      Number(parts[2]),        // day
      Number(parts[3]),        // hour
      Number(parts[4]),        // minute
      Number(parts[5])         // second
    );
  }
  goToNext(): void {
    this.router.navigate(['/sim',this.simId]);
  }
}
