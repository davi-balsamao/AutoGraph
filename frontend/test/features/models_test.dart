import 'package:flutter_test/flutter_test.dart';
import 'package:autograph/core/models/user_model.dart';
import 'package:autograph/core/models/ordem_servico.dart';

void main() {
  group('UserModel', () {
    test('cria a partir de JSON corretamente', () {
      final json = {
        'id': 'u1',
        'nome': 'Test User',
        'telefone': '11999000111',
        'email': 'test@test.com',
        'role': 'GERENTE',
      };
      final user = UserModel.fromJson(json);
      expect(user.id, 'u1');
      expect(user.nome, 'Test User');
      expect(user.isAdmin, true);
      expect(user.isCliente, false);
    });

    test('role padrão é CLIENTE quando ausente', () {
      final json = {
        'id': 'u2',
        'nome': 'Client',
        'telefone': '11999000222',
      };
      final user = UserModel.fromJson(json);
      expect(user.role, 'CLIENTE');
      expect(user.isCliente, true);
    });

    test('serializa para JSON e reconstrói', () {
      final original = UserModel(
        id: 'u3', nome: 'Round Trip', telefone: '11999000333',
        email: 'rt@test.com', role: 'GERENTE',
      );
      final json = original.toJson();
      final restored = UserModel.fromJson(json);
      expect(restored.id, original.id);
      expect(restored.role, original.role);
    });
  });

  group('OrdemServico', () {
    test('cria a partir de JSON com campos completos', () {
      final json = {
        'id': 'os-1',
        'clienteId': 'c1',
        'status': 'EM_PRODUCAO',
        'especificacoes': {'produto': 'Panfletos'},
        'criadoEm': '2026-01-01T00:00:00.000Z',
        'atualizadoEm': '2026-01-02T00:00:00.000Z',
        'durationSeconds': 3600,
        'cliente': {'nome': 'João', 'telefone': '11999'},
      };
      final os = OrdemServico.fromJson(json);
      expect(os.status, StatusOS.emProducao);
      expect(os.produtoResumo, 'Panfletos');
      expect(os.durationFormatted, '01:00:00');
      expect(os.clienteNome, 'João');
    });

    test('StatusOS.fromValue retorna criada para valor inválido', () {
      expect(StatusOS.fromValue('VALOR_INEXISTENTE'), StatusOS.criada);
    });

    test('durationFormatted formata corretamente', () {
      final os = OrdemServico(
        id: 'x', clienteId: 'c', status: StatusOS.criada,
        especificacoes: {}, criadoEm: DateTime.now(),
        atualizadoEm: DateTime.now(), durationSeconds: 7265,
      );
      expect(os.durationFormatted, '02:01:05');
    });

    test('copyWith altera status mantendo demais campos', () {
      final os = OrdemServico(
        id: 'os-copy', clienteId: 'c1', status: StatusOS.criada,
        especificacoes: {'produto': 'Banner'}, criadoEm: DateTime.now(),
        atualizadoEm: DateTime.now(),
      );
      final updated = os.copyWith(status: StatusOS.entregue);
      expect(updated.status, StatusOS.entregue);
      expect(updated.id, 'os-copy');
      expect(updated.produtoResumo, 'Banner');
    });
  });
}
