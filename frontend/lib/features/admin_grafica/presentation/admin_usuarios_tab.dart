import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/models/user_model.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/snackbar_util.dart';

class AdminUsuariosTab extends StatefulWidget {
  const AdminUsuariosTab({super.key});

  @override
  State<AdminUsuariosTab> createState() => _AdminUsuariosTabState();
}

class _AdminUsuariosTabState extends State<AdminUsuariosTab> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _selectedFilter = 'Todos'; // 'Todos', 'Clientes', 'Gerentes', 'Humano'
  bool _isLoading = false;
  List<UserModel> _users = [];
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadUsers();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadUsers() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final users = await AuthService().fetchUsers();
      if (mounted) {
        setState(() {
          _users = users;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  List<UserModel> get _filteredUsers {
    return _users.where((user) {
      // 1. Filtro de pesquisa por texto
      final query = _searchQuery.toLowerCase().trim();
      final matchesQuery = query.isEmpty ||
          user.nome.toLowerCase().contains(query) ||
          (user.email != null && user.email!.toLowerCase().contains(query)) ||
          user.telefone.contains(query);

      if (!matchesQuery) return false;

      // 2. Filtro de categorias
      if (_selectedFilter == 'Clientes') {
        return user.role == 'CLIENTE';
      } else if (_selectedFilter == 'Gerentes') {
        return user.role == 'GERENTE';
      } else if (_selectedFilter == 'Humano') {
        return user.atendimentoHumano;
      }

      return true;
    }).toList();
  }

  Future<void> _toggleAtendimentoHumano(UserModel user) async {
    final newAtendimento = !user.atendimentoHumano;
    
    // Atualização otimista
    setState(() {
      final idx = _users.indexWhere((u) => u.id == user.id);
      if (idx != -1) {
        _users[idx] = UserModel(
          id: user.id,
          nome: user.nome,
          email: user.email,
          telefone: user.telefone,
          role: user.role,
          fcmToken: user.fcmToken,
          enderecoCompleto: user.enderecoCompleto,
          enderecoReferencia: user.enderecoReferencia,
          atendimentoHumano: newAtendimento,
        );
      }
    });

    try {
      await AuthService().updateUser(
        user.id,
        nome: user.nome,
        email: user.email ?? '',
        telefone: user.telefone,
        role: user.role,
        atendimentoHumano: newAtendimento,
        enderecoCompleto: user.enderecoCompleto,
        enderecoReferencia: user.enderecoReferencia,
      );
      if (mounted) {
        final mode = newAtendimento ? 'Humano (IA desativada)' : 'Automação IA';
        SnackbarUtil.showSuccess(context, 'Modo de atendimento de ${user.nome} alterado para: $mode');
      }
    } catch (e) {
      // Reverter atualização otimista em caso de erro
      if (mounted) {
        setState(() {
          final idx = _users.indexWhere((u) => u.id == user.id);
          if (idx != -1) {
            _users[idx] = user;
          }
        });
        SnackbarUtil.showError(context, 'Erro ao salvar alteração: $e');
      }
    }
  }

  Future<void> _alterarRole(UserModel user, String newRole) async {
    if (user.role == newRole) return;

    try {
      final updated = await AuthService().updateUser(
        user.id,
        nome: user.nome,
        email: user.email ?? '',
        telefone: user.telefone,
        role: newRole,
        atendimentoHumano: user.atendimentoHumano,
        enderecoCompleto: user.enderecoCompleto,
        enderecoReferencia: user.enderecoReferencia,
      );

      if (mounted) {
        setState(() {
          final idx = _users.indexWhere((u) => u.id == user.id);
          if (idx != -1) {
            _users[idx] = updated;
          }
        });
        SnackbarUtil.showSuccess(context, 'Nível de acesso de ${user.nome} alterado para $newRole.');
      }
    } catch (e) {
      if (mounted) {
        SnackbarUtil.showError(context, 'Erro ao alterar nível de acesso: $e');
      }
    }
  }

  Future<void> _abrirEdicaoUsuario(UserModel user) async {
    final nomeController = TextEditingController(text: user.nome);
    final emailController = TextEditingController(text: user.email ?? '');
    final telefoneController = TextEditingController(text: user.telefone);
    final enderecoCompletoController = TextEditingController(text: user.enderecoCompleto ?? '');
    final enderecoReferenciaController = TextEditingController(text: user.enderecoReferencia ?? '');
    final senhaController = TextEditingController();
    
    final formKey = GlobalKey<FormState>();

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setStateDialog) {
          final isDark = Theme.of(context).brightness == Brightness.dark;
          
          return AlertDialog(
            title: Row(
              children: [
                const Icon(Icons.edit_note, color: AppColors.brandGreen, size: 26),
                const SizedBox(width: 10),
                Text(
                  'Editar Informações',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18),
                ),
              ],
            ),
            backgroundColor: Theme.of(context).colorScheme.surface,
            surfaceTintColor: Colors.transparent,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            content: SizedBox(
              width: 450,
              child: SingleChildScrollView(
                child: Form(
                  key: formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'DADOS BÁSICOS',
                        style: GoogleFonts.outfit(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: isDark ? AppColors.darkTextSecondary : AppColors.steel,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: nomeController,
                        decoration: const InputDecoration(
                          labelText: 'Nome Completo',
                          prefixIcon: Icon(Icons.person_outline, size: 18),
                        ),
                        validator: (val) => val == null || val.trim().isEmpty ? 'Nome é obrigatório.' : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: emailController,
                        decoration: const InputDecoration(
                          labelText: 'E-mail',
                          prefixIcon: Icon(Icons.mail_outline, size: 18),
                        ),
                        keyboardType: TextInputType.emailAddress,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: telefoneController,
                        decoration: const InputDecoration(
                          labelText: 'Telefone (WhatsApp)',
                          prefixIcon: Icon(Icons.phone_outlined, size: 18),
                          hintText: 'ex: 11999990000',
                        ),
                        keyboardType: TextInputType.phone,
                        validator: (val) => val == null || val.trim().isEmpty ? 'Telefone é obrigatório.' : null,
                      ),
                      const SizedBox(height: 20),
                      Text(
                        'ENDEREÇO DE ENTREGA',
                        style: GoogleFonts.outfit(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: isDark ? AppColors.darkTextSecondary : AppColors.steel,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: enderecoCompletoController,
                        maxLines: 2,
                        decoration: const InputDecoration(
                          labelText: 'Endereço Completo',
                          prefixIcon: Icon(Icons.home_outlined, size: 18),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: enderecoReferenciaController,
                        decoration: const InputDecoration(
                          labelText: 'Ponto de Referência',
                          prefixIcon: Icon(Icons.explore_outlined, size: 18),
                        ),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        'SEGURANÇA (OPCIONAL)',
                        style: GoogleFonts.outfit(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: isDark ? AppColors.darkTextSecondary : AppColors.steel,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: senhaController,
                        decoration: const InputDecoration(
                          labelText: 'Nova Senha (deixe vazio para não alterar)',
                          prefixIcon: Icon(Icons.lock_outline, size: 18),
                        ),
                        obscureText: true,
                      ),
                    ],
                  ),
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: Text(
                  'CANCELAR',
                  style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
                ),
              ),
              ElevatedButton(
                onPressed: () async {
                  if (!formKey.currentState!.validate()) return;
                  
                  try {
                    final updated = await AuthService().updateUser(
                      user.id,
                      nome: nomeController.text.trim(),
                      email: emailController.text.trim(),
                      telefone: telefoneController.text.trim(),
                      role: user.role,
                      atendimentoHumano: user.atendimentoHumano,
                      enderecoCompleto: enderecoCompletoController.text.trim().isEmpty ? null : enderecoCompletoController.text.trim(),
                      enderecoReferencia: enderecoReferenciaController.text.trim().isEmpty ? null : enderecoReferenciaController.text.trim(),
                      senha: senhaController.text.trim().isEmpty ? null : senhaController.text.trim(),
                    );

                    if (mounted && ctx.mounted) {
                      setState(() {
                        final idx = _users.indexWhere((u) => u.id == user.id);
                        if (idx != -1) {
                          _users[idx] = updated;
                        }
                      });
                      SnackbarUtil.showSuccess(context, 'Cadastro de ${updated.nome} atualizado com sucesso!');
                      Navigator.pop(ctx);
                    }
                  } catch (e) {
                    if (ctx.mounted) {
                      SnackbarUtil.showError(ctx, 'Erro ao atualizar cadastro: $e');
                    }
                  }
                },
                child: const Text('SALVAR ALTERAÇÕES'),
              ),
            ],
          );
        },
      ),
    );
  }

  Color _getAvatarBgColor(String name, String role) {
    if (role == 'GERENTE') return AppColors.brandTeal;
    final int val = name.runes.fold(0, (prev, elem) => prev + elem);
    final List<Color> colors = [
      AppColors.purple,
      AppColors.orange,
      AppColors.brandGreenDark,
      const Color(0xFF1E88E5),
      const Color(0xFFE53935),
      const Color(0xFF8E24AA),
      const Color(0xFFF4511E),
    ];
    return colors[val % colors.length];
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredUsers;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadUsers,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
          child: Column(
            children: [
              // ── BARRA DE PESQUISA & FILTROS ──
              Card(
                elevation: 0,
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: Theme.of(context).dividerColor),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Column(
                    children: [
                      TextField(
                        controller: _searchController,
                        onChanged: (val) => setState(() => _searchQuery = val),
                        decoration: InputDecoration(
                          hintText: 'Buscar por nome, e-mail ou telefone...',
                          prefixIcon: const Icon(Icons.search, color: Colors.grey),
                          suffixIcon: _searchQuery.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.clear),
                                  onPressed: () {
                                    _searchController.clear();
                                    setState(() => _searchQuery = '');
                                  },
                                )
                              : null,
                          filled: true,
                          fillColor: Theme.of(context).colorScheme.surface,
                          contentPadding: const EdgeInsets.symmetric(vertical: 8),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Theme.of(context).dividerColor),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Theme.of(context).dividerColor),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: ['Todos', 'Clientes', 'Gerentes', 'Humano'].map((filterName) {
                            final isSelected = _selectedFilter == filterName;
                            IconData icon;
                            Color activeColor;
                            switch (filterName) {
                              case 'Clientes':
                                icon = Icons.people_outline;
                                activeColor = AppColors.purple;
                                break;
                              case 'Gerentes':
                                icon = Icons.admin_panel_settings_outlined;
                                activeColor = AppColors.brandTeal;
                                break;
                              case 'Humano':
                                icon = Icons.record_voice_over_outlined;
                                activeColor = AppColors.orange;
                                break;
                              default:
                                icon = Icons.filter_list;
                                activeColor = AppColors.brandGreen;
                            }

                            return Padding(
                              padding: const EdgeInsets.only(right: 8.0),
                              child: FilterChip(
                                label: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      icon,
                                      size: 16,
                                      color: isSelected
                                          ? (filterName == 'Todos' ? AppColors.brandTealDeep : Colors.white)
                                          : (isDark ? AppColors.darkTextSecondary : AppColors.steel),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      filterName == 'Humano' ? 'Atend. Humano' : filterName,
                                      style: GoogleFonts.outfit(
                                        fontSize: 13,
                                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                        color: isSelected
                                            ? (filterName == 'Todos' ? AppColors.brandTealDeep : Colors.white)
                                            : (isDark ? AppColors.darkTextSecondary : AppColors.steel),
                                      ),
                                    ),
                                  ],
                                ),
                                selected: isSelected,
                                onSelected: (selected) {
                                  setState(() => _selectedFilter = filterName);
                                },
                                backgroundColor: Colors.transparent,
                                selectedColor: activeColor,
                                checkmarkColor: Colors.transparent,
                                showCheckmark: false,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(999),
                                  side: BorderSide(
                                    color: isSelected ? Colors.transparent : Theme.of(context).dividerColor,
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // ── CONTEÚDO PRINCIPAL ──
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : _errorMessage != null
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.error_outline, color: Colors.red, size: 48),
                                const SizedBox(height: 12),
                                Text(
                                  'Falha ao carregar usuários',
                                  style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  _errorMessage!,
                                  textAlign: TextAlign.center,
                                  style: TextStyle(color: Colors.grey[600]),
                                ),
                                const SizedBox(height: 16),
                                ElevatedButton(
                                  onPressed: _loadUsers,
                                  child: const Text('Tentar Novamente'),
                                ),
                              ],
                            ),
                          )
                        : filtered.isEmpty
                            ? Center(
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.people_alt_outlined, color: Colors.grey[400], size: 64),
                                    const SizedBox(height: 16),
                                    Text(
                                      'Nenhum usuário encontrado',
                                      style: GoogleFonts.outfit(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.grey[500],
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Experimente mudar os filtros ou a busca',
                                      style: TextStyle(fontSize: 13, color: Colors.grey[400]),
                                    ),
                                  ],
                                ),
                              )
                            : ListView.builder(
                                physics: const AlwaysScrollableScrollPhysics(),
                                itemCount: filtered.length,
                                itemBuilder: (context, index) {
                                  final user = filtered[index];
                                  final avatarColor = _getAvatarBgColor(user.nome, user.role);
                                  final initials = user.nome.trim().isEmpty
                                      ? '?'
                                      : user.nome.trim().split(' ').map((e) => e[0]).take(2).join().toUpperCase();

                                  final hasAddress = (user.enderecoCompleto != null && user.enderecoCompleto!.isNotEmpty);

                                  return Card(
                                    margin: const EdgeInsets.only(bottom: 12),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                      side: BorderSide(color: Theme.of(context).dividerColor),
                                    ),
                                    child: ExpansionTile(
                                      leading: CircleAvatar(
                                        backgroundColor: avatarColor,
                                        child: Text(
                                          initials,
                                          style: GoogleFonts.outfit(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 14,
                                          ),
                                        ),
                                      ),
                                      title: Row(
                                        children: [
                                          Expanded(
                                            child: Text(
                                              user.nome,
                                              style: GoogleFonts.outfit(
                                                fontWeight: FontWeight.w600,
                                                fontSize: 15,
                                              ),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          // Badge de Cargo
                                          _buildRoleBadge(user.role),
                                        ],
                                      ),
                                      subtitle: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const SizedBox(height: 4),
                                          Row(
                                            children: [
                                              const Icon(Icons.phone_outlined, size: 13, color: Colors.grey),
                                              const SizedBox(width: 4),
                                              Text(
                                                user.telefone,
                                                style: TextStyle(
                                                  fontSize: 12,
                                                  color: isDark ? AppColors.darkTextSecondary : AppColors.slate,
                                                ),
                                              ),
                                              if (user.email != null && user.email!.isNotEmpty) ...[
                                                const SizedBox(width: 10),
                                                const Icon(Icons.mail_outline, size: 13, color: Colors.grey),
                                                const SizedBox(width: 4),
                                                Expanded(
                                                  child: Text(
                                                    user.email!,
                                                    style: TextStyle(
                                                      fontSize: 12,
                                                      color: isDark ? AppColors.darkTextSecondary : AppColors.slate,
                                                    ),
                                                    overflow: TextOverflow.ellipsis,
                                                  ),
                                                ),
                                              ],
                                            ],
                                          ),
                                          const SizedBox(height: 6),
                                          // Status do Atendimento Humano
                                          _buildAtendimentoBadge(user.atendimentoHumano),
                                        ],
                                      ),
                                      shape: const Border(),
                                      collapsedShape: const Border(),
                                      childrenPadding: const EdgeInsets.all(16),
                                      expandedCrossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        // Detalhes extras
                                        const Divider(),
                                        const SizedBox(height: 8),
                                        Text(
                                          'ENDEREÇO DO CLIENTE',
                                          style: GoogleFonts.outfit(
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                            color: isDark ? AppColors.darkTextSecondary : AppColors.steel,
                                            letterSpacing: 1.1,
                                          ),
                                        ),
                                        const SizedBox(height: 6),
                                        if (hasAddress) ...[
                                          Row(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              const Icon(Icons.home_outlined, size: 16, color: Colors.grey),
                                              const SizedBox(width: 8),
                                              Expanded(
                                                child: Text(
                                                  user.enderecoCompleto!,
                                                  style: TextStyle(
                                                    fontSize: 13,
                                                    color: Theme.of(context).colorScheme.onSurface,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                          if (user.enderecoReferencia != null && user.enderecoReferencia!.isNotEmpty) ...[
                                            const SizedBox(height: 6),
                                            Row(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                const Icon(Icons.explore_outlined, size: 16, color: Colors.grey),
                                                const SizedBox(width: 8),
                                                Expanded(
                                                  child: Text(
                                                    'Ref: ${user.enderecoReferencia!}',
                                                    style: TextStyle(
                                                      fontSize: 12,
                                                      color: isDark ? AppColors.darkTextSecondary : AppColors.slate,
                                                      fontStyle: FontStyle.italic,
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ] else ...[
                                          Row(
                                            children: [
                                              Icon(Icons.home_work_outlined, size: 16, color: Colors.grey[400]),
                                              const SizedBox(width: 8),
                                              Text(
                                                'Endereço não cadastrado.',
                                                style: TextStyle(
                                                  fontSize: 13,
                                                  color: Colors.grey[500],
                                                  fontStyle: FontStyle.italic,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                        const SizedBox(height: 16),
                                        Text(
                                          'AÇÕES ADMINISTRATIVAS',
                                          style: GoogleFonts.outfit(
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                            color: isDark ? AppColors.darkTextSecondary : AppColors.steel,
                                            letterSpacing: 1.1,
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        // Linha de ações
                                        Wrap(
                                          spacing: 8,
                                          runSpacing: 8,
                                          children: [
                                            // Botão Atendimento Humano
                                            ElevatedButton.icon(
                                              key: Key('btn_toggle_support_${user.id}'),
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: user.atendimentoHumano
                                                    ? AppColors.brandTealDeep
                                                    : AppColors.brandGreen,
                                                foregroundColor: user.atendimentoHumano
                                                    ? Colors.white
                                                    : AppColors.brandTealDeep,
                                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                              ),
                                              onPressed: () => _toggleAtendimentoHumano(user),
                                              icon: Icon(
                                                user.atendimentoHumano
                                                    ? Icons.smart_toy_outlined
                                                    : Icons.record_voice_over,
                                                size: 16,
                                              ),
                                              label: Text(
                                                user.atendimentoHumano ? 'ATIVAR IA' : 'HUMANIZAR ATEND.',
                                                style: const TextStyle(fontSize: 11),
                                              ),
                                            ),
                                            // Botão Mudar Role
                                            OutlinedButton.icon(
                                              key: Key('btn_change_role_${user.id}'),
                                              style: OutlinedButton.styleFrom(
                                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                              ),
                                              onPressed: () {
                                                final targetRole = user.role == 'GERENTE' ? 'CLIENTE' : 'GERENTE';
                                                _alterarRole(user, targetRole);
                                              },
                                              icon: const Icon(Icons.swap_horiz, size: 16),
                                              label: Text(
                                                user.role == 'GERENTE' ? 'TORNAR CLIENTE' : 'TORNAR GERENTE',
                                                style: const TextStyle(fontSize: 11),
                                              ),
                                            ),
                                            // Botão Editar Cadastro Completo
                                            OutlinedButton.icon(
                                              key: Key('btn_edit_profile_${user.id}'),
                                              style: OutlinedButton.styleFrom(
                                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                              ),
                                              onPressed: () => _abrirEdicaoUsuario(user),
                                              icon: const Icon(Icons.edit, size: 16),
                                              label: const Text(
                                                'EDITAR DADOS',
                                                style: TextStyle(fontSize: 11),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  );
                                },
                              ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRoleBadge(String role) {
    final isGerente = role == 'GERENTE';
    final color = isGerente ? AppColors.brandTeal : AppColors.purple;
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.3), width: 0.8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isGerente ? Icons.admin_panel_settings_outlined : Icons.people_outline,
            size: 12,
            color: color,
          ),
          const SizedBox(width: 4),
          Text(
            role,
            style: GoogleFonts.outfit(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: color,
              letterSpacing: 0.8,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAtendimentoBadge(bool atendimentoHumano) {
    final color = atendimentoHumano ? AppColors.orange : AppColors.brandGreenMid;
    final label = atendimentoHumano ? 'ATENDIMENTO HUMANO' : 'IA ATIVA';
    final icon = atendimentoHumano ? Icons.person : Icons.smart_toy_outlined;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 11, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: GoogleFonts.outfit(
              fontSize: 9,
              fontWeight: FontWeight.bold,
              color: color,
              letterSpacing: 0.6,
            ),
          ),
        ],
      ),
    );
  }
}
