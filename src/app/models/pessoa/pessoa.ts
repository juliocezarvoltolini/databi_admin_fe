import { BaseModel } from '../base/base.models';
import { Contato, ContatoTipo } from './contato';
import { Endereco } from './endereco';

export type PessoaTipo = 'PF' | 'PJ';

export class Pessoa extends BaseModel {
  tipo: PessoaTipo;
  ativo: boolean;
  nome: string;
  email?: string;
  rg?: string;
  rgOrgaoEmissor?: string;
  dataNascimento?: Date;
  documento?: string; // CPF/CNPJ
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  dataAbertura?: Date;
  enderecos: Endereco[];
  contatos: Contato[];
}
