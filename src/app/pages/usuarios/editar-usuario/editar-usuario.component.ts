import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UsuarioService } from '../../../core/services/usuario.service';
import { Usuario } from '../../../models/usuario/usuario';
import { Perfil } from '../../../models/usuario/perfil';

@Component({
  selector: 'app-editar-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './editar-usuario.component.html',
  styleUrls: ['./editar-usuario.component.scss'],
})
export class EditarUsuarioComponent implements OnInit {
  editarForm: FormGroup;
  alterarSenhaForm: FormGroup;

  usuario: Usuario | null = null;
  usuarioId: number = 0;

  isLoading = false;
  isLoadingUser = false;
  erro: string | null = null;
  sucesso: string | null = null;

  showPassword = false;
  showConfirmPassword = false;
  showCurrentPassword = false;

  perfisDisponiveis: Perfil[] = [];
  perfisSelecionados: number[] = [];

  // Controle de abas
  activeTab: 'dados' | 'senha' = 'dados';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private usuarioService: UsuarioService
  ) {
    this.editarForm = this.createEditarForm();
    this.alterarSenhaForm = this.createAlterarSenhaForm();
  }

  ngOnInit() {
    this.usuarioId = parseInt(this.route.snapshot.params['id']);
    this.carregarDados();
  }

  private createEditarForm(): FormGroup {
    return this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      login: ['', [Validators.required, Validators.email]],
      perfis: [[], [Validators.required, this.minArrayLength(1)]]
    });
  }

  private createAlterarSenhaForm(): FormGroup {
    return this.fb.group({
      senhaAtual: ['', [Validators.required]],
      novaSenha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarNovaSenha: ['', [Validators.required]]
    }, {
      validators: [this.passwordMatchValidator]
    });
  }

  private passwordMatchValidator(control: AbstractControl): { [key: string]: any } | null {
    const novaSenha = control.get('novaSenha');
    const confirmarNovaSenha = control.get('confirmarNovaSenha');

    if (novaSenha && confirmarNovaSenha && novaSenha.value !== confirmarNovaSenha.value) {
      confirmarNovaSenha.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  private minArrayLength(min: number) {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (control.value && control.value.length >= min) {
        return null;
      }
      return { minArrayLength: true };
    };
  }

  async carregarDados() {
    await Promise.all([
      this.carregarUsuario(),
      this.carregarPerfis()
    ]);
  }

  async carregarUsuario() {
    this.isLoadingUser = true;
    this.erro = null;

    try {
      this.usuario = await this.usuarioService.obterUsuarioPorId(this.usuarioId);
      this.preencherFormulario();
    } catch (error: any) {
      this.erro = error.message || 'Erro ao carregar dados do usuário';
      // Se não conseguir carregar o usuário, volta para a lista
      setTimeout(() => {
        this.router.navigate(['/usuarios/lista']);
      }, 3000);
    } finally {
      this.isLoadingUser = false;
    }
  }

  async carregarPerfis() {
    try {
      this.perfisDisponiveis = await this.usuarioService.obterPerfis();
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
    }
  }

  preencherFormulario() {
    if (!this.usuario) return;

    // Preenche os dados básicos
    this.editarForm.patchValue({
      nome: this.usuario.getDisplayName(),
      login: this.usuario.login
    });

    // Seleciona os perfis atuais do usuário
    this.perfisSelecionados = this.usuario.perfis.map(p => p.id);
    this.editarForm.patchValue({ perfis: this.perfisSelecionados });
  }

  // Controle de abas
  setActiveTab(tab: 'dados' | 'senha') {
    this.activeTab = tab;
    this.limparMensagens();
  }

  // Validação de campos
  isFieldInvalid(formName: 'dados' | 'senha', fieldName: string): boolean {
    const form = formName === 'dados' ? this.editarForm : this.alterarSenhaForm;
    const field = form.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  // Controle de visibilidade das senhas
  toggleCurrentPasswordVisibility() {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Manipulação de perfis
  onPerfilChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const perfilId = parseInt(checkbox.value);

    if (checkbox.checked) {
      if (!this.perfisSelecionados.includes(perfilId)) {
        this.perfisSelecionados.push(perfilId);
      }
    } else {
      const index = this.perfisSelecionados.indexOf(perfilId);
      if (index > -1) {
        this.perfisSelecionados.splice(index, 1);
      }
    }

    this.editarForm.patchValue({ perfis: this.perfisSelecionados });
  }

  isPerfilSelecionado(perfilId: number): boolean {
    return this.perfisSelecionados.includes(perfilId);
  }

  // Ações principais
  async salvarDados() {
    if (this.editarForm.valid && this.usuario) {
      this.isLoading = true;
      this.limparMensagens();

      try {
        const formData = this.editarForm.value;

        const dadosAtualizacao = {
          login: formData.login,
          perfisIds: this.perfisSelecionados
        };

        await this.usuarioService.atualizarUsuario(this.usuario.id, dadosAtualizacao);
        this.sucesso = 'Dados atualizados com sucesso!';

        // Recarrega os dados atualizados
        await this.carregarUsuario();

      } catch (error: any) {
        this.erro = error.message || 'Erro ao atualizar dados do usuário';
      } finally {
        this.isLoading = false;
      }
    } else {
      this.editarForm.markAllAsTouched();
    }
  }

  async alterarSenha() {
    if (this.alterarSenhaForm.valid && this.usuario) {
      this.isLoading = true;
      this.limparMensagens();

      try {
        const formData = this.alterarSenhaForm.value;

        await this.usuarioService.alterarSenha(
          this.usuario.id,
          formData.senhaAtual,
          formData.novaSenha
        );

        this.sucesso = 'Senha alterada com sucesso!';
        this.alterarSenhaForm.reset();

      } catch (error: any) {
        this.erro = error.message || 'Erro ao alterar senha';
      } finally {
        this.isLoading = false;
      }
    } else {
      this.alterarSenhaForm.markAllAsTouched();
    }
  }

  // Navegação
  voltarParaLista() {
    this.router.navigate(['/usuarios/lista']);
  }

  // Utilitários
  limparMensagens() {
    this.erro = null;
    this.sucesso = null;
  }

  getNomeCompleto(): string {
    return this.usuario?.getDisplayName() || 'Usuário';
  }

  getDataCadastro(): string {
    if (!this.usuario) return '';

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(this.usuario.criadoEm));
  }
}