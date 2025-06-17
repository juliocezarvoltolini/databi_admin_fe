import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
})
export class MenuComponent {
  @Input() userName: string = '';
  @Input() userEmail: string = '';
  @Output() menuItemSelected = new EventEmitter<string>();
  @Output() logoutEvent = new EventEmitter<void>();

  isOpen: boolean = false;
  activeItem: string = 'dashboard';

  constructor(private router: Router) {}

  // Detecta cliques fora do menu para fechar em dispositivos móveis
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    if (this.isOpen) {
      this.closeSidebar();
    }
  }

  // Controla a abertura/fechamento do menu
  toggleSidebar(): void {
    this.isOpen = !this.isOpen;
  }

  // Abre o menu
  openSidebar(): void {
    this.isOpen = true;
  }

  // Fecha o menu
  closeSidebar(): void {
    this.isOpen = false;
  }

  // Define o item ativo do menu
  setActiveItem(item: string): void {
    this.activeItem = item;
    this.menuItemSelected.emit(item);

    // Navega para a rota correspondente
    this.navigateToRoute(item);

    // Fecha o menu em dispositivos móveis após seleção
    if (window.innerWidth < 768) {
      this.closeSidebar();
    }
  }

  // Navega para a rota baseada no item selecionado
  private navigateToRoute(item: string): void {
    const routes: { [key: string]: string } = {
      dashboard: '/dashboard',
      usuarios: '/usuarios',
      produtos: '/produtos',
      vendas: '/vendas',
      relatorios: '/relatorios',
      configuracoes: '/configuracoes',
    };

    const route = routes[item];
    if (route) {
      this.router.navigate([route]);
    }
  }

  // Emite evento de logout
  logout(): void {
    this.logoutEvent.emit();
  }

  // Método para ser chamado do componente pai para definir item ativo
  public setActiveMenuItem(item: string): void {
    this.activeItem = item;
  }

  // Método para verificar se é dispositivo móvel
  private isMobile(): boolean {
    return window.innerWidth < 768;
  }
}
