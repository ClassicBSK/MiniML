import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';

  constructor(private http: HttpClient, private router: Router) {}

  onLoginSubmit(): void {
    // console.log('Attempting login with:', this.username, this.password);

    const payload = {
      username: this.username,
      password: this.password
    };

  this.http.post(`${environment.apiUrl}User/login`, payload, {
    responseType: 'text'
  }).subscribe({
  next: (res) => {
    // console.log('Success:', res);
    localStorage.setItem('token', res);
    this.router.navigate(['/dashboard']);
  },
  error: (err: HttpErrorResponse) => {
    console.log('Error:', err);
    this.errorMessage = 'Login failed. Please try again.';
  }
});
  }
}
