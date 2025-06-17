import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { LoginComponent } from './auth/login/login.component';
import { authGuard } from './auth/services/guard.service';
import { loginGuard } from './auth/services/login.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate:[authGuard],
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/home/home.component').then((m) => m.HomeComponent),
      },
      // outras rotas protegidas
    ],
  },
  {
    path: 'login',
    canActivate:[loginGuard],
    component: AuthLayoutComponent,
    children: [{ path: '', component: LoginComponent }],
  },
  { path: '**', redirectTo: '' },
];
