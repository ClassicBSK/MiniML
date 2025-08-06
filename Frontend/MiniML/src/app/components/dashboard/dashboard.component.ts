import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { environment } from '../../../environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  dropdownOpen = false;
  username = 'user123';
  

  simulations = [
    { simId: 1, simName: 'Simulation 1', status: 'Completed' }
  ];

  constructor(private router: Router, private http: HttpClient) {}
  ngOnInit(): void {
    this.fetchSimulations(); // API call when page loads or refreshes
  }

  fetchSimulations(): void {
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    this.http.get<any[]>(`${environment.apiUrl}Simulation/simulations`, { headers })  // Replace with your API
      .subscribe({
        next: (data) => {
          this.simulations = data;
          // console.log('Fetched simulations:', data);
        },
        error: (err:HttpErrorResponse) => {
          if(err.status==401){
            this.router.navigate(["/login"])
          }
          console.error('Error loading simulations', err);
        }
      });
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  logout(): void {
    this.router.navigate(['/login']);
  }

  createSimulation(): void {
    // Go to Upload Dataset page to start a new simulation
    this.router.navigate(['/create-sim']);
  }

  goToSimulation(id: number): void {
    // Pass simulation id in query params for backend to reuse
    this.router.navigate(['/upload',id] );
  }
}
