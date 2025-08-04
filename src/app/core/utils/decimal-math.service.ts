import { Injectable } from '@angular/core';
import Decimal from 'decimal.js';

// ✅ Tipo correto: instância de Decimal
export type NumberInput = string | number | Decimal;

/**
 * 📏 Tipos de arredondamento conforme ABNT NBR 5891
 * (Mapeados para os valores corretos do decimal.js)
 */
export enum TipoArredondamento {
    /** Arredonda sempre para cima quando exatamente no meio */
    MEIO_CIMA = 0,        // 0
    /** Arredonda sempre para baixo quando exatamente no meio */
    MEIO_BAIXO = 1,     // 1
    /** Arredonda para cima (ceiling) */
    CIMA = 2,                  // 2
    /** Arredonda para baixo (floor) */
    BAIXO = 3,               // 3
    /** Arredonda para o número par mais próximo (padrão ABNT) */
    MEIO_PAR = 6,       // 6
    /** Trunca (remove casas decimais) - equivale a ROUND_DOWN */
    TRUNCAR = 3              // 3
}

/**
 * 🧮 Wrapper para operações matemáticas com precisão decimal
 * Implementa regras de arredondamento ABNT NBR 5891
 */
@Injectable({
    providedIn: 'root'
})
export class DecimalMathService {

    constructor() {
        this.configureDecimal();
    }

    /**
     * ⚙️ Configurações da biblioteca Decimal.js conforme ABNT
     */
    private configureDecimal(): void {
        Decimal.set({
            precision: 50,                              // Alta precisão para cálculos intermediários
            rounding: TipoArredondamento.MEIO_CIMA,            // Padrão ABNT: quando no meio, arredonda para cima
            toExpNeg: -15,                              // Notação exponencial para números < 1e-15
            toExpPos: 21,                               // Notação exponencial para números >= 1e21
            maxE: 9e15,                                 // Expoente máximo
            minE: -9e15,                                // Expoente mínimo
            modulo: Decimal.ROUND_DOWN,                 // Modo para operação módulo
            crypto: false                               // Usar Math.random
        });
    }

    /**
     * ➕ Soma dois números com precisão decimal
     * @param a Primeiro número
     * @param b Segundo número
     * @param casasDecimais Número de casas decimais no resultado (padrão: 2)
     * @param tipoArredondamento Tipo de arredondamento (padrão: MEIO_PAR - ABNT)
     * @returns Resultado da soma arredondado
     */
    add(
        a: NumberInput,
        b: NumberInput,
        casasDecimais: number = 2,
        tipoArredondamento: TipoArredondamento = TipoArredondamento.MEIO_PAR
    ): number {

        const resultado = new Decimal(a).plus(new Decimal(b));
        return this.aplicarArredondamento(resultado, casasDecimais, tipoArredondamento);
    }

    /**
     * ➖ Subtrai dois números com precisão decimal
     * @param a Minuendo
     * @param b Subtraendo
     * @param casasDecimais Número de casas decimais no resultado (padrão: 2)
     * @param tipoArredondamento Tipo de arredondamento (padrão: MEIO_PAR - ABNT)
     * @returns Resultado da subtração arredondado
     */
    subtract(
        a: NumberInput,
        b: NumberInput,
        casasDecimais: number = 2,
        tipoArredondamento: TipoArredondamento = TipoArredondamento.MEIO_PAR
    ): number {
        const resultado = new Decimal(a).minus(new Decimal(b));
        return this.aplicarArredondamento(resultado, casasDecimais, tipoArredondamento);
    }

    /**
     * ✖️ Multiplica dois números com precisão decimal
     * @param a Primeiro fator
     * @param b Segundo fator
     * @param casasDecimais Número de casas decimais no resultado (padrão: 2)
     * @param tipoArredondamento Tipo de arredondamento (padrão: MEIO_PAR - ABNT)
     * @returns Resultado da multiplicação arredondado
     */
    multiply(
        a: NumberInput,
        b: NumberInput,
        casasDecimais: number = 2,
        tipoArredondamento: TipoArredondamento = TipoArredondamento.MEIO_PAR
    ): number {
        const resultado = new Decimal(a).mul(new Decimal(b));
        return this.aplicarArredondamento(resultado, casasDecimais, tipoArredondamento);
    }

    /**
     * ➗ Divide dois números com precisão decimal
     * @param a Dividendo
     * @param b Divisor
     * @param casasDecimais Número de casas decimais no resultado (padrão: 2)
     * @param tipoArredondamento Tipo de arredondamento (padrão: MEIO_PAR - ABNT)
     * @returns Resultado da divisão arredondado
     * @throws Error se divisor for zero
     */
    divide(
        a: NumberInput,
        b: NumberInput,
        casasDecimais: number = 2,
        tipoArredondamento: TipoArredondamento = TipoArredondamento.MEIO_PAR
    ): number {
        const divisor = new Decimal(b);
        if (divisor.isZero()) {
            throw new Error('Divisão por zero não é permitida');
        }
        const resultado = new Decimal(a).div(divisor);
        return this.aplicarArredondamento(resultado, casasDecimais, tipoArredondamento);
    }

    /**
     * 🔢 Arredonda número com configurações específicas
     * @param value Valor a arredondar
     * @param casasDecimais Número de casas decimais (padrão: 2)
     * @param tipoArredondamento Tipo de arredondamento (padrão: MEIO_PAR - ABNT)
     * @returns Valor arredondado
     */
    round(
        value: NumberInput,
        casasDecimais: number = 2,
        tipoArredondamento: TipoArredondamento = TipoArredondamento.MEIO_PAR
    ): number {
        return this.aplicarArredondamento(new Decimal(value), casasDecimais, tipoArredondamento);
    }

    /**
     * 🎯 Aplica arredondamento conforme configuração
     * @param valor Valor a arredondar
     * @param casasDecimais Número de casas decimais
     * @param tipoArredondamento Tipo de arredondamento
     * @returns Valor arredondado
     */
    private aplicarArredondamento(
        valor: Decimal,
        casasDecimais: number,
        tipoArredondamento: TipoArredondamento
    ): number {
        // Usa o método toDecimalPlaces com o modo de arredondamento específico
        const decimalNew = Decimal.clone({ rounding: tipoArredondamento });
        return decimalNew(valor).toDecimalPlaces(casasDecimais).toNumber();
    }

    /**
     * 📊 Calcula porcentagem com arredondamento
     * @param value Valor base
     * @param percentage Porcentagem (ex: 15 para 15%)
     * @param casasDecimais Casas decimais (padrão: 2)
     * @param tipoArredondamento Tipo de arredondamento (padrão: MEIO_PAR)
     * @returns Valor da porcentagem
     */
    percentage(
        value: NumberInput,
        percentage: NumberInput,
        casasDecimais: number = 2,
        tipoArredondamento: TipoArredondamento = TipoArredondamento.MEIO_PAR
    ): number {
        const percentDecimal = this.divide(percentage, 100, 10); // Mais precisão intermediária
        return this.multiply(value, percentDecimal, casasDecimais, tipoArredondamento);
    }

    /**
     * 📈 Aplica porcentagem ao valor (valor + porcentagem)
     * @param value Valor base
     * @param percentage Porcentagem a aplicar
     * @param casasDecimais Casas decimais (padrão: 2)
     * @param tipoArredondamento Tipo de arredondamento (padrão: MEIO_PAR)
     * @returns Valor com porcentagem aplicada
     */
    applyPercentage(
        value: NumberInput,
        percentage: NumberInput,
        casasDecimais: number = 2,
        tipoArredondamento: TipoArredondamento = TipoArredondamento.MEIO_PAR
    ): number {
        const percentValue = this.percentage(value, percentage, 10, tipoArredondamento);
        return this.add(value, percentValue, casasDecimais, tipoArredondamento);
    }

    /**
     * 📉 Remove porcentagem do valor (valor - porcentagem)
     * @param value Valor base
     * @param percentage Porcentagem a remover
     * @param casasDecimais Casas decimais (padrão: 2)
     * @param tipoArredondamento Tipo de arredondamento (padrão: MEIO_PAR)
     * @returns Valor com porcentagem removida
     */
    removePercentage(
        value: NumberInput,
        percentage: NumberInput,
        casasDecimais: number = 2,
        tipoArredondamento: TipoArredondamento = TipoArredondamento.MEIO_PAR
    ): number {
        const percentValue = this.percentage(value, percentage, 10, tipoArredondamento);
        return this.subtract(value, percentValue, casasDecimais, tipoArredondamento);
    }

    /**
     * 💰 Formata valor monetário brasileiro
     * @param value Valor a formatar
     * @param currency Moeda (padrão: 'BRL')
     * @param casasDecimais Casas decimais para formatação (padrão: 2)
     * @returns String formatada como moeda
     */
    formatCurrency(
        value: NumberInput,
        currency: string = 'BRL',
        casasDecimais: number = 2
    ): string {
        const valorArredondado = this.round(value, casasDecimais);
        const number = valorArredondado;

        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: casasDecimais,
            maximumFractionDigits: casasDecimais
        }).format(number);
    }

    /**
     * 🔢 Formata número com separadores brasileiros
     * @param value Valor a formatar
     * @param casasDecimais Casas decimais (padrão: 2)
     * @returns String formatada
     */
    formatNumber(value: NumberInput, casasDecimais: number = 2): string {
        const valorArredondado = this.round(value, casasDecimais);
        const number = valorArredondado;

        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: casasDecimais,
            maximumFractionDigits: casasDecimais
        }).format(number);
    }

    // =================== MÉTODOS DE COMPARAÇÃO ===================

    /**
     * ⚖️ Compara dois números
     * @param a Primeiro número
     * @param b Segundo número
     * @returns -1 se a < b, 0 se a == b, 1 se a > b
     */
    compare(a: NumberInput, b: NumberInput): number {
        return new Decimal(a).comparedTo(new Decimal(b));
    }

    /**
     * 🟰 Verifica se dois números são iguais
     * @param a Primeiro número
     * @param b Segundo número
     * @param tolerancia Tolerância para comparação (padrão: 0)
     * @returns true se iguais dentro da tolerância
     */
    equals(a: NumberInput, b: NumberInput, tolerancia: NumberInput = 0): boolean {
        if (this.isZero(tolerancia)) {
            return new Decimal(a).equals(new Decimal(b));
        }
        const diferenca = this.subtract(a, b, 10, TipoArredondamento.TRUNCAR);
        const diferencaAbsoluta = Decimal(diferenca).abs();
        return this.lessThan(diferencaAbsoluta, tolerancia) || this.equals(diferencaAbsoluta, tolerancia);
    }

    /**
     * 🔍 Verifica se número é maior que outro
     */
    greaterThan(a: NumberInput, b: NumberInput): boolean {
        return new Decimal(a).greaterThan(new Decimal(b));
    }

    /**
     * 🔍 Verifica se número é menor que outro
     */
    lessThan(a: NumberInput, b: NumberInput): boolean {
        return new Decimal(a).lessThan(new Decimal(b));
    }

    /**
     * 0️⃣ Verifica se número é zero
     */
    isZero(value: NumberInput): boolean {
        return new Decimal(value).isZero();
    }

    /**
     * ➖ Verifica se número é negativo
     */
    isNegative(value: NumberInput): boolean {
        return new Decimal(value).isNegative();
    }

    /**
     * ➕ Verifica se número é positivo
     */
    isPositive(value: NumberInput): boolean {
        return new Decimal(value).isPositive();
    }

    // =================== MÉTODOS UTILITÁRIOS ===================

    /**
     * 🔄 Converte Decimal para number (use com cuidado!)
     */
    toNumber(value: Decimal): number {
        return value.toNumber();
    }

    /**
     * 🔤 Converte Decimal para string
     */
    toString(value: Decimal): string {
        return value.toString();
    }

    /**
     * 🏗️ Cria novo Decimal (factory method)
     */
    create(value: NumberInput): number {
        return new Decimal(value).toNumber();
    }

    /**
     * 📊 Calcula média de uma lista de números
     * @param values Array de números
     * @param casasDecimais Casas decimais (padrão: 2)
     * @param tipoArredondamento Tipo de arredondamento (padrão: MEIO_PAR)
     * @returns Média dos valores
     */
    average(
        values: NumberInput[],
        casasDecimais: number = 2,
        tipoArredondamento: TipoArredondamento = TipoArredondamento.MEIO_PAR
    ): number {
        if (values.length === 0) {
            throw new Error('Array não pode estar vazio');
        }

        const sum = values.reduce((acc, value) =>
            this.add(acc, value, 10), new Decimal(0) // Precisão intermediária
        );

        return this.divide(sum, values.length, casasDecimais, tipoArredondamento);
    }

    /**
     * 📈 Encontra o maior valor em uma lista
     */
    max(values: NumberInput[]): number {
        if (values.length === 0) {
            throw new Error('Array não pode estar vazio');
        }

        let retorno = values.reduce((max, current) =>
            this.greaterThan(current, max) ? new Decimal(current) : max,
            new Decimal(values[0])
        );

        return Decimal(retorno).toNumber()
    }

    /**
     * 📉 Encontra o menor valor em uma lista
     */
    min(values: NumberInput[]): number {
        if (values.length === 0) {
            throw new Error('Array não pode estar vazio');
        }

        let retorno = values.reduce((min, current) =>
            this.lessThan(current, min) ? new Decimal(current) : min,
            new Decimal(values[0])
        );

        return Decimal(retorno).toNumber()
    }

    /**
     * 🧮 Soma uma lista de números
     * @param values Array de números
     * @param casasDecimais Casas decimais (padrão: 2)
     * @param tipoArredondamento Tipo de arredondamento (padrão: MEIO_PAR)
     * @returns Soma total
     */
    sum(
        values: NumberInput[],
        casasDecimais: number = 2,
        tipoArredondamento: TipoArredondamento = TipoArredondamento.MEIO_PAR
    ): number {
        const resultado = values.reduce((acc, value) =>
            this.add(acc, value, 10), new Decimal(0) // Precisão intermediária
        );

        return this.round(resultado, casasDecimais, tipoArredondamento);
    }

    // =================== MÉTODOS ESPECÍFICOS PARA NEGÓCIOS ===================

    /**
     * 💸 Calcula desconto com arredondamento ABNT
     * @param valor Valor original
     * @param percentualDesconto Percentual de desconto
     * @param casasDecimais Casas decimais (padrão: 2)
     * @returns Valor final com desconto
     */
    calcularDesconto(
        valor: NumberInput,
        percentualDesconto: NumberInput,
        casasDecimais: number = 2
    ): number {
        const valorDesconto = this.percentage(valor, percentualDesconto, casasDecimais);
        return this.subtract(valor, valorDesconto, casasDecimais);
    }

    /**
     * 📊 Calcula imposto com arredondamento ABNT
     * @param valorBase Valor base para cálculo
     * @param aliquota Alíquota do imposto (%)
     * @param casasDecimais Casas decimais (padrão: 2)
     * @returns Valor do imposto
     */
    calcularImposto(
        valorBase: NumberInput,
        aliquota: NumberInput,
        casasDecimais: number = 2
    ): number {
        return this.percentage(valorBase, aliquota, casasDecimais);
    }

    /**
     * 🏦 Calcula valor com juros simples
     * @param capital Capital inicial
     * @param taxa Taxa de juros (% ao período)
     * @param periodo Número de períodos
     * @param casasDecimais Casas decimais (padrão: 2)
     * @returns Montante final
     */
    jurosSimples(
        capital: NumberInput,
        taxa: NumberInput,
        periodo: NumberInput,
        casasDecimais: number = 2
    ): number {
        // M = C * (1 + i * n)
        const taxaDecimal = this.divide(taxa, 100, 10);
        const fator = this.multiply(taxaDecimal, periodo, 10);
        const umMaisFator = this.add(1, fator, 10);

        return this.multiply(capital, umMaisFator, casasDecimais);
    }

    /**
     * 📄 Obtém informações de debug sobre as configurações atuais
     */
    getConfig(): object {
        return {
            precision: Decimal.precision,
            rounding: Decimal.rounding,
            toExpNeg: Decimal.toExpNeg,
            toExpPos: Decimal.toExpPos,
            maxE: Decimal.maxE,
            minE: Decimal.minE,
            modulo: Decimal.modulo,
            crypto: Decimal.crypto
        };
    }
}

const AppMath = new DecimalMathService();
export default AppMath;