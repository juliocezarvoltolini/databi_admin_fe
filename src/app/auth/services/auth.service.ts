import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';
import { BrowserStorageService } from '../../core/services/storage.service';
import { Usuario } from '../../models/usuario/usuario';

interface AuthResponse {
  token: string;
  tokenType: string;
  usuario: Usuario;
}

interface TokenPayload {
  id: string;
  email: string;
  iat: number;
  exp: number;
}

interface LoginResult {
  success: boolean;
  message?: string;
  user?: Usuario;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private storageService = inject(BrowserStorageService);
  private http = inject(HttpClient);

  // Inicializa os signals com valores padrão
  private isLoggedIn = signal<boolean>(false);
  private currentUser = signal<Usuario | null>(null);
  private tokenExpirationTimer: any = null;

  constructor() {
    // Verifica o token após a injeção de dependências estar completa
    this.isLoggedIn.set(this.hasValidToken());
  }

  login(email: string, password: string): Observable<LoginResult> {
    return this.http
      .post<AuthResponse>('http://127.0.0.1:3000/auth/signin', {
        login: email,
        senha: password,
      })
      .pipe(
        map((response) => {
          this.setSession(response);
          return {
            success: true,
            user: response.usuario,
          };
        }),
        catchError((err) => {
          const message = this.getErrorMessage(err);
          return of({ success: false, message });
        })
      );
  }

  private setSession(authResult: AuthResponse): void {
    this.storageService.set('token', authResult.token);
    const payload = this.decodeToken(authResult.token);
   // Define expiração padrão de 1 hora se não estiver presente

    this.isLoggedIn.set(true);
    this.currentUser.set(authResult.usuario);
    this.setAutoLogout(payload.exp * 1000);
  }

  private clearSession(): void {
    this.storageService.remove('token');

    this.isLoggedIn.set(false);
    this.currentUser.set(null);

    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }
  }

  private setAutoLogout(expiresIn: number): void {
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expiresIn);
  }

  logout(): UrlTree {
    this.storageService.remove('token');

    this.isLoggedIn.set(false);
    this.currentUser.set(null);

    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }

    return this.router.createUrlTree(['/login']);
  }

  private hasValidToken(): boolean {
    const token = this.storageService.get('token');
    if (!token) return false;

    // Verifica expiração armazenada

    // Verifica expiração no token
    try {
      const payload = this.decodeToken(token);
      console.log('expiration', payload.exp, 'current', Date.now()/1000);
      if (Date.now() / 1000 >= payload.exp) {
        this.logout();
        return false;
      }
    } catch {
      return false;
    }

    this.http.get<Usuario>(`http://localhost:3000/auth/me`, {headers: { Authorization: `Bearer ${token}` } })
    .subscribe({
      next: (user) => {
        this.isLoggedIn.set(true);
        this.currentUser.set(user);
      },
      error: (err) => {
        this.clearSession();
      }
    })

    // Recupera usuário do storage

    return true;
  }

  private decodeToken(token: string): TokenPayload {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }



  isLoggedIn$() {
    return this.isLoggedIn.asReadonly();
  }

  getCurrentUser() {
    return this.currentUser.asReadonly();
  }

  getToken(): string | null {
    return this.storageService.get('token');
  }

  private getErrorMessage(err: any): string {
    if (err?.error?.message) return err.error.message;
    if (typeof err.error === 'string') return err.error;
    return 'Erro desconhecido';
  }
}
