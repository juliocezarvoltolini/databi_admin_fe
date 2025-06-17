import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';
import { map } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);

  // Acessamos o valor atual do Signal diretamente
  if (authService.isLoggedIn$()()) {
    return true;
  }
  return authService.logout();
};
