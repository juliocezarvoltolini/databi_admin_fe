import { Pessoa } from '../pessoa/pessoa';
import { Perfil } from './perfil';
export class Usuario {
  id: number;
  criadoEm: Date;
  atualizadoEm: Date;
  pessoa: Pessoa; // ✅ Usar classe Pessoa completa
  login: string;
  senha: string;
  perfis: Perfil[];
  constructor() {

  }

  /**
   * Retorna todas as permissões únicas do usuário
   * baseado em seus perfis
   */
  static getPermissoes(user: Usuario): string[] {
    const permissoes = new Set<string>();

    user.perfis.forEach((perfil) => {
      perfil.permissoes.forEach((permissao) => {
        permissoes.add(permissao.nome);
      });
    });

    return Array.from(permissoes);
  }

  /**
   * Verifica se o usuário tem uma permissão específica
   */
  static hasPermission(user: Usuario, permissionName: string): boolean {
    return Usuario.getPermissoes(user).some(
      (permission) =>
        permission === permissionName || permission === 'SUPER_ADMIN'
    );
  }

  /**
   * Retorna o nome de exibição do usuário
   */
  getDisplayName(): string {
    return this.pessoa?.nome || this.login;
  }

  /**
   * Retorna o nome do perfil principal (primeiro da lista)
   */
  getPrimaryRole(): string {
    if (this.perfis && this.perfis.length > 0) {
      return this.perfis[0].nome;
    }
    return 'Usuário';
  }
}
