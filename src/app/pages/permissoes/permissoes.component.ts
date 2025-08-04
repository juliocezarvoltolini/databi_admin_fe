import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PermissaoService } from '../../core/services/permissao.service';
import { Permissao } from '../../models/usuario/permissao';


@Component({
    selector: 'app-permissoes',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './permissoes.component.html',
    styleUrls: ['./permissoes.component.scss'],
})
export class PermissoesComponent implements OnInit {
    permissoes: Permissao[] = [];

    isLoading = false;
    erro: string | null = null;
    sucesso: string | null = null;

    // Modal
    showModal = false;
    modalMode: 'create' | 'edit' = 'create';
    permissaoForm: FormGroup;
    permissaoSelecionada: Permissao | null = null;

    constructor(
        private fb: FormBuilder,
        private permissaoService: PermissaoService
    ) {
        this.permissaoForm = this.createForm();
    }

    ngOnInit() {
        this.carregarPermissoes();
    }

    private createForm(): FormGroup {
        return this.fb.group({
            nome: ['', [Validators.required, Validators.minLength(2)]],
            numericValue: [0, [Validators.min(0)]],
            stringValue: ['']
        });
    }

    async carregarPermissoes() {
        this.isLoading = true;
        try {
            this.permissoes = await this.permissaoService.listarPermissoes();
        } catch (error: any) {
            this.erro = error.message || 'Erro ao carregar permissões';
        } finally {
            this.isLoading = false;
        }
    }

    // Modal actions
    abrirModalCriacao() {
        this.modalMode = 'create';
        this.permissaoSelecionada = null;
        this.permissaoForm.reset();
        this.showModal = true;
    }

    abrirModalEdicao(permissao: Permissao) {
        this.modalMode = 'edit';
        this.permissaoSelecionada = permissao;
        this.permissaoForm.patchValue({
            nome: permissao.nome,
            numericValue: permissao.numericValue,
            stringValue: permissao.stringValue
        });
        this.showModal = true;
    }

    fecharModal() {
        this.showModal = false;
        this.permissaoSelecionada = null;
        this.limparMensagens();
    }

    async salvarPermissao() {
        if (this.permissaoForm.valid) {
            this.isLoading = true;
            try {
                const permissaoData = this.permissaoForm.value;

                if (this.modalMode === 'create') {
                    await this.permissaoService.criarPermissao(permissaoData);
                    this.sucesso = 'Permissão criada com sucesso!';
                } else if (this.permissaoSelecionada) {
                    await this.permissaoService.atualizarPermissao(this.permissaoSelecionada.id, permissaoData);
                    this.sucesso = 'Permissão atualizada com sucesso!';
                }

                this.fecharModal();
                await this.carregarPermissoes();

            } catch (error: any) {
                this.erro = error.message || 'Erro ao salvar permissão';
            } finally {
                this.isLoading = false;
            }
        }
    }

    async excluirPermissao(permissao: Permissao) {
        if (confirm(`Tem certeza que deseja excluir a permissão "${permissao.nome}"?`)) {
            try {
                await this.permissaoService.excluirPermissao(permissao.id);
                this.sucesso = 'Permissão excluída com sucesso!';
                await this.carregarPermissoes();
            } catch (error: any) {
                this.erro = error.message || 'Erro ao excluir permissão';
            }
        }
    }

    limparMensagens() {
        this.erro = null;
        this.sucesso = null;
    }
}