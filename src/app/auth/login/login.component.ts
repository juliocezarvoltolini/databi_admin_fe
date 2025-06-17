import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { switchMap, tap } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  loginError: string | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get senha() {
    return this.loginForm.get('senha');
  }

  logar() {
    console.log('Submit detectado'); // teste
    if (this.loginForm.valid) {
      this.isLoading = true;

      this.authService.login(this.email?.value, this.senha?.value).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (!response.success) {
            this.isLoading = false;
            this.loginError = response.message || 'Erro ao fazer login';
          } else this.router.navigate(['/'])
        },
        error: (err) => {
          this.isLoading = false;
          this.loginError = err;
        },
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
