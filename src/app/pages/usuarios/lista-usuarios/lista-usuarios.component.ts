import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { UsuarioService } from '../../../core/services/usuario.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Usuario } from '../../../models/usuario/usuario';
import { Perfil } from '../../../models/usuario/perfil';
import { Pessoa } from '../../../models/pessoa/pessoa';

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './lista-usuarios.component.html',
  styleUrls: ['./lista-usuarios.component.scss'],
})
export class ListaUsuariosComponent implements OnInit {
  // Injeções
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private authService = inject(AuthService);

  // Signals para estado reativo
  usuarios = signal<Usuario[]>([]);
  perfisDisponiveis = signal<Perfil[]>([]);
  currentUser = signal<Usuario | null>(null);
  isLoading = signal(false);
  filtrosExpanded = signal(false);

  // Estados de UI
  showAlert = signal(false);
  alertMessage = signal('');
  alertType = signal<'success' | 'error' | 'info'>('info');

  // Modal de confirmação
  showDeleteModal = signal(false);
  usuarioParaExcluir = signal<Usuario | null>(null);

  // Dropdowns
  activeDropdown = signal<number | null>(null);

  // Paginação com signals
  totalRegistros = signal(0);
  pageSize = signal(10);
  pageIndex = signal(0);

  // Form reativo
  filtroForm: FormGroup;

  // Computed properties
  hasUsuarios = computed(() => this.usuarios().length > 0);
  showPagination = computed(() => this.totalRegistros() > this.pageSize());
  totalPages = computed(() => Math.ceil(this.totalRegistros() / this.pageSize()));
  startRecord = computed(() => this.pageIndex() * this.pageSize() + 1);
  endRecord = computed(() => Math.min((this.pageIndex() + 1) * this.pageSize(), this.totalRegistros()));

  constructor() {
    this.filtroForm = this.createFiltroForm();
    this.currentUser.set(this.authService.getCurrentUser()());
  }

  ngOnInit() {
    this.carregarDados();
  }

  private createFiltroForm(): FormGroup {
    return this.fb.group({
      nome: [''],
      login: [''],
      perfilId: [''],
    });
  }

  async carregarDados() {
    await Promise.all([this.carregarUsuarios(), this.carregarPerfis()]);
  }

  async carregarUsuarios() {
    this.isLoading.set(true);

    try {
      const filtros = this.filtroForm.value;

      let perfil: Perfil;
      if (filtros.perfilId) {
        perfil = new Perfil();
        perfil.id = filtros.perfilId;
      }

      const usuarioFiltro = {
        login: filtros.login,
        pessoa: new Pessoa(),
        perfis: filtros.perfilId ? [perfil] : undefined,
      };

      usuarioFiltro.pessoa.nome = filtros.nome || null;

      const response = await this.usuarioService.buscarUsuarios(
        usuarioFiltro,
        this.pageIndex(),
        { id: 'ASC' },
        this.pageSize()
      );

      this.usuarios.set(response.registros);
      this.totalRegistros.set(response.quantidadeNaPagina);
    } catch (error: any) {
      this.showErrorAlert(error.message || 'Erro ao carregar usuários');
    } finally {
      this.isLoading.set(false);
    }
  }

  async carregarPerfis() {
    try {
      const perfis = await this.usuarioService.obterPerfis();
      this.perfisDisponiveis.set(perfis);
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
    }
  }

  // Métodos de permissão usando computed
  podeEditar = computed(() => {
    const user = this.currentUser();
    return user ? Usuario.hasPermission(user, 'EDITAR_USUARIO') : false;
  });

  podeExcluir = computed(() => {
    const user = this.currentUser();
    return user ? Usuario.hasPermission(user, 'EXCLUIR_USUARIO') : false;
  });

  podeCadastrar = computed(() => {
    const user = this.currentUser();
    return user ? Usuario.hasPermission(user, 'CADASTRAR_USUARIO') : false;
  });

  podeAlterarStatus = computed(() => {
    const user = this.currentUser();
    return user ? Usuario.hasPermission(user, 'ALTERAR_STATUS_USUARIO') : false;
  });

  // Ações
  novoUsuario() {
    this.router.navigate(['/usuarios/cadastro']);
  }

  editarUsuario(usuario: Usuario) {
    this.router.navigate(['/usuarios/editar', usuario.id]);
  }

  confirmarExclusao(usuario: Usuario) {
    this.usuarioParaExcluir.set(usuario);
    this.showDeleteModal.set(true);
  }

  cancelarExclusao() {
    this.showDeleteModal.set(false);
    this.usuarioParaExcluir.set(null);
  }

  async excluirUsuario() {
    const usuario = this.usuarioParaExcluir();
    if (!usuario) return;

    try {
      // await this.usuarioService.excluirUsuario(usuario.id);
      this.showSuccessAlert('Usuário excluído com sucesso!');
      this.carregarUsuarios();
    } catch (error: any) {
      this.showErrorAlert(error.message || 'Erro ao excluir usuário');
    } finally {
      this.showDeleteModal.set(false);
      this.usuarioParaExcluir.set(null);
    }
  }

  async alterarStatus(usuario: Usuario) {
    try {
      const novoStatus = !(usuario as any).ativo;
      await this.usuarioService.alterarStatusUsuario(usuario.id, novoStatus);
      this.showSuccessAlert(`Usuário ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`);
      this.carregarUsuarios();
    } catch (error: any) {
      this.showErrorAlert(error.message || 'Erro ao alterar status do usuário');
    }
  }

  // Filtros
  toggleFiltros() {
    this.filtrosExpanded.update(expanded => !expanded);
  }

  aplicarFiltros() {
    this.pageIndex.set(0);
    this.carregarUsuarios();
  }

  limparFiltros() {
    this.filtroForm.reset();
    this.aplicarFiltros();
  }

  // Paginação
  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages()) {
      this.pageIndex.set(page);
      this.carregarUsuarios();
    }
  }

  changePageSize(size: number) {
    this.pageSize.set(size);
    this.pageIndex.set(0);
    this.carregarUsuarios();
  }

  // Dropdown management
  toggleDropdown(usuarioId: number) {
    const current = this.activeDropdown();
    this.activeDropdown.set(current === usuarioId ? null : usuarioId);
  }

  closeDropdown() {
    this.activeDropdown.set(null);
  }

  // TrackBy functions para performance
  trackByUsuarioId(index: number, usuario: Usuario): number {
    return usuario.id;
  }

  trackByPerfilId(index: number, perfil: Perfil): number {
    return perfil.id || 0;
  }

  // Utilitários
  getNomeCompleto(usuario: Usuario): string {
    return usuario.pessoa?.nome || usuario.login;
  }

  getUserInitials(usuario: Usuario): string {
    const name = this.getNomeCompleto(usuario);
    return name.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getPermissoesCount(usuario: Usuario): number {
    return Usuario.getPermissoes(usuario).length;
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