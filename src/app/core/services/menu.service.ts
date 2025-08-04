import { Injectable, signal, computed, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  // Estados do menu usando signals
  private _isCollapsed = signal(false);
  private _isMobile = signal(false);

  // Getters públicos readonly
  isCollapsed = this._isCollapsed.asReadonly();
  isMobile = this._isMobile.asReadonly();

  // Estado computado para classes CSS
  menuClasses = computed(() => ({
    'collapsed': this._isCollapsed(),
    'mobile': this._isMobile()
  }));

  constructor() {
    this.checkScreenSize();
    this.setupResizeListener();

  }

  // Métodos públicos para controlar o menu
  toggleSidebar() {
    this._isCollapsed.update(collapsed => !collapsed);
  }

  collapseSidebar() {
    this._isCollapsed.set(true);
  }

  expandSidebar() {
    this._isCollapsed.set(false);
  }

  setMobileState(isMobile: boolean) {
    this._isMobile.set(isMobile);
    
    // Auto-collapse no mobile
    if (isMobile && !this._isCollapsed()) {
      this._isCollapsed.set(true);
    }
  }

  private checkScreenSize() {
    const isMobile = window.innerWidth < 768;
    this.setMobileState(isMobile);
  }

  private setupResizeListener() {
    window.addEventListener('resize', () => {
      this.checkScreenSize();
    });
  }

  // Método utilitário para navegação no mobile
  navigateAndCollapse() {
    if (this._isMobile()) {
      this.collapseSidebar();
    }
  }
}