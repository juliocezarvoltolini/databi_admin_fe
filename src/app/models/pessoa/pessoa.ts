export type PessoaTipo = 'PF' | 'PJ';

export class Pessoa {
  public id: number;

  public tipo: PessoaTipo;

  public nome: string;

  public documento: string;

  constructor() {}
}
