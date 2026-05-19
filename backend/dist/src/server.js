"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const webhook_routes_1 = __importDefault(require("./routes/webhook.routes"));
const os_routes_1 = __importDefault(require("./routes/os.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const produto_routes_1 = __importDefault(require("./routes/produto.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const propostas_routes_1 = __importDefault(require("./routes/propostas.routes"));
const conversas_routes_1 = __importDefault(require("./routes/conversas.routes"));
const prisma_1 = require("./config/prisma");
const cron_service_1 = require("./services/cron.service");
const whatsapp_service_1 = require("./services/whatsapp.service");
// Carregamento Físico do .env
try {
    const envPath = path_1.default.resolve(process.cwd(), '.env');
    const envFile = fs_1.default.readFileSync(envPath);
    const envConfig = dotenv_1.default.parse(envFile);
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
    console.log(`✅ SUCESSO: Lemos fisicamente ${Object.keys(envConfig).length} variáveis do arquivo .env!`);
}
catch (error) {
    console.error("❌ ERRO FATAL: O Node não encontrou o arquivo .env");
}
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Configuração do Servidor HTTP e Socket.io
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*", // Em produção, restringir para o domínio do app
        methods: ["GET", "POST"]
    }
});
exports.io = io;
app.use((0, cors_1.default)());
app.use(express_1.default.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    },
}));
// Monitoramento de conexão socket
io.on('connection', (socket) => {
    console.log(`🔌 Novo dispositivo conectado ao Socket: ${socket.id}`);
    // INTERCEPTADOR DE MENSAGENS DO ADMIN
    socket.on('message', async (data) => {
        // Se a mensagem que chegou no Socket veio do Painel Admin do Flutter...
        if (data.senderId === 'admin') {
            try {
                console.log(`📤 [SOCKET -> WPP] Admin respondendo para o telefone: ${data.receiverId}`);
                // 1. Atira a mensagem para a API oficial do WhatsApp da Meta
                await whatsapp_service_1.whatsappService.sendMessage(data.receiverId, data.text);
                // 2. SILENCIADOR DA IA: Atualiza o banco de dados para avisar que o humano assumiu!
                const cliente = await prisma_1.prisma.usuario.findFirst({ where: { telefone: data.receiverId } });
                if (cliente) {
                    await prisma_1.prisma.usuario.update({
                        where: { id: cliente.id },
                        data: { atendimentoHumano: true }
                    });
                    // Salva o estado atual na sessão para restaurar corretamente depois!
                    const sessao = await prisma_1.prisma.sessaoAtendimento.findFirst({
                        where: { clienteId: cliente.id, ativa: true },
                        orderBy: { criadoEm: 'desc' },
                    });
                    if (sessao) {
                        const ctx = sessao.contexto || {};
                        if (!ctx.estadoSalvoTakeover) {
                            ctx.estadoSalvoTakeover = sessao.estadoAtual;
                            await prisma_1.prisma.sessaoAtendimento.update({
                                where: { id: sessao.id },
                                data: { contexto: ctx },
                            });
                        }
                    }
                }
                console.log(`🤫 IA desativada para o cliente ${data.receiverId} (Humano assumiu a conversa)`);
                console.log(`✅ [WPP] Mensagem do Admin entregue com sucesso!`);
            }
            catch (error) {
                console.error(`❌ [WPP] Erro ao enviar mensagem do Admin:`, error);
            }
        }
    });
    socket.on('disconnect', () => {
        console.log('🔌 Dispositivo desconectado');
    });
});
app.get('/', (req, res) => {
    res.json({ message: 'Hello World from AutoGraph API!' });
});
app.use('/uploads', express_1.default.static(path_1.default.resolve(__dirname, '../data/uploads')));
app.use(webhook_routes_1.default);
app.use('/api/os', os_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/propostas', propostas_routes_1.default);
app.use('/api/conversas', conversas_routes_1.default);
// Rotas de Produtos
app.use('/api/produtos', produto_routes_1.default);
app.get('/api/health', async (req, res) => {
    try {
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        res.status(200).json({ status: 'ok', database: 'connected' });
    }
    catch (error) {
        console.error('❌ ERRO NO HEALTH CHECK (Banco de Dados Inacessível):', error);
        res.status(503).json({ status: 'error', database: 'disconnected', message: 'Serviço indisponível' });
    }
});
server.listen(port, () => {
    console.log(`🚀 Servidor e Socket.io rodando na porta ${port}`);
    cron_service_1.cronService.start();
});
