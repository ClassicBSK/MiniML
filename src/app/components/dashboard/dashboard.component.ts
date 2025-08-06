import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

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
    { id: 1, name: 'Simulation 1', status: 'Completed' },
    { id: 2, name: 'Simulation 2', status: 'Running' },
    { id: 3, name: 'Simulation 3', status: 'Pending' }
  ];

  constructor(private router: Router) {}

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  logout(): void {
    this.router.navigate(['/login']);
  }

  createSimulation(): void {
    // Go to Upload Dataset page to start a new simulation
    this.router.navigate(['/upload']);
  }

  goToSimulation(id: number): void {
    // Pass simulation id in query params for backend to reuse
    this.router.navigate(['/sim'], { queryParams: { simId: id } });
  }
}
