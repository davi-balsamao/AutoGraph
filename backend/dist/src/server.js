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
const prisma_1 = require("./config/prisma");
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
        origin: "*", // Em produção, restringir para o domínio do seu app
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
    socket.on('disconnect', () => {
        console.log('🔌 Dispositivo desconectado');
    });
});
// Rota principal
app.get('/', (req, res) => {
    res.json({ message: 'Hello World from AutoGraph API!' });
});
// Servindo os arquivos de upload de forma estática para visualização do Admin
app.use('/uploads', express_1.default.static(path_1.default.resolve(__dirname, '../data/uploads')));
app.use(webhook_routes_1.default);
app.use('/api/os', os_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
// Rotas de Produtos
app.use('/api/produtos', produto_routes_1.default);
// Endpoint de Health Check (Verifica DB)
app.get('/api/health', async (req, res) => {
    try {
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        res.status(200).json({ status: 'ok', database: 'connected' });
    }
    catch (error) {
        console.error('❌ ERRO NO HEALTH CHECK (Banco de Dados Inacessível):', error);
        res.status(503).json({ status: 'error', database: 'disconnected', message: 'Serviço de banco de dados indisponível no momento.' });
    }
});
// IMPORTANTE: Usamos 'server.listen' em vez de 'app.listen' para o Socket.io funcionar
server.listen(port, () => {
    console.log(`🚀 Servidor e Socket.io rodando na porta ${port}`);
});
