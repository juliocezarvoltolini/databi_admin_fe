
import { Pessoa } from '../pessoa/pessoa';
import { Perfil } from './perfil';

export class Usuario {

  id: number;

  criadoEm?: Date;

  atualizadoEm?: Date;

  pessoa: Pessoa;

  login: string;

  perfis: Perfil[];

  getPermissoes(): string[] {
    const permissoes = new Set<string>();
    this.perfis.forEach((profile) => {
      profile.permissoes.forEach((permissao) => {
        permissoes.add(permissao.nome);
      });
    });
    return Array.from(permissoes);
  }
}
