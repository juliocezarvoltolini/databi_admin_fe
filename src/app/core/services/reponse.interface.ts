
export interface IResponsePage<T> {
    quantidadeNaPagina: number;
    quantidadeTotal: number;
    pagina: number;
    ultimaPagina: number;
    quantidadePorPagina: number;
    registros: T[];
}
