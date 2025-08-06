import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  selector: 'app-data-range',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './data-range.component.html',
  styleUrls: ['./data-range.component.scss']
})
export class DateRangesComponent {
  simId!: number;


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
        this.validationSuccess = true;
      },
      error: (err:HttpErrorResponse) => {
        if(err.status==401){
          this.router.navigate(["/dashboard"])
        }
        console.error('Training failed:', err);
      }
    });
  }
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
      legend: { display: true },
      title: {
        display: true,
        text: 'Train/Test/Validation Volume per Month'
      }
    },
    scales: {
      x: {
        stacked: true,
        title: { display: true, text: 'Timeline (Month)' }
      },
      y: {
        stacked: true,
        title: { display: true, text: 'Volume' },
        beginAtZero: true
      }
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

  mapToMonthlyArray(data: { [key: number]: number }): number[] {
    const result = Array(12).fill(0);
    for (const [month, value] of Object.entries(data)) {
      result[parseInt(month) - 1] = value;
    }
    return result;
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
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    var data={
      trainStart: tStart,
      trainEnd: tEnd,
      testStart: testStart,
      testEnd: testEnd,
      validStart: simStart,
      validEnd: simEnd
    }
    // console.log(data)
    // Send to backend
    this.http.post<any>(`${environment.apiUrl}ML/ranges/${this.simId}`,data ,{headers}).subscribe({
      next: (res) => {
        var temp=JSON.stringify({
          trainStart: this.toLocalDateTimeString(data.trainStart),
          trainEnd: this.toLocalDateTimeString(data.trainEnd),
          testStart: this.toLocalDateTimeString(data.testStart),
          testEnd: this.toLocalDateTimeString(data.testEnd),
          validStart: this.toLocalDateTimeString(data.validStart),
          validEnd: this.toLocalDateTimeString(data.validEnd)
        })
        this.validationSuccess = true;
        this.validationMessage = '✔ Date ranges validated successfully!';
        var date1 = new Date(tStart);
        var date2 = new Date(tEnd);
        const msPerDay = 1000 * 60 * 60 * 24;
        const trainingDays = Math.ceil((date2.getTime() - date1.getTime()) / msPerDay);
        this.summary.training = `training days (${trainingDays})`;
        date1 = new Date(testStart);
        date2 = new Date(testEnd);
        var testDays=Math.ceil((date2.getTime() - date1.getTime()) / msPerDay);
        this.summary.testing = `test days (${testDays})`;
        date1 = new Date(simStart);
        date2 = new Date(simEnd);
        var validDays=Math.ceil((date2.getTime() - date1.getTime()) / msPerDay);
        this.summary.simulation = `Validation days (${validDays})`;

        // Update chart in one go
        this.barChartData = {
          labels: this.barChartLabels,
          datasets: [
            {
              label: 'Train',
              data: this.mapToMonthlyArray(res.trainData),
              backgroundColor: '#28a745',
              stack: 'stack1'
            },
            {
              label: 'Test',
              data: this.mapToMonthlyArray(res.testData),
              backgroundColor: '#fd7e14',
              stack: 'stack1'
            },
            {
              label: 'Validation',
              data: this.mapToMonthlyArray(res.validData),
              backgroundColor: '#007bff',
              stack: 'stack1'
            }
          ]
        };

        // Save validated dates
        
        localStorage.setItem('dateRanges', temp);
        // console.log(temp)
      },
      error: () => {
        this.validationSuccess = false;
        this.validationMessage = 'Backend validation failed.';
      }
    });
  }
  toLocalDateTimeString(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
          `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }
  goToNext(): void {
    if (this.validationSuccess) {
      this.router.navigate(['/train',this.simId]);
    }
  }
}
