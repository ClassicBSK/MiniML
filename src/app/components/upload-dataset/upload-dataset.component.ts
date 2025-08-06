import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

interface UploadResponse {
  filename: string;
  totalRecords: number;
  totalColumns: number;
  passRate: number;
  dateRange: {
    start: string;
    end: string;
  };
}

@Component({
  selector: 'app-upload-dataset',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload-dataset.component.html',
  styleUrls: ['./upload-dataset.component.scss']
})
export class UploadDatasetComponent {
  selectedFile: File | null = null;
  uploading: boolean = false;
  metadata: UploadResponse | null = null;
  fileLink: string = '';
  errorMessage: string = '';

  constructor(private http: HttpClient, private router: Router) {}

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

  this.http.post<UploadResponse>('http://127.0.0.1:8000/api/dataset/upload', formData).subscribe({
    next: (res) => {
      this.metadata = res;
      this.fileLink = URL.createObjectURL(this.selectedFile!);

      // ✅ Store date range for future components
      localStorage.setItem('datasetStart', res.dateRange.start);
      localStorage.setItem('datasetEnd', res.dateRange.end);

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
      this.router.navigate(['/data-range']);
  }
}
}
