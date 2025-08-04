import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Perfil } from '../../models/usuario/perfil';
import { Permissao } from '../../models/usuario/permissao';


interface CriarPerfilRequest {
  nome: string;
  permissaoIds: number[];
}

@Injectable({
  providedIn: 'root'
})
export class PerfilService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://127.0.0.1:3000';

  async listarPerfis(): Promise<Perfil[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<Perfil[]>(`${this.baseUrl}/perfis`)
      );
      return response;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async obterPerfilPorId(id: number): Promise<Perfil> {
    try {
      const response = await firstValueFrom(
        this.http.get<Perfil>(`${this.baseUrl}/perfis/${id}`)
      );
      return response;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async criarPerfil(dadosPerfil: CriarPerfilRequest): Promise<Perfil> {
    try {
      const response = await firstValueFrom(
        this.http.post<Perfil>(`${this.baseUrl}/perfis`, dadosPerfil)
      );
      return response;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async atualizarPerfil(id: number, dadosPerfil: Partial<CriarPerfilRequest>): Promise<Perfil> {
    try {
      const response = await firstValueFrom(
        this.http.put<Perfil>(`${this.baseUrl}/perfis/${id}`, dadosPerfil)
      );
      return response;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async excluirPerfil(id: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.baseUrl}/perfis/${id}`)
      );
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async listarPermissoes(): Promise<Permissao[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<Permissao[]>(`${this.baseUrl}/permissoes`)
      );
      return response;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  private getErrorMessage(error: any): string {
    if (error?.error?.message) return error.error.message;
    if (typeof error?.error === 'string') return error.error;
    if (error?.message) return error.message;
    return 'Erro desconhecido no servidor';
  }
}