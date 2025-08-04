import { BaseModel } from '../base/base.models';

export type ContatoTipo =
  | 'telefone'
  | 'celular'
  | 'email'
  | 'whatsapp'
  | 'fax'
  | 'site'
  | 'linkedin'
  | 'outro';

export class Contato extends BaseModel {
  tipo: ContatoTipo;
  valor: string;
  descricao?: string;
  principal: boolean;
  ativo: boolean;
  observacoes?: string;
}
