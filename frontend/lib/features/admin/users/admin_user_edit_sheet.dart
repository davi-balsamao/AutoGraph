import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/ag_tokens.dart';
import '../../../core/models/user_model.dart';
import '../../../core/services/auth_service.dart';

class AdminUserEditSheet extends StatefulWidget {
  final UserModel user;
  final VoidCallback onUserUpdated;

  const AdminUserEditSheet({
    super.key,
    required this.user,
    required this.onUserUpdated,
  });

  static void show(BuildContext context, UserModel user, VoidCallback onUserUpdated) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => AdminUserEditSheet(user: user, onUserUpdated: onUserUpdated),
    );
  }

  @override
  State<AdminUserEditSheet> createState() => _AdminUserEditSheetState();
}

class _AdminUserEditSheetState extends State<AdminUserEditSheet> {
  final _formKey = GlobalKey<FormState>();
  
  late TextEditingController _nomeCtrl;
  late TextEditingController _telefoneCtrl;
  late TextEditingController _emailCtrl;
  final TextEditingController _senhaCtrl = TextEditingController();

  bool _loading = false;
  late bool _atendimentoHumano;

  @override
  void initState() {
    super.initState();
    _nomeCtrl = TextEditingController(text: widget.user.nome);
    _telefoneCtrl = TextEditingController(text: widget.user.telefone);
    _emailCtrl = TextEditingController(text: widget.user.email ?? '');
    _atendimentoHumano = widget.user.atendimentoHumano;
  }

  @override
  void dispose() {
    _nomeCtrl.dispose();
    _telefoneCtrl.dispose();
    _emailCtrl.dispose();
    _senhaCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);
    try {
      await AuthService().updateUser(
        widget.user.id,
        nome: _nomeCtrl.text.trim(),
        email: _emailCtrl.text.trim(),
        telefone: _telefoneCtrl.text.trim(),
        role: widget.user.role,
        atendimentoHumano: _atendimentoHumano,
        senha: _senhaCtrl.text.isNotEmpty ? _senhaCtrl.text : null,
      );
      
      if (mounted) {
        widget.onUserUpdated();
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Usuário salvo com sucesso!'), backgroundColor: AGColors.brandGreen),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro: $e'), backgroundColor: AGColors.accentOrange),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AGColors.surfaceDark : Colors.white;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;
    final borderColor = isDark ? AGColors.hairlineDark : AGColors.hairline;

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        decoration: BoxDecoration(
          color: bg,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40, height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: mutedColor.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Editar Usuário', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: textColor)),
                  IconButton(
                    icon: Icon(Icons.close_rounded, color: mutedColor),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // KPI LTV
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isDark ? AGColors.bgDarkDeep : AGColors.canvas,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: borderColor),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Total Gasto (LTV):', style: GoogleFonts.inter(fontSize: 13, color: mutedColor)),
                    Text('R\$ ${widget.user.ltv.toStringAsFixed(2).replaceAll('.', ',')}', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: isDark ? AGColors.brandGreen : AGColors.brandGreenDark)),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _nomeCtrl,
                style: GoogleFonts.inter(color: textColor),
                decoration: InputDecoration(
                  labelText: 'Nome',
                  labelStyle: TextStyle(color: mutedColor),
                  enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: borderColor)),
                  focusedBorder: const OutlineInputBorder(borderSide: BorderSide(color: AGColors.brandGreen)),
                ),
                validator: (v) => v!.trim().isEmpty ? 'Obrigatório' : null,
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _telefoneCtrl,
                style: GoogleFonts.inter(color: textColor),
                decoration: InputDecoration(
                  labelText: 'Telefone (Ex: 5511999999999)',
                  labelStyle: TextStyle(color: mutedColor),
                  enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: borderColor)),
                  focusedBorder: const OutlineInputBorder(borderSide: BorderSide(color: AGColors.brandGreen)),
                ),
                validator: (v) => v!.trim().isEmpty ? 'Obrigatório' : null,
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _emailCtrl,
                style: GoogleFonts.inter(color: textColor),
                decoration: InputDecoration(
                  labelText: 'E-mail',
                  labelStyle: TextStyle(color: mutedColor),
                  enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: borderColor)),
                  focusedBorder: const OutlineInputBorder(borderSide: BorderSide(color: AGColors.brandGreen)),
                ),
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _senhaCtrl,
                style: GoogleFonts.inter(color: textColor),
                obscureText: true,
                decoration: InputDecoration(
                  labelText: 'Nova Senha (deixe em branco para manter)',
                  labelStyle: TextStyle(color: mutedColor),
                  enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: borderColor)),
                  focusedBorder: const OutlineInputBorder(borderSide: BorderSide(color: AGColors.brandGreen)),
                ),
              ),
              const SizedBox(height: 16),

              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text('Atendimento Humano', style: GoogleFonts.inter(color: textColor, fontWeight: FontWeight.w500)),
                subtitle: Text('Pausa a IA para este cliente', style: GoogleFonts.inter(color: mutedColor, fontSize: 12)),
                activeColor: AGColors.brandGreen,
                value: _atendimentoHumano,
                onChanged: (val) => setState(() => _atendimentoHumano = val),
              ),
              
              const SizedBox(height: 24),
              
              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: _loading ? null : _save,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AGColors.brandGreen,
                    foregroundColor: AGColors.onPrimary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AGRadius.full)),
                  ),
                  child: _loading 
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Text('Salvar Alterações', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
