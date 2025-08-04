import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { UsuarioService } from '../../../core/services/usuario.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Usuario } from '../../../models/usuario/usuario';
import { Pessoa, PessoaTipo } from '../../../models/pessoa/pessoa';
import { Perfil } from '../../../models/usuario/perfil';
import { Endereco, EnderecoTipo } from '../../../models/pessoa/endereco';
import { Contato, ContatoTipo } from '../../../models/pessoa/contato';

@Component({
  selector: 'app-cadastro-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cadastro-usuario.component.html',
  styleUrls: ['./cadastro-usuario.component.scss'],
})
export class CadastroUsuarioComponent implements OnInit {
  // Injeções
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private authService = inject(AuthService);

  // Signals para estado
  isLoading = signal(false);
  isEditing = signal(false);
  usuarioId = signal<number | null>(null);

  // Estados de UI
  showAlert = signal(false);
  alertMessage = signal('');
  alertType = signal<'success' | 'error' | 'info'>('info');

  // Signal para forçar recálculo das validações
  formState = signal(0);

  // Dados
  perfisDisponiveis = signal<Perfil[]>([]);
  usuario = signal<Usuario | null>(null);

  // Controle de abas
  activeTab = signal<'usuario' | 'pessoa' | 'enderecos' | 'contatos'>(
    'usuario'
  );

  // Form principal
  usuarioForm: FormGroup;

  // Computed properties
  isFormValid = computed(() => {
    this.formState(); // Força reatividade baseado nas mudanças do form
    return this.usuarioForm?.valid || false;
  });
  formTitle = computed(() =>
    this.isEditing() ? 'Editar Usuário' : 'Novo Usuário'
  );

  // Validações por aba (agora como computed signals)
  usuarioTabErrors = computed(() => {
    this.formState();
    return this.getTabErrorsInternal('usuario');
  });

  pessoaTabErrors = computed(() => {
    this.formState();
    return this.getTabErrorsInternal('pessoa');
  });

  enderecosTabErrors = computed(() => {
    this.formState();
    return this.getTabErrorsInternal('enderecos');
  });

  contatosTabErrors = computed(() => {
    this.formState();
    return this.getTabErrorsInternal('contatos');
  });

  // Total de erros
  totalErrors = computed(
    () =>
      this.usuarioTabErrors().length +
      this.pessoaTabErrors().length +
      this.enderecosTabErrors().length +
      this.contatosTabErrors().length
  );

  // Tipos disponíveis
  tiposPessoa: { value: PessoaTipo; label: string }[] = [
    { value: 'PF', label: 'Pessoa Física' },
    { value: 'PJ', label: 'Pessoa Jurídica' },
  ];

  tiposEndereco: { value: EnderecoTipo; label: string }[] = [
    { value: 'residencial', label: 'Residencial' },
    { value: 'comercial', label: 'Comercial' },
    { value: 'correspondencia', label: 'Correspondência' },
    { value: 'cobranca', label: 'Cobrança' },
    { value: 'entrega', label: 'Entrega' },
  ];

  tiposContato: { value: ContatoTipo; label: string }[] = [
    { value: 'telefone', label: 'Telefone' },
    { value: 'celular', label: 'Celular' },
    { value: 'email', label: 'E-mail' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'fax', label: 'Fax' },
    { value: 'site', label: 'Site' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'outro', label: 'Outro' },
  ];

  constructor() {
    this.usuarioForm = this.createForm();
    this.setupFormSubscriptions();
  }

  ngOnInit() {
    this.loadInitialData();
    this.checkEditMode();
  }

  private setupFormSubscriptions() {
    // Escuta mudanças no formulário para atualizar validações
    this.usuarioForm.valueChanges.subscribe(() => {
      this.formState.update((state) => state + 1);
    });

    this.usuarioForm.statusChanges.subscribe(() => {
      this.formState.update((state) => state + 1);
    });

    effect(() => {
      console.log('📊 formState mudou:', this.formState());
      console.log('✅ Form válido:', this.isFormValid());
      console.log('🔢 Total de erros:', this.totalErrors());
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // Dados do usuário
      login: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', [Validators.required]],
      perfis: [[], [Validators.required]],
      ativo: [true],

      // Dados da pessoa
      pessoa: this.fb.group({
        tipo: ['PF', [Validators.required]],
        nome: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        ativo: [true],

        // Pessoa Física
        documento: [''], // CPF
        dataNascimento: [''],

        // Pessoa Jurídica
        cnpj: [''],
        razaoSocial: [''],
        nomeFantasia: [''],
        inscricaoEstadual: [''],
        inscricaoMunicipal: [''],
        dataAbertura: [''],
      }),

      // Endereços
      enderecos: this.fb.array([]),

      // Contatos
      contatos: this.fb.array([]),
    });
  }

  // Getters para FormArrays
  get enderecosArray(): FormArray {
    return this.usuarioForm.get('enderecos') as FormArray;
  }

  get contatosArray(): FormArray {
    return this.usuarioForm.get('contatos') as FormArray;
  }

  get pessoaForm(): FormGroup {
    return this.usuarioForm.get('pessoa') as FormGroup;
  }

  // Computed para tipo de pessoa
  get tipoPessoa(): PessoaTipo {
    return this.pessoaForm.get('tipo')?.value || 'PF';
  }

  private async loadInitialData() {
    try {
      const perfis = await this.usuarioService.obterPerfis();
      this.perfisDisponiveis.set(perfis);
    } catch (error) {
      this.showErrorAlert('Erro ao carregar perfis disponíveis');
    }
  }

  private checkEditMode() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.usuarioId.set(+id);
      this.isEditing.set(true);
      this.loadUsuario(+id);
    } else {
      // Adicionar um endereço e contato padrão para novo usuário
      this.addEndereco();
      this.addContato();
    }
  }

  private async loadUsuario(id: number) {
    this.isLoading.set(true);
    try {
      const usuario = await this.usuarioService.obterUsuarioPorId(id);
      this.usuario.set(usuario);
      this.populateForm(usuario);
    } catch (error) {
      this.showErrorAlert('Erro ao carregar dados do usuário');
    } finally {
      this.isLoading.set(false);
    }
  }

  private populateForm(usuario: Usuario) {
    // Dados básicos do usuário
    this.usuarioForm.patchValue({
      login: usuario.login,
      perfis: usuario.perfis.map((p) => p.id),
      pessoa: {
        tipo: usuario.pessoa.tipo,
        nome: usuario.pessoa.nome,
        email: usuario.pessoa.email,
        documento: usuario.pessoa.documento,
        dataNascimento: usuario.pessoa.dataNascimento,
        razaoSocial: usuario.pessoa.razaoSocial,
        nomeFantasia: usuario.pessoa.nomeFantasia,
        inscricaoEstadual: usuario.pessoa.inscricaoEstadual,
        inscricaoMunicipal: usuario.pessoa.inscricaoMunicipal,
        dataAbertura: usuario.pessoa.dataAbertura,
        ativo: usuario.pessoa.ativo,
      },
    });

    // Endereços
    usuario.pessoa.enderecos?.forEach((endereco) => {
      this.enderecosArray.push(this.createEnderecoForm(endereco));
    });

    // Contatos
    usuario.pessoa.contatos?.forEach((contato) => {
      this.contatosArray.push(this.createContatoForm(contato));
    });

    // Remover validação de senha obrigatória na edição
    this.usuarioForm.get('senha')?.clearValidators();
    this.usuarioForm.get('confirmarSenha')?.clearValidators();
    this.usuarioForm.get('senha')?.updateValueAndValidity();
    this.usuarioForm.get('confirmarSenha')?.updateValueAndValidity();
  }

  // Gerenciamento de endereços
  createEnderecoForm(endereco?: Endereco): FormGroup {
    const form = this.fb.group({
      id: [endereco?.id || 0],
      tipo: [endereco?.tipo || 'residencial', [Validators.required]],
      principal: [endereco?.principal || false],
      ativo: [endereco?.ativo !== undefined ? endereco.ativo : true],
      cep: [endereco?.cep || ''],
      logradouro: [endereco?.logradouro || '', [Validators.required]],
      numero: [endereco?.numero || ''],
      complemento: [endereco?.complemento || ''],
      bairro: [endereco?.bairro || '', [Validators.required]],
      cidade: [endereco?.cidade || '', [Validators.required]],
      estado: [endereco?.estado || '', [Validators.required]],
      pais: [endereco?.pais || 'Brasil'],
      observacoes: [endereco?.observacoes || ''],
    });

    // Subscrever às mudanças para trigger da reatividade
    form.valueChanges.subscribe(() =>
      this.formState.update((state) => state + 1)
    );
    form.statusChanges.subscribe(() =>
      this.formState.update((state) => state + 1)
    );

    return form;
  }

  addEndereco() {
    this.enderecosArray.push(this.createEnderecoForm());
  }

  removeEndereco(index: number) {
    this.enderecosArray.removeAt(index);
    this.formState.update((state) => state + 1); // Force update
  }

  // Gerenciamento de contatos
  createContatoForm(contato?: Contato): FormGroup {
    const form = this.fb.group({
      id: [contato?.id || 0],
      tipo: [contato?.tipo || 'telefone', [Validators.required]],
      valor: [contato?.valor || '', [Validators.required]],
      descricao: [contato?.descricao || ''],
      principal: [contato?.principal || false],
      ativo: [contato?.ativo !== undefined ? contato.ativo : true],
      observacoes: [contato?.observacoes || ''],
    });

    // Subscrever às mudanças para trigger da reatividade
    form.valueChanges.subscribe(() =>
      this.formState.update((state) => state + 1)
    );
    form.statusChanges.subscribe(() =>
      this.formState.update((state) => state + 1)
    );

    return form;
  }

  addContato() {
    this.contatosArray.push(this.createContatoForm());
  }

  removeContato(index: number) {
    this.contatosArray.removeAt(index);
    this.formState.update((state) => state + 1); // Force update
  }

  // Navegação entre abas
  setActiveTab(tab: 'usuario' | 'pessoa' | 'enderecos' | 'contatos') {
    this.activeTab.set(tab);
  }

  private formToUsuario(): Usuario {
    const formData = this.usuarioForm.value;
    const perfis: Perfil[] = formData.perfis.map((perfilId: number) => {
      const perfil = this.perfisDisponiveis().find((p) => p.id === perfilId);
      if (!perfil) {
        throw new Error(`Perfil com ID ${perfilId} não encontrado`); // 🆕 VALIDAÇÃO
      }
      return perfil;
    });

    var enderecos = formData.enderecos.map((enderecoData: any) => {
      const end: Endereco = new Endereco();
      end.logradouro = enderecoData.logradouro;
      end.numero = enderecoData.numero;
      end.complemento = enderecoData.complemento;
      end.bairro = enderecoData.bairro;
      end.cidade = enderecoData.cidade;
      end.estado = enderecoData.estado;
      end.pais = enderecoData.pais || 'Brasil';
      end.cep = enderecoData.cep;
      end.tipo = enderecoData.tipo || 'residencial';
      end.principal = enderecoData.principal || false;
      end.ativo = enderecoData.ativo !== undefined ? enderecoData.ativo : true;

      return end;
    });

    var contatos = formData.contatos.map((contatoData: any) => {
      const cont: Contato = new Contato();

      cont.ativo = contatoData.ativo !== undefined ? contatoData.ativo : true;
      cont.principal = contatoData.principal || false;
      cont.tipo = contatoData.tipo || 'telefone';
      cont.valor = contatoData.valor;
      cont.descricao = contatoData.descricao;
      cont.observacoes = contatoData.observacoes;

      return cont;
    });

    const pessoa: Pessoa = new Pessoa();

    pessoa.tipo = formData.pessoa.tipo;
    pessoa.nome = formData.pessoa.nome;
    pessoa.email = formData.pessoa.email;
    pessoa.ativo =
      formData.pessoa.ativo !== undefined ? formData.pessoa.ativo : true;
    pessoa.documento = formData.pessoa.documento;
    pessoa.dataNascimento = formData.pessoa.dataNascimento
      ? new Date(formData.pessoa.dataNascimento)
      : null;
    pessoa.razaoSocial = formData.pessoa.razaoSocial;
    pessoa.nomeFantasia = formData.pessoa.nomeFantasia;
    pessoa.inscricaoEstadual = formData.pessoa.inscricaoEstadual || '';
    pessoa.inscricaoMunicipal = formData.pessoa.inscricaoMunicipal || '';
    pessoa.dataAbertura = formData.pessoa.dataAbertura
      ? new Date(formData.pessoa.dataAbertura)
      : null;
    pessoa.contatos = contatos;
    pessoa.enderecos = enderecos;

    var usuario: Usuario = new Usuario();

    usuario.login = formData.login;
    usuario.senha = formData.senha;
    usuario.perfis = perfis;
    usuario.pessoa = pessoa;

    return usuario;
  }

  // Ações do formulário
  async onSubmit() {
    if (!this.usuarioForm.valid) {
      this.markFormGroupTouched(this.usuarioForm);
      this.showErrorAlert('Por favor, corrija os erros no formulário');
      return;
    }

    // Validação de senhas
    if (!this.isEditing()) {
      const senha = this.usuarioForm.get('senha')?.value;
      const confirmarSenha = this.usuarioForm.get('confirmarSenha')?.value;

      if (senha !== confirmarSenha) {
        this.showErrorAlert('As senhas não coincidem');
        return;
      }
    }

    this.isLoading.set(true);

    try {
      const usuario = this.formToUsuario();
      console.log('📤 Enviando dados do usuário:', usuario);

      if (this.isEditing()) {
        // Map CreateUsuarioDto to Partial<Usuario> for update
        const usuarioAtual: Usuario | null = this.usuario();
        const dadosAtualizacao: Partial<Usuario> = {
          id: usuarioAtual?.id,
          login: usuario.login,
          perfis: usuario.perfis,
          pessoa: {
            ...usuario.pessoa,
            id: usuarioAtual?.pessoa.id || 0,
            criadoEm: usuarioAtual?.pessoa.criadoEm || new Date(),
            atualizadoEm: usuarioAtual?.pessoa.atualizadoEm || new Date(),
          },
        };
        await this.usuarioService.atualizarUsuario(
          this.usuarioId()!,
          dadosAtualizacao
        );
        this.showSuccessAlert('Usuário atualizado com sucesso!');
      } else {
        await this.usuarioService.criarUsuario(usuario);
        this.showSuccessAlert('Usuário criado com sucesso!');
      }

      // Aguardar um pouco antes de redirecionar
      setTimeout(() => {
        this.router.navigate(['/usuarios/lista']);
      }, 2000);
    } catch (error: any) {
      console.error('❌ Erro ao salvar usuário:', error);
      this.showErrorAlert(error.message || 'Erro ao salvar usuário');
    } finally {
      this.isLoading.set(false);
    }
  }

  cancel() {
    this.router.navigate(['/usuarios/lista']);
  }

  // Utilitários
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach((arrayControl) => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          }
        });
      }
    });
  }

  isFieldInvalid(fieldName: string, formGroup?: FormGroup): boolean {
    const form = formGroup || this.usuarioForm;
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string, formGroup?: FormGroup): string {
    const form = formGroup || this.usuarioForm;
    const field = form.get(fieldName);

    if (field?.errors) {
      if (field.errors['required']) return 'Campo obrigatório';
      if (field.errors['email']) return 'E-mail inválido';
      if (field.errors['minlength'])
        return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['maxlength'])
        return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
    }

    return '';
  }

  // Validações por aba (método interno)
  private getTabErrorsInternal(tab: string): string[] {
    const errors: string[] = [];

    if (!this.usuarioForm) return errors;

    switch (tab) {
      case 'usuario':
        if (this.usuarioForm.get('login')?.invalid) {
          errors.push('Login/E-mail é obrigatório e deve ser válido');
        }
        if (this.usuarioForm.get('perfis')?.invalid) {
          errors.push('Selecione pelo menos um perfil');
        }
        if (!this.isEditing() && this.usuarioForm.get('senha')?.invalid) {
          errors.push('Senha é obrigatória (mínimo 6 caracteres)');
        }
        if (
          !this.isEditing() &&
          this.usuarioForm.get('confirmarSenha')?.invalid
        ) {
          errors.push('Confirmação de senha é obrigatória');
        }
        if (!this.isEditing()) {
          const senha = this.usuarioForm.get('senha')?.value;
          const confirmarSenha = this.usuarioForm.get('confirmarSenha')?.value;
          const senhaField = this.usuarioForm.get('senha');
          const confirmarSenhaField = this.usuarioForm.get('confirmarSenha');

          if (senha && confirmarSenha && senha !== confirmarSenha) {
            errors.push('As senhas não coincidem');
          }
        }
        break;

      case 'pessoa':
        const pessoaForm = this.usuarioForm.get('pessoa') as FormGroup;

        if (pessoaForm?.get('nome')?.invalid) {
          errors.push('Nome/Razão Social é obrigatório');
        }
        if (pessoaForm?.get('tipo')?.invalid) {
          errors.push('Tipo de pessoa é obrigatório');
        }
        break;

      case 'enderecos':
        const enderecosArray = this.usuarioForm.get('enderecos') as FormArray;

        enderecosArray?.controls.forEach((endereco, index) => {
          const enderecoForm = endereco as FormGroup;

          if (enderecoForm.get('logradouro')?.invalid) {
            errors.push(`Endereço ${index + 1}: Logradouro é obrigatório`);
          }
          if (enderecoForm.get('bairro')?.invalid) {
            errors.push(`Endereço ${index + 1}: Bairro é obrigatório`);
          }
          if (enderecoForm.get('cidade')?.invalid) {
            errors.push(`Endereço ${index + 1}: Cidade é obrigatória`);
          }
          if (enderecoForm.get('estado')?.invalid) {
            errors.push(`Endereço ${index + 1}: Estado é obrigatório`);
          }
        });
        break;

      case 'contatos':
        const contatosArray = this.usuarioForm.get('contatos') as FormArray;
        contatosArray?.controls.forEach((contato, index) => {
          const contatoForm = contato as FormGroup;
          if (contatoForm.get('tipo')?.invalid) {
            errors.push(`Contato ${index + 1}: Tipo é obrigatório`);
          }
          if (contatoForm.get('valor')?.invalid) {
            errors.push(`Contato ${index + 1}: Valor é obrigatório`);
          }
        });
        break;
    }

    return errors;
  }

  // Verifica se uma aba tem erros
  hasTabErrors(tab: string): boolean {
    switch (tab) {
      case 'usuario':
        return this.usuarioTabErrors().length > 0;
      case 'pessoa':
        return this.pessoaTabErrors().length > 0;
      case 'enderecos':
        return this.enderecosTabErrors().length > 0;
      case 'contatos':
        return this.contatosTabErrors().length > 0;
      default:
        return false;
    }
  }

  // Alerts
  private showSuccessAlert(message: string) {
    this.alertMessage.set(message);
    this.alertType.set('success');
    this.showAlert.set(true);
    this.autoHideAlert();
  }

  private showErrorAlert(message: string) {
    this.alertMessage.set(message);
    this.alertType.set('error');
    this.showAlert.set(true);
    this.autoHideAlert();
  }

  private autoHideAlert() {
    setTimeout(() => {
      this.showAlert.set(false);
    }, 5000);
  }

  hideAlert() {
    this.showAlert.set(false);
  }
}
