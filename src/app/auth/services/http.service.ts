// core/services/http.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';

export interface HttpOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | number | boolean | readonly (string | number | boolean)[] };
  withCredentials?: boolean;
  responseType?: 'json';
}

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  private readonly baseUrl = 'http://127.0.0.1:3000';

  /**
   * 🔧 Cria headers padrão com token JWT automaticamente
   */
  private createDefaultHeaders(customHeaders?: HttpHeaders | { [key: string]: string | string[] }): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    // ✅ Adicionar token JWT automaticamente
    const token = this.authService.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    // ✅ Adicionar headers customizados se fornecidos
    if (customHeaders) {
      if (customHeaders instanceof HttpHeaders) {
        // Se for HttpHeaders, iterar sobre as chaves
        customHeaders.keys().forEach(key => {
          const value = customHeaders.get(key);
          if (value) {
            headers = headers.set(key, value);
          }
        });
      } else {
        // Se for objeto, converter valores para string
        Object.keys(customHeaders).forEach(key => {
          const value = customHeaders[key];
          if (value !== undefined && value !== null) {
            // ✅ Converter array para string separada por vírgula
            const stringValue = Array.isArray(value) ? value.join(',') : String(value);
            headers = headers.set(key, stringValue);
          }
        });
      }
    }

    return headers;
  }

  /**
   * 🌐 Cria URL completa
   */
  private createUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    return `${this.baseUrl}/${cleanEndpoint}`;
  }

  /**
   * 📥 GET Request
   */
  get<T>(endpoint: string, options?: HttpOptions): Observable<T> {
    const url = this.createUrl(endpoint);
    const headers = this.createDefaultHeaders(options?.headers);
    
    console.log('🔍 HTTP GET:', url);
    
    return this.http.get<T>(url, {
      headers,
      params: options?.params,
      withCredentials: options?.withCredentials,
      responseType: options?.responseType
    });
  }

  /**
   * 📤 POST Request
   */
  post<T>(endpoint: string, body?: any, options?: HttpOptions): Observable<T> {
    const url = this.createUrl(endpoint);
    const headers = this.createDefaultHeaders(options?.headers);
    
    console.log('🔍 HTTP POST:', url);
    
    return this.http.post<T>(url, body, {
      headers,
      params: options?.params,
      withCredentials: options?.withCredentials,
      responseType: options?.responseType
    });
  }

  /**
   * 🔄 PUT Request
   */
  put<T>(endpoint: string, body?: any, options?: HttpOptions): Observable<T> {
    const url = this.createUrl(endpoint);
    const headers = this.createDefaultHeaders(options?.headers);
    
    console.log('🔍 HTTP PUT:', url);
    
    return this.http.put<T>(url, body, {
      headers,
      params: options?.params,
      withCredentials: options?.withCredentials,
      responseType: options?.responseType
    });
  }

  /**
   * 🗑️ DELETE Request
   */
  delete<T>(endpoint: string, options?: HttpOptions): Observable<T> {
    const url = this.createUrl(endpoint);
    const headers = this.createDefaultHeaders(options?.headers);
    
    console.log('🔍 HTTP DELETE:', url);
    
    return this.http.delete<T>(url, {
      headers,
      params: options?.params,
      withCredentials: options?.withCredentials,
      responseType: options?.responseType
    });
  }

  /**
   * 🔧 PATCH Request
   */
  patch<T>(endpoint: string, body?: any, options?: HttpOptions): Observable<T> {
    const url = this.createUrl(endpoint);
    const headers = this.createDefaultHeaders(options?.headers);
    
    console.log('🔍 HTTP PATCH:', url);
    
    return this.http.patch<T>(url, body, {
      headers,
      params: options?.params,
      withCredentials: options?.withCredentials,
      responseType: options?.responseType
    });
  }

  /**
   * 📎 Upload de arquivo (FormData)
   */
  upload<T>(endpoint: string, formData: FormData, options?: Omit<HttpOptions, 'headers'>): Observable<T> {
    const url = this.createUrl(endpoint);
    
    // Para upload, não definir Content-Type (deixar o browser definir boundary)
    let headers = new HttpHeaders();
    
    const token = this.authService.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    console.log('🔍 HTTP UPLOAD:', url);
    
    return this.http.post<T>(url, formData, {
      headers,
      params: options?.params,
      withCredentials: options?.withCredentials
    });
  }

  /**
   * 🔍 Download de arquivo
   */
  download(endpoint: string, options?: Omit<HttpOptions, 'responseType'>): Observable<Blob> {
    const url = this.createUrl(endpoint);
    const headers = this.createDefaultHeaders(options?.headers);
    
    console.log('🔍 HTTP DOWNLOAD:', url);
    
    return this.http.get(url, {
      headers,
      params: options?.params,
      withCredentials: options?.withCredentials,
      responseType: 'blob'
    });
  }
}