import { BaseModel } from '../base/base.models';
import { Permissao } from './permissao';

export class Perfil extends BaseModel {
  nome: string;
  ativo: boolean;
  permissoes: Permissao[];
}
