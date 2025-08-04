import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { LoginComponent } from './auth/login/login.component';
import { authGuard } from './auth/services/guard.service';
import { loginGuard } from './auth/services/login.guard';
import { SeplanDashboardComponent } from './pages/dashboards/seplan/seplan-dashboard.component';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/home/home.component').then((m) => m.HomeComponent),
        data: { title: 'Dashboard' },
      },
      // Rotas de Usuários
      {
        path: 'usuarios',
        children: [
          {
            path: 'cadastro',
            loadComponent: () =>
              import(
                './pages/usuarios/cadastro-usuario/cadastro-usuario.component'
              ).then((m) => m.CadastroUsuarioComponent),
            data: { title: 'Cadastrar Usuário' },
          },
          {
            path: 'lista',
            loadComponent: () =>
              import(
                './pages/usuarios/lista-usuarios/lista-usuarios.component'
              ).then((m) => m.ListaUsuariosComponent),
            data: { title: 'Lista de Usuários' },
          },
          {
            path: 'editar/:id',
            loadComponent: () =>
              import(
                './pages/usuarios/editar-usuario/editar-usuario.component'
              ).then((m) => m.EditarUsuarioComponent),
            data: { title: 'Editar Usuário' },
          },
        ],
      },
      // Rotas de Perfis
      {
        path: 'perfis',
        loadComponent: () =>
          import('./pages/perfis/perfis.component').then(
            (m) => m.PerfisComponent
          ),
        data: { title: 'Gerenciar Perfis' },
      },
      // Rotas de Permissões
      {
        path: 'permissoes',
        loadComponent: () =>
          import('./pages/permissoes/permissoes.component').then(
            (m) => m.PermissoesComponent
          ),
        data: { title: 'Gerenciar Permissões' },
      },
       {
        path: 'seplan',
        loadComponent: () =>
          import('./pages/dashboards/seplan/seplan-dashboard.component').then(
            (m) => m.SeplanDashboardComponent
          ),
        // data: { title: 'Seplan' },
      },
    ],
  },
  {
    path: 'login',
    canActivate: [loginGuard],
    component: AuthLayoutComponent,
    children: [{ path: '', component: LoginComponent }],
  },
  { path: '**', redirectTo: '' },
];
