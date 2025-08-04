import { BaseModel } from '../base/base.models';

export type EnderecoTipo =
  | 'residencial'
  | 'comercial'
  | 'correspondencia'
  | 'cobranca'
  | 'entrega';

export class Endereco extends BaseModel {
  tipo: EnderecoTipo;
  principal: boolean;
  ativo: boolean;
  cep?: string;
  logradouro: string;
  numero?: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  pais: string;
  observacoes?: string;
}
