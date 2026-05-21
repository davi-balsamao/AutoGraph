// AGField — Campo de formulário reutilizável
//
// Tokens usados:
//   AGColors.surfaceSoft / surfaceDark (bg do campo)
//   AGColors.hairlineStrong / hairlineDarkStr (borda)
//   AGColors.muted / onDarkMuted (label uppercase)
//   AGColors.ink / onDark (texto digitado)
//   AGRadius.md = 8 (border radius do campo)
//
// Referência: ClaudeDesign/components/app-screens-auth.jsx → Field()
//
// Uso:
//   AGField(label: 'E-mail', controller: ctrl, keyboardType: TextInputType.emailAddress)
//   AGField(label: 'Senha', controller: ctrl, obscureText: true, trailing: IconButton(...))
//   AGField(label: 'WhatsApp', controller: ctrl, leading: Text('🇧🇷'))

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/ag_tokens.dart';

class AGField extends StatelessWidget {
  final String label;
  final TextEditingController? controller;
  final String? placeholder;
  final TextInputType keyboardType;
  final bool obscureText;

  /// Widget exibido à esquerda do input (ex: bandeira do país)
  final Widget? leading;

  /// Widget exibido à direita do input (ex: ícone de olho)
  final Widget? trailing;

  final String? Function(String?)? validator;
  final void Function(String)? onChanged;
  final bool readOnly;

  const AGField({
    super.key,
    required this.label,
    this.controller,
    this.placeholder,
    this.keyboardType = TextInputType.text,
    this.obscureText = false,
    this.leading,
    this.trailing,
    this.validator,
    this.onChanged,
    this.readOnly = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final bg = isDark ? AGColors.surfaceDark : AGColors.canvas;
    final borderColor = isDark ? AGColors.hairlineDarkStr : AGColors.hairlineStrong;
    final labelColor = isDark ? AGColors.onDarkMuted : AGColors.muted;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final hintColor = isDark ? AGColors.stone : AGColors.stone;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label uppercase
        Text(
          label.toUpperCase(),
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: labelColor,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 6),

        // Campo
        Container(
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(AGRadius.md + 2), // 10
            border: Border.all(color: borderColor),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
          child: Row(
            children: [
              if (leading != null) ...[
                leading!,
                const SizedBox(width: 8),
              ],
              Expanded(
                child: TextFormField(
                  controller: controller,
                  keyboardType: keyboardType,
                  obscureText: obscureText,
                  readOnly: readOnly,
                  validator: validator,
                  onChanged: onChanged,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: textColor,
                  ),
                  decoration: InputDecoration(
                    hintText: placeholder,
                    hintStyle: GoogleFonts.inter(
                      fontSize: 14,
                      color: hintColor,
                    ),
                    isDense: true,
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              ),
              if (trailing != null) ...[
                const SizedBox(width: 8),
                trailing!,
              ],
            ],
          ),
        ),
      ],
    );
  }
}
