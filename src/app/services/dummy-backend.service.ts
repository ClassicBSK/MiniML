import { Injectable } from '@angular/core';
import { Observable, of, interval } from 'rxjs';
import { map, delay } from 'rxjs/operators'; // Import 'delay' for simulation
import { HttpClient } from '@angular/common/http'; // Import HttpClient

@Injectable({
  providedIn: 'root'
})
export class DummyBackendService {

  // Inject HttpClient
  constructor(private http: HttpClient) {}

  uploadDataset(file: File): Observable<any> {
    // In a real application, you would create a FormData object to send the file
    // along with any other data.
    const formData = new FormData();
    formData.append('file', file, file.name);

    // Define the dummy metadata that the "backend" would return
    const dummyMetadata = {
      fileName: file.name,
      records: 1250,
      columns: 42,
      passRate: '95%',
      dateRange: {
        start: '2023-01-01',
        end: '2023-06-30'
      }
    };

    // Simulate an HTTP POST request.
    // In a real scenario, you would uncomment the line below and provide your backend API endpoint.
    // For now, we're simulating the response with 'of()' and a delay.
    // return this.http.post<any>('/api/upload-dataset', formData); // Example of a real HTTP POST

    // Simulate the backend response with a delay to mimic network latency
    return of(dummyMetadata).pipe(delay(1000)); // Simulate 1 second network delay
  }

  getDateRangeSummary(): Observable<any> {
    return of({
      training: { start: '2022-01-01', end: '2022-06-01', samples: 500 },
      testing: { start: '2022-06-02', end: '2022-07-01', samples: 200 },
      simulation: { start: '2022-07-02', end: '2022-08-01', samples: 100 }
    });
  }

  trainModel(): Observable<any> {
    return of({
      accuracy: [60, 70, 75, 80, 85, 88],
      loss: [0.9, 0.6, 0.4, 0.3, 0.2, 0.15],
      confusionMatrix: {
        TP: 80,
        TN: 70,
        FP: 15,
        FN: 10
      }
    });
  }

  getLiveSimulationData(): Observable<any> {
    return interval(1000).pipe(
      map(i => ({
        time: new Date().toLocaleTimeString(),
        quality: Math.floor(Math.random() * 100),
        status: Math.random() > 0.2 ? 'pass' : 'fail'
      }))
    );
  }
}
