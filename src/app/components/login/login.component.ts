import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

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
    console.log('Attempting login with:', this.username, this.password);

    const payload = {
      username: this.username,
      password: this.password
    };

    this.http.post<{ token: string }>('http://127.0.0.1:8000/api/auth/login', payload).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        this.router.navigate(['/dashboard']); // Navigate after successful login
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 401 || err.status === 400) {
          this.errorMessage = 'Invalid credentials';
        } else {
          this.errorMessage = 'Login failed. Please try again.';
        }
      }
    });
  }
}
