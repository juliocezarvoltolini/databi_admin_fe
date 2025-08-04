import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-seplan-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seplan-dashboard.component.html',
  styleUrls: ['./seplan-dashboard.component.scss']
})
export class SeplanDashboardComponent implements OnInit {
  
  private sanitizer = inject(DomSanitizer);
  
  // 📱 Estados básicos
  isLoading = signal(true);
  hasError = signal(false);
  errorMessage = signal('');
  
  // 🔗 URL do PowerBI
  private readonly powerbiUrl = 'https://app.powerbi.com/view?r=eyJrIjoiNGZmOGIyYWYtNzcyYy00OGQ1LWE4OTktYTIyMzM4NjZmNjhhIiwidCI6IjBkNzg5ODQ4LTZlZTAtNDk3Ny04YjQ2LTUzNDFlMTNiODg3NCJ9';
  
  // 🔒 URL sanitizada
  safeUrl: SafeResourceUrl;

  constructor() {
    // Sanitizar URL para uso seguro no iframe
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.powerbiUrl);
  }

  ngOnInit() {
    // Simular loading inicial
    setTimeout(() => {
      this.isLoading.set(false);
    }, 2000);
  }

  // 🔄 Event handlers do iframe
  onIframeLoad() {
    console.log('✅ Dashboard PowerBI carregado');
    this.isLoading.set(false);
    this.hasError.set(false);
  }

  onIframeError() {
    console.error('❌ Erro ao carregar dashboard PowerBI');
    this.hasError.set(true);
    this.errorMessage.set('Erro ao carregar o dashboard do PowerBI');
    this.isLoading.set(false);
  }

  // 🔄 Refresh do dashboard
  refreshDashboard() {
    this.isLoading.set(true);
    this.hasError.set(false);
    
    // Recriar a URL com timestamp para forçar reload
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      `${this.powerbiUrl}&timestamp=${Date.now()}`
    );
    
    // Simular loading
    setTimeout(() => {
      this.isLoading.set(false);
    }, 2000);
  }



  // 🔗 Abrir no PowerBI (nova aba)
  openInPowerBI() {
    window.open(this.powerbiUrl, '_blank', 'noopener,noreferrer');
  }



  // 🔄 Tentar novamente
  retry() {
    this.hasError.set(false);
    this.refreshDashboard();
  }
}