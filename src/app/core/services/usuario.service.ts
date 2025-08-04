// core/services/usuario.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { Usuario } from '../../models/usuario/usuario';
import { Perfil } from '../../models/usuario/perfil';
import { IResponsePage } from './reponse.interface';
import { defaultPageRequest, OrderBy } from './request.interface';
import { HttpService } from '../../auth/services/http.service';


@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private httpService = inject(HttpService); // ✅ Usar HttpService ao invés de HttpClient

  /**
   * 📝 Cadastra um novo usuário
   */
  async criarUsuario(dadosUsuario: Usuario): Promise<Usuario> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<Usuario>('usuarios', dadosUsuario) // ✅ Token JWT automático
      );
      return response;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 📋 Lista todos os usuários com paginação
   */
  async listarUsuarios(
    pagina: number = 1,
    limite: number = 10
  ): Promise<IResponsePage<Usuario>> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<IResponsePage<Usuario>>(
          'usuarios/buscar', // ✅ Endpoint sem URL base
          defaultPageRequest<Usuario>({}, { id: 'ASC' })
        )
      );
      return response;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 🔍 Busca um usuário específico por ID
   */
  async obterUsuarioPorId(id: number): Promise<Usuario> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<Usuario>(`usuarios/${id}`) // ✅ Endpoint sem URL base
      );
      return response;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * ✏️ Atualiza um usuário existente
   */
  async atualizarUsuario(
    id: number,
    dadosUsuario: Partial<Usuario>
  ): Promise<Usuario> {
    try {
      const response = await firstValueFrom(
        this.httpService.put<Usuario>(`usuarios/${id}`, dadosUsuario) // ✅ Token JWT automático
      );
      return response;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 🏷️ Obtém todos os perfis disponíveis
   */
  async obterPerfis(): Promise<Perfil[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<Perfil[]>('perfis') // ✅ Token JWT automático
      );
      return response;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 🔍 Busca usuários com filtros
   */
  async buscarUsuarios(
    usuario: Partial<Usuario>,
    pagina: number,
    orderBy: OrderBy<Usuario> = { id: 'ASC' },
    take: number = 100
  ): Promise<IResponsePage<Usuario>> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<IResponsePage<Usuario>>(
          'usuarios/buscar', // ✅ Endpoint sem URL base
          defaultPageRequest<Usuario>(usuario, orderBy, pagina, take)
        )
      );
      return response;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 🔑 Altera senha de um usuário
   */
  async alterarSenha(
    id: number,
    senhaAtual: string,
    novaSenha: string
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.patch(`usuarios/${id}/senha`, {
          // ✅ Token JWT automático
          senhaAtual,
          novaSenha,
        })
      );
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 🔄 Ativa/Desativa um usuário
   */
  async alterarStatusUsuario(id: number, ativo: boolean): Promise<Usuario> {
    try {
      const response = await firstValueFrom(
        this.httpService.patch<Usuario>(`usuarios/${id}/status`, { ativo }) // ✅ Token JWT automático
      );
      return response;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 🗑️ Exclui um usuário (método adicional)
   */
  async excluirUsuario(id: number): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.delete(`usuarios/${id}`) // ✅ Token JWT automático
      );
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * 👤 Busca usuário com permissões (para uso no AuthService)
   */
  async obterUsuarioComPermissoes(id: number): Promise<Usuario> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<Usuario>(`usuarios/${id}/permissoes`) // ✅ Endpoint específico
      );
      return response;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * ⚠️ Extrai mensagem de erro do response
   */
  private getErrorMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }

    if (error?.error?.errors && Array.isArray(error.error.errors)) {
      return error.error.errors.join(', ');
    }

    if (typeof error?.error === 'string') {
      return error.error;
    }

    if (error?.message) {
      return error.message;
    }

    return 'Erro desconhecido no servidor';
  }
}
