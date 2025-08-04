import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Permissao } from '../../models/usuario/permissao';
import { Perfil } from '../../models/usuario/perfil';
import { PerfilService } from '../../core/services/perfil.service';


@Component({
  selector: 'app-perfis',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './perfis.component.html',
  styleUrls: ['./perfis.component.scss'],
})
export class PerfisComponent implements OnInit {
  perfis: Perfil[] = [];
  permissoesDisponiveis: Permissao[] = [];
  
  isLoading = false;
  erro: string | null = null;
  sucesso: string | null = null;
  
  // Modal
  showModal = false;
  modalMode: 'create' | 'edit' = 'create';
  perfilForm: FormGroup;
  perfilSelecionado: Perfil | null = null;
  permissoesSelecionadas: number[] = [];

  constructor(
    private fb: FormBuilder,
    private perfilService: PerfilService
  ) {
    this.perfilForm = this.createForm();
  }

  ngOnInit() {
    this.carregarDados();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      permissoes: [[], Validators.required]
    });
  }

  async carregarDados() {
    this.isLoading = true;
    try {
      await Promise.all([
        this.carregarPerfis(),
        this.carregarPermissoes()
      ]);
    } catch (error: any) {
      this.erro = error.message || 'Erro ao carregar dados';
    } finally {
      this.isLoading = false;
    }
  }

  async carregarPerfis() {
    this.perfis = await this.perfilService.listarPerfis();
  }

  async carregarPermissoes() {
    this.permissoesDisponiveis = await this.perfilService.listarPermissoes();
  }

  // Modal actions
  abrirModalCriacao() {
    this.modalMode = 'create';
    this.perfilSelecionado = null;
    this.perfilForm.reset();
    this.permissoesSelecionadas = [];
    this.showModal = true;
  }

  abrirModalEdicao(perfil: Perfil) {
    this.modalMode = 'edit';
    this.perfilSelecionado = perfil;
    this.perfilForm.patchValue({
      nome: perfil.nome
    });
    this.permissoesSelecionadas = perfil.permissoes.map(p => p.id);
    this.perfilForm.patchValue({ permissoes: this.permissoesSelecionadas });
    this.showModal = true;
  }

  fecharModal() {
    this.showModal = false;
    this.perfilSelecionado = null;
    this.permissoesSelecionadas = [];
    this.limparMensagens();
  }

  onPermissaoChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const permissaoId = parseInt(checkbox.value);

    if (checkbox.checked) {
      if (!this.permissoesSelecionadas.includes(permissaoId)) {
        this.permissoesSelecionadas.push(permissaoId);
      }
    } else {
      const index = this.permissoesSelecionadas.indexOf(permissaoId);
      if (index > -1) {
        this.permissoesSelecionadas.splice(index, 1);
      }
    }

    this.perfilForm.patchValue({ permissoes: this.permissoesSelecionadas });
  }

  isPermissaoSelecionada(permissaoId: number): boolean {
    return this.permissoesSelecionadas.includes(permissaoId);
  }

  async salvarPerfil() {
    if (this.perfilForm.valid) {
      this.isLoading = true;
      try {
        const formData = this.perfilForm.value;
        const perfilData = {
          nome: formData.nome,
          permissaoIds: this.permissoesSelecionadas
        };

        if (this.modalMode === 'create') {
          await this.perfilService.criarPerfil(perfilData);
          this.sucesso = 'Perfil criado com sucesso!';
        } else if (this.perfilSelecionado) {
          await this.perfilService.atualizarPerfil(this.perfilSelecionado.id, perfilData);
          this.sucesso = 'Perfil atualizado com sucesso!';
        }

        this.fecharModal();
        await this.carregarPerfis();
        
      } catch (error: any) {
        this.erro = error.message || 'Erro ao salvar perfil';
      } finally {
        this.isLoading = false;
      }
    }
  }

  async excluirPerfil(perfil: Perfil) {
    if (confirm(`Tem certeza que deseja excluir o perfil "${perfil.nome}"?`)) {
      try {
        await this.perfilService.excluirPerfil(perfil.id);
        this.sucesso = 'Perfil excluído com sucesso!';
        await this.carregarPerfis();
      } catch (error: any) {
        this.erro = error.message || 'Erro ao excluir perfil';
      }
    }
  }

  limparMensagens() {
    this.erro = null;
    this.sucesso = null;
  }

  getPermissoesTexto(perfil: Perfil): string {
    return perfil.permissoes.map(p => p.nome).join(', ');
  }
}