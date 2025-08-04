import { BaseModel } from '../base/base.models';

export class Permissao extends BaseModel {
  nome: string;
  descricao?: string;
  recurso?: string;
  acao?: string;
  numericValue: number;
  stringValue?: string;
}
