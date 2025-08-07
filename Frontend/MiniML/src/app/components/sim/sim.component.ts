import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { NgChartsModule } from 'ng2-charts';
import { ViewChildren, QueryList } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { ActivatedRoute, Router } from '@angular/router'; 
import { environment } from '../../../environment';

interface SimulationRow {
  timestamp: string;
  prediction: number;
  confidence: number;
}


@Component({
  
  selector: 'app-sim',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './sim.component.html',
  styleUrls: ['./sim.component.scss'],
  
})
export class SimComponent implements OnDestroy {
  @ViewChildren(BaseChartDirective) charts!: QueryList<BaseChartDirective>;
  simId!:number
  simulationRunning = false;
  simulationCompleted = false;

  simulationData: SimulationRow[] = [];
  stats = { total: 0, pass: 0, fail: 0, avgConfidence: 0 };
  seenTimeStamps!:string[]
  seenQualityScores!:number[]
  selectedFile: File | null = null;
  // Line chart (Quality Score over time)
  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: this.seenTimeStamps,
    datasets: [
      {
        label: 'Quality Score',
        data: this.seenQualityScores,
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
    datasets: [
      {
        label: 'Predictions',
        data: [60, 40], // Replace with your dynamic data
        backgroundColor: ['#4CAF50', '#F44336'], // Green, Red
        hoverOffset: 10
      }
    ]
  };
  donutChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#333',
          font: {
            size: 14
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: ${value}`;
          }
        }
      }
    },
    cutout: '70%' // Makes it more like a donut than a pie
  };
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      this.handleFile(file);
    }
  }
  truncateToTwoDecimals(num: number): number {
    return Math.trunc(num * 100000) / 100000;
  }
  private handleFile(file: File): void {
    
    this.selectedFile = file;
    // this.uploadFile();
    this.startSimulation()
  }

  private eventSource: EventSource | null = null;
  private lastMessageTime = Date.now();
  private timeoutCheck: any;

  constructor(private http: HttpClient, private router: Router,private route: ActivatedRoute) {}

  async ngOnInit() {
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
    
    try{
    const response = await fetch(`${environment.apiUrl}ML/validationresult/${this.simId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "text/event-stream"
      },
    });
    if (!response.ok) {
      const errorText = await response.text();  // Try to read error body
      console.error(`Request failed with status ${response.status}: ${errorText}`);
      // Handle the error (e.g., show toast, display message to user, etc.)
      this.router.navigate(["/dashboard"])
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder("utf-8");
    if (!reader) {
      console.error("ReadableStream not supported or body is null.");
      this.router.navigate(["/dashboard"])
      return;
    }
    var i=0
    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      // console.log("Received chunk:", chunk);
      const jsonString = chunk.replace(/^data:\s*/, '');
      const sim: SimulationRow = JSON.parse(jsonString);
      this.stats.total++;
      if (sim.prediction == 1) {
        this.stats.pass++;
      } else {
        this.stats.fail++;
      }
      this.simulationData.unshift({"timestamp":sim.timestamp,"prediction":sim.prediction,"confidence":sim.confidence})
      this.stats.avgConfidence =
        ((this.stats.avgConfidence * (this.stats.total - 1)) + sim.confidence) / this.stats.total;
      this.stats.avgConfidence=this.truncateToTwoDecimals(this.stats.avgConfidence);
      if(this.seenTimeStamps==null){
        this.seenTimeStamps=[]
      }
      if(this.seenQualityScores==null){
        this.seenQualityScores=[]
      }
      this.seenTimeStamps.push(sim.timestamp)
      if(this.seenQualityScores.length==0){
        this.seenQualityScores=[]
        this.seenQualityScores.push(sim.prediction)
      }else{
        var temp=this.seenQualityScores[this.seenQualityScores.length-1]*this.seenQualityScores.length;
        temp=temp+sim.prediction;
        temp=temp/(this.seenQualityScores.length+1);
        this.seenQualityScores.push(temp)
      }
      if((i+1)%5==0){
        this.lineChartData.labels = [...this.seenTimeStamps];
        this.lineChartData.datasets[0].data = [...this.seenQualityScores];
        this.donutChartData.datasets[0].data=[this.stats.pass,this.stats.fail]
        this.charts.forEach(chart => chart.update());
      }
      i=i+1;
      if(i==24){
        await reader?.cancel();
        break;
      } 
    }
    this.lineChartData.labels = [...this.seenTimeStamps];
    this.lineChartData.datasets[0].data = [...this.seenQualityScores];
    this.donutChartData.datasets[0].data=[this.stats.pass,this.stats.fail]
    this.charts.forEach(chart => chart.update());
  }catch(err){
    this.router.navigate(["/dashboard"])
  }

  }

  sleep(ms:number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async startSimulation(): Promise<void> {
    if (!this.selectedFile) return;
    this.simulationRunning = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    }); // `yourFile` is a File object
    const response = await fetch(`${environment.apiUrl}ML/predictstream/${this.simId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "text/event-stream"
      },
      body: formData
    });
    if (!response.ok) {
      const errorText = await response.text();  // Try to read error body
      console.error(`Request failed with status ${response.status}: ${errorText}`);
      // Handle the error (e.g., show toast, display message to user, etc.)
      this.router.navigate(["/dashboard"])
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder("utf-8");
    var i=0
    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      // console.log("Received chunk:", chunk);
      const jsonString = chunk.replace(/^data:\s*/, '');
      const sim: SimulationRow = JSON.parse(jsonString);
      this.stats.total++;
      if (sim.prediction == 1) {
        this.stats.pass++;
      } else {
        this.stats.fail++;
      }
      this.simulationData.unshift({"timestamp":sim.timestamp,"prediction":sim.prediction,"confidence":sim.confidence})
      this.stats.avgConfidence =
        this.truncateToTwoDecimals(((this.stats.avgConfidence * (this.stats.total - 1)) + sim.confidence) / this.stats.total)
      if(this.seenTimeStamps==null){
        this.seenTimeStamps=[]
      }
      if(this.seenQualityScores==null){
        this.seenQualityScores=[]
      }
      this.seenTimeStamps.push(sim.timestamp)
      if(this.seenQualityScores.length==0){
        this.seenQualityScores=[]
        this.seenQualityScores.push(sim.prediction)
      }else{
        var temp=this.seenQualityScores[this.seenQualityScores.length-1]*this.seenQualityScores.length;
        temp=temp+sim.prediction;
        temp=temp/(this.seenQualityScores.length+1);
        this.seenQualityScores.push(temp)
      }
      if((i+1)%5==0){
        this.lineChartData.labels = [...this.seenTimeStamps];
        this.lineChartData.datasets[0].data = [...this.seenQualityScores];
        this.donutChartData.datasets[0].data=[this.stats.pass,this.stats.fail]
        this.charts.forEach(chart => chart.update());
      }
      i=i+1;
      if(i==24){
        await reader?.cancel();
        break;
      }
    }
    this.lineChartData.labels = [...this.seenTimeStamps];
    this.lineChartData.datasets[0].data = [...this.seenQualityScores];
    
    this.donutChartData.datasets[0].data=[this.stats.pass,this.stats.fail]
    this.charts.forEach(chart => chart.update());
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


  ngOnDestroy(): void {
    if (this.eventSource) {
      this.eventSource.close();
    }
    if (this.timeoutCheck) {
      clearInterval(this.timeoutCheck);
    }
  }
}
