import { Component, OnInit, inject } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, map } from 'rxjs/operators';

import { AuthService } from '../../auth/services/auth.service';
import { MenuComponent } from '../../pages/menu/menu.component';
import { MenuService } from '../../core/services/menu.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MenuComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent implements OnInit {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private authService = inject(AuthService);
  
  // Injeta o serviço compartilhado do menu
  menuService = inject(MenuService);
  
  pageTitle = 'Dashboard';
  showHeader = true;
  notificationCount = 0; // Pode vir de um serviço de notificações
  showUserMenu = false; // Controle do dropdown

  // Mapeamento de rotas para títulos
  private readonly routeTitleMap: { [key: string]: string } = {
    '': 'Dashboard',
    'usuarios/cadastro': 'Cadastrar Usuário',
    'usuarios/lista': 'Lista de Usuários',
    'usuarios/editar': 'Editar Usuário',
    'perfis': 'Gerenciar Perfis',
    'permissoes': 'Gerenciar Permissões'
  };

  ngOnInit() {
    this.setupRouteListener();
    this.loadNotifications();
  }

  private setupRouteListener() {
    // Escuta mudanças de rota para atualizar o título da página
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => {
          let route = this.activatedRoute;
          while (route.firstChild) {
            route = route.firstChild;
          }
          
          // Verifica se há título nos dados da rota
          const routeTitle = route.snapshot.data['title'];
          if (routeTitle) {
            return routeTitle;
          }
          
          // Fallback para o mapeamento baseado na URL
          const urlSegments = route.snapshot.url.map(segment => segment.path).join('/');
          return this.getDefaultTitle(urlSegments);
        })
      )
      .subscribe(title => {
        this.pageTitle = title;
        // Atualiza o título da página no navegador
        document.title = `${title} - Sistema Admin`;
      });
  }

  private getDefaultTitle(path: string): string {
    // Tenta encontrar correspondência exata primeiro
    if (this.routeTitleMap[path]) {
      return this.routeTitleMap[path];
    }
    
    // Para rotas com parâmetros (como editar/:id)
    for (const [route, title] of Object.entries(this.routeTitleMap)) {
      if (path.startsWith(route.split('/')[0]) && route.includes('editar')) {
        return title;
      }
    }
    
    // Fallback genérico
    const segments = path.split('/');
    const lastSegment = segments[segments.length - 1];
    return this.capitalizeFirst(lastSegment) || 'Sistema';
  }

  private capitalizeFirst(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private loadNotifications() {
    // Aqui você pode buscar notificações de um serviço
    // Por exemplo: this.notificationService.getCount().subscribe(count => this.notificationCount = count);
    this.notificationCount = 3; // Exemplo
  }

  logout() {
    this.authService.logoutAndRedirect();
  }

  // Método para controlar visibilidade do header baseado na rota
  toggleHeader() {
    this.showHeader = !this.showHeader;
  }

  // Controle do dropdown do usuário
  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  // Fechar dropdown quando clicar fora
  closeUserMenu() {
    this.showUserMenu = false;
  }
}