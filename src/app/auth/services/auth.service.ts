import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { Observable, catchError, map, of, firstValueFrom } from 'rxjs';
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
  private http = inject(HttpClient);

  // 🎯 Centralize a URL base
  private readonly baseUrl = 'http://127.0.0.1:3000';

  // Signals para estado reativo
  private isLoggedIn = signal<boolean>(false);
  private currentUser = signal<Usuario | null>(null);
  private tokenExpirationTimer: any = null;

  constructor() {
    // ✅ Constructor limpo - inicialização via APP_INITIALIZER
  }

  /**
   * 🚀 Método para APP_INITIALIZER
   * Inicializa o estado de autenticação antes da app começar
   */
  public async initializeApp(): Promise<void> {
    console.log('🔐 Inicializando AuthService...');
    
    const token = this.getToken();
    
    if (!token) {
      console.log('❌ Nenhum token encontrado');
      return;
    }

    if (!this.isTokenValid(token)) {
      console.log('❌ Token expirado durante inicialização');
      this.clearSession();
      return;
    }

    try {
      await this.loadAuthenticatedUser(token);
      this.setupAutoLogout(token);
      console.log('✅ Usuário autenticado carregado');
    } catch (error) {
      console.error('❌ Erro ao carregar usuário:', error);
      this.clearSession();
    }
  }

  /**
   * 📥 Login do usuário
   */
  login(email: string, password: string): Observable<LoginResult> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/signin`, {
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

  /**
   * 👤 Carrega dados do usuário autenticado
   */
  private async loadAuthenticatedUser(token: string): Promise<void> {
    const user = await firstValueFrom(
      this.http.get<Usuario>(`${this.baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      }).pipe(
        catchError((err) => {
          console.error('Erro ao obter usuário:', err);
          throw err;
        })
      )
    );

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    this.isLoggedIn.set(true);
    this.currentUser.set(user);
  }

  /**
   * 💾 Configura sessão após login
   */
  private setSession(authResult: AuthResponse): void {
    // Salva token
    localStorage.setItem('token', authResult.token);
    
    // Atualiza estado
    this.isLoggedIn.set(true);
    this.currentUser.set(authResult.usuario);
    
    // Configura auto-logout
    this.setupAutoLogout(authResult.token);
    
    console.log('✅ Sessão configurada com sucesso');
  }

  /**
   * ⏰ Configura logout automático baseado na expiração do token
   */
  private setupAutoLogout(token: string): void {
    try {
      const payload = this.decodeToken(token);
      const agora = Date.now();
      const expiraEm = payload.exp * 1000;
      const tempoRestante = expiraEm - agora;

      console.log('🕐 Token expira em:', new Date(expiraEm));
      console.log('⏱️ Tempo restante:', Math.round(tempoRestante / (1000 * 60)), 'minutos');

      this.setAutoLogout(tempoRestante);
    } catch (error) {
      console.error('❌ Erro ao configurar auto-logout:', error);
      this.clearSession();
    }
  }

  /**
   * ⏲️ Agenda logout automático
   */
  private setAutoLogout(tempoRestante: number): void {
    // Limpa timer existente
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }

    // Se já expirou, faz logout imediato
    if (tempoRestante <= 0) {
      console.log('⚠️ Token já expirado, logout imediato');
      this.logoutAndRedirect();
      return;
    }

    // Agenda logout
    console.log(`⏰ Auto-logout em ${Math.round(tempoRestante / (1000 * 60))} minutos`);
    this.tokenExpirationTimer = setTimeout(() => {
      console.log('🔐 Token expirado - logout automático');
      this.logoutAndRedirect();
    }, tempoRestante);
  }

  /**
   * 🧹 Limpa sessão e dados locais
   */
  private clearSession(): void {
    localStorage.removeItem('token');
    this.isLoggedIn.set(false);
    this.currentUser.set(null);

    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }
  }

  /**
   * 🚪 Logout (retorna UrlTree para guards)
   */
  logout(): UrlTree {
    this.clearSession();
    return this.router.createUrlTree(['/login']);
  }

  /**
   * 🚪 Logout com redirecionamento imediato
   */
  logoutAndRedirect(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  /**
   * ✅ Verifica se token é válido (não expirado)
   */
  private isTokenValid(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      const agora = Date.now() / 1000;
      
      if (agora >= payload.exp) {
        console.log('⚠️ Token expirado:', {
          expiracao: new Date(payload.exp * 1000),
          agora: new Date()
        });
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao validar token:', error);
      return false;
    }
  }

  /**
   * 🔓 Decodifica JWT token
   */
  private decodeToken(token: string): TokenPayload {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Token JWT inválido');
    }
  }

  /**
   * 📖 Getters públicos para acesso aos dados
   */
  isLoggedIn$() {
    return this.isLoggedIn.asReadonly();
  }

  getCurrentUser() {
    return this.currentUser.asReadonly();
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * ⚠️ Tratamento centralizado de erros
   */
  private getErrorMessage(err: any): string {
    if (err?.error?.message) return err.error.message;
    if (err?.error?.errors && Array.isArray(err.error.errors)) {
      return err.error.errors.join(', ');
    }
    if (typeof err.error === 'string') return err.error;
    if (err?.message) return err.message;
    return 'Erro desconhecido no servidor';
  }
}