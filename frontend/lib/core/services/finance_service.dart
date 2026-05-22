import 'dart:convert';
import 'package:http/http.dart' as http;
import 'auth_service.dart';

class FinanceSummary {
  final double receitaTotal;
  final double recebido;
  final double aReceber;
  final double custos;
  final double margemLiquida;
  final double margemPercentual;
  final List<FinanceChartData> grafico;

  FinanceSummary({
    required this.receitaTotal,
    required this.recebido,
    required this.aReceber,
    required this.custos,
    required this.margemLiquida,
    required this.margemPercentual,
    required this.grafico,
  });

  factory FinanceSummary.fromJson(Map<String, dynamic> json) {
    var graficoList = (json['grafico'] as List? ?? [])
        .map((x) => FinanceChartData.fromJson(x))
        .toList();

    return FinanceSummary(
      receitaTotal: (json['receitaTotal'] as num? ?? 0.0).toDouble(),
      recebido: (json['recebido'] as num? ?? 0.0).toDouble(),
      aReceber: (json['aReceber'] as num? ?? 0.0).toDouble(),
      custos: (json['custos'] as num? ?? 0.0).toDouble(),
      margemLiquida: (json['margemLiquida'] as num? ?? 0.0).toDouble(),
      margemPercentual: (json['margemPercentual'] as num? ?? 0.0).toDouble(),
      grafico: graficoList,
    );
  }
}

class FinanceChartData {
  final String label;
  final double receita;
  final double custo;

  FinanceChartData({
    required this.label,
    required this.receita,
    required this.custo,
  });

  factory FinanceChartData.fromJson(Map<String, dynamic> json) {
    return FinanceChartData(
      label: json['label'] as String? ?? '',
      receita: (json['receita'] as num? ?? 0.0).toDouble(),
      custo: (json['custo'] as num? ?? 0.0).toDouble(),
    );
  }
}

class FinanceService {
  static final FinanceService _instance = FinanceService._internal();
  factory FinanceService() => _instance;
  FinanceService._internal();

  final String baseUrl = 'https://prescribe-ocean-tiptoeing.ngrok-free.dev/api';

  Future<FinanceSummary> fetchSummary({String? period}) async {
    try {
      final periodParam = period ?? DateTime.now().toIso8601String().substring(0, 7);
      final uri = Uri.parse('$baseUrl/finance/summary?period=$periodParam');
      final response = await http.get(uri, headers: AuthService().authHeaders);

      if (response.statusCode == 200) {
        return FinanceSummary.fromJson(jsonDecode(response.body));
      } else {
        throw Exception('Erro ao carregar dados financeiros. Código: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Falha ao conectar ao servidor financeiro: $e');
    }
  }
}
