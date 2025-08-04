import {
  Component,
  HostListener,
  OnInit,
  signal,
  computed,
  inject,
  effect,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/services/auth.service';
import { Usuario } from '../../models/usuario/usuario';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { MenuService } from '../../core/services/menu.service';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  permissions?: string[];
  children?: MenuItem[];
  badge?: number;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-100%)' }),
        animate(
          '300ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateX(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '300ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 0, transform: 'translateX(-100%)' })
        ),
      ]),
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('200ms ease-out', style({ opacity: 0 }))]),
    ]),
  ],
})
export class MenuComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);

  // Injeta o serviço compartilhado do menu
  menuService = inject(MenuService);

  // Signals para dados do usuário
  currentUser = signal<Usuario | null>(null);
  userPermissions = signal<string[]>([]);

  expandedSections = signal<Set<string>>(new Set());

  // Computed properties usando o serviço compartilhado
  shouldShowUserInfo = computed(
    () => !this.menuService.isCollapsed() && this.currentUser()
  );
  sidebarClasses = computed(() => ({
    sidebar: true,
    collapsed: this.menuService.isCollapsed(),
    mobile: this.menuService.isMobile(),
  }));

  // Aliases para facilitar uso no template
  isCollapsed = this.menuService.isCollapsed;
  isMobile = this.menuService.isMobile;

  // Menu items configuration
  menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'bi-speedometer2',
      route: '/seplan',
    },
    {
      id: 'users',
      label: 'Usuários',
      icon: 'bi-people',
      permissions: ['CADASTRAR_USUARIO', 'LISTAR_USUARIOS', 'SUPER_ADMIN'],
      children: [
        {
          id: 'create-user',
          label: 'Cadastrar Usuário',
          icon: 'bi-person-plus',
          route: '/usuarios/cadastro',
          permissions: ['CADASTRAR_USUARIO', 'SUPER_ADMIN'],
        },
        {
          id: 'list-users',
          label: 'Listar Usuários',
          icon: 'bi-list-ul',
          route: '/usuarios/lista',
          permissions: ['LISTAR_USUARIOS', 'SUPER_ADMIN'],
        },
      ],
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: 'bi-gear',
      permissions: ['GERENCIAR_PERFIS', 'GERENCIAR_PERMISSOES', 'SUPER_ADMIN'],
      children: [
        {
          id: 'profiles',
          label: 'Perfis',
          icon: 'bi-award',
          route: '/perfis',
          permissions: ['GERENCIAR_PERFIS', 'SUPER_ADMIN'],
        },
        {
          id: 'permissions',
          label: 'Permissões',
          icon: 'bi-key',
          route: '/permissoes',
          permissions: ['GERENCIAR_PERFIS', 'SUPER_ADMIN'],
        },
      ],
    },
  ];

  constructor() {}

  ngOnInit() {
    this.loadUserData();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    // O MenuService já cuida do resize
  }

  private loadUserData() {
    const user = this.authService.getCurrentUser()();
    this.currentUser.set(user);

    if (user) {
      const permissions = Usuario.getPermissoes(user);
      this.userPermissions.set(permissions);
    }
  }

  toggleSection(sectionId: string) {
    this.expandedSections.update((expanded) => {
      const newSet = new Set(expanded);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }

  // Adicionar este método também
  isSectionExpanded(sectionId: string): boolean {
    return this.expandedSections().has(sectionId) && !this.isCollapsed();
  }

  toggleSidebar() {
    this.menuService.toggleSidebar();
  }

  hasPermission(permissions: string[]): boolean {
    const userPerms = this.userPermissions();
    return permissions.some((permission) => userPerms.includes(permission));
  }

  shouldShowMenuItem(item: MenuItem): boolean {
    if (!item.permissions) return true;
    return this.hasPermission(item.permissions);
  }

  shouldShowSection(item: MenuItem): boolean {
    if (!item.children) return false;
    return item.children.some((child) => this.shouldShowMenuItem(child));
  }

  getPrimaryRole(): string {
    const user = this.currentUser();
    if (user?.perfis && user.perfis.length > 0) {
      return user.perfis[0].nome;
    }
    return 'Usuário';
  }

  getUserDisplayName(): string {
    const user = this.currentUser();
    return user?.pessoa?.nome || user?.login || 'Usuário';
  }

  getUserInitials(): string {
    const name = this.getUserDisplayName();
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  logout() {
    this.authService.logoutAndRedirect();
  }

  // Método para navegar e fechar menu no mobile
  navigateAndClose(route: string) {
    console.log(`Navegando para: ${route}`);
    this.router.navigate([route]);
    this.menuService.navigateAndCollapse();
  }
}