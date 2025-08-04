import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Permissao } from '../../models/usuario/permissao';


interface CriarPermissaoRequest {
  nome: string;
  numericValue?: number;
  stringValue?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PermissaoService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://127.0.0.1:3000';

  /**
   * Lista todas as permissões
   */
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

  /**
   * Obtém uma permissão específica por ID
   */
  async obterPermissaoPorId(id: number): Promise<Permissao> {
    try {
      const response = await firstValueFrom(
        this.http.get<Permissao>(`${this.baseUrl}/permissoes/${id}`)
      );
      return response;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Cria uma nova permissão
   */
  async criarPermissao(dadosPermissao: CriarPermissaoRequest): Promise<Permissao> {
    try {
      const response = await firstValueFrom(
        this.http.post<Permissao>(`${this.baseUrl}/permissoes`, dadosPermissao)
      );
      return response;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Atualiza uma permissão existente
   */
  async atualizarPermissao(id: number, dadosPermissao: Partial<CriarPermissaoRequest>): Promise<Permissao> {
    try {
      const response = await firstValueFrom(
        this.http.put<Permissao>(`${this.baseUrl}/permissoes/${id}`, dadosPermissao)
      );
      return response;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Exclui uma permissão
   */
  async excluirPermissao(id: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.baseUrl}/permissoes/${id}`)
      );
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Busca permissões por nome
   */
  async buscarPermissoesPorNome(nome: string): Promise<Permissao[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<Permissao[]>(`${this.baseUrl}/permissoes/buscar`, {
          params: { nome }
        })
      );
      return response;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Verifica se uma permissão existe pelo nome
   */
  async permissaoExiste(nome: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ existe: boolean }>(`${this.baseUrl}/permissoes/existe/${nome}`)
      );
      return response.existe;
    } catch (error: any) {
      // Se der erro, assume que não existe
      return false;
    }
  }

  /**
   * Extrai mensagem de erro do response
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