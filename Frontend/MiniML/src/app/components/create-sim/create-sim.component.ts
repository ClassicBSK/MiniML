import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './create-sim.component.html',
  styleUrls: ['./create-sim.component.scss']
})
export class CreateSimComponent {
  simName = '';
  errorMessage = '';

  constructor(private http: HttpClient, private router: Router) {}

  onCreateSim(): void {
    // console.log('Attempting login with:', this.username, this.password);

    const payload = {
      simName: this.simName
    };
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

  this.http.post(`${environment.apiUrl}Simulation`, payload,{headers}).subscribe({
  next: (res) => {
    // console.log('Success:', res);
    // localStorage.setItem('token', );
    this.router.navigate(['/dashboard']);
  },
  error: (err: HttpErrorResponse) => {
    if(err.status==401){
      this.router.navigate(["/login"])
    }
    console.log('Error:', err);
    this.errorMessage = 'Login failed. Please try again.';
  }
});
  }
}
