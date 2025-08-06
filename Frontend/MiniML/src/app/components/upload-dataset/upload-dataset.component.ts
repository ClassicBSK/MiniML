import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environment';

interface UploadResponse {
  filename: string;
  recordsCount: number;
  columnCount: number;
  passRate: number;
  startDate:string;
  endDate:string;
}

@Component({
  selector: 'app-upload-dataset',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload-dataset.component.html',
  styleUrls: ['./upload-dataset.component.scss']
})
export class UploadDatasetComponent {
  simId!: number;
  selectedFile: File | null = null;
  uploading: boolean = false;
  metadata: UploadResponse | null = null;
  fileLink: string = '';
  errorMessage: string = '';

  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam !== null) {
      this.simId = Number(idParam);  // convert string to number
      // console.log('User ID:', this.simId);
    } else {
      console.error('User ID not found in route');
      this.errorMessage = 'User ID missing in route';
    }
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    this.http.get<UploadResponse>(`${environment.apiUrl}CSV/csvfile/${this.simId}`, { headers }).subscribe({
      next: (res) => {
        // console.log(res)
        this.metadata = res;
        

        // ✅ Store date range for future components
        localStorage.setItem('datasetStart', res.startDate);
        localStorage.setItem('datasetEnd', res.endDate);

        this.uploading = false;
      },
      error: (err: HttpErrorResponse) => {
        if(err.status==401){
          this.router.navigate(["/dashboard"])
        }
        this.errorMessage = err.error?.message || 'File upload failed.';
        this.uploading = false;
      }

    }) 
  }
  // Drag & drop handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files.length) {
      const file = event.dataTransfer.files[0];
      this.handleFile(file);
    }
  }

  // File select handler
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      this.handleFile(file);
    }
  }

  private handleFile(file: File): void {
    if (!file.name.endsWith('.csv')) {
      this.errorMessage = 'Only CSV files are allowed.';
      return;
    }

    this.errorMessage = '';
    this.selectedFile = file;
    this.uploadFile();
  }

private uploadFile(): void {
  if (!this.selectedFile) return;

  this.uploading = true;
  const formData = new FormData();
  formData.append('file', this.selectedFile);
  const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  this.http.post<UploadResponse>(`${environment.apiUrl}CSV/csvfile/${this.simId}`, formData, { headers }).subscribe({
    next: (res) => {
      // console.log(res)
      this.metadata = res;
      this.fileLink = URL.createObjectURL(this.selectedFile!);

      // ✅ Store date range for future components
      localStorage.setItem('datasetStart', res.startDate);
      localStorage.setItem('datasetEnd', res.endDate);

      this.uploading = false;
    },
    error: (err: HttpErrorResponse) => {
      this.errorMessage = err.error?.message || 'File upload failed.';
      this.uploading = false;
    }
  });
}
  // Proceed to the next step
  goToNext(): void {
    if (this.metadata) {
      this.router.navigate(['/data-range',this.simId]);
  }
}
}
