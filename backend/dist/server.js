"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const webhook_routes_1 = __importDefault(require("./routes/webhook.routes"));
const os_routes_1 = __importDefault(require("./routes/os.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const produto_routes_1 = __importDefault(require("./routes/produto.routes"));
try {
    const envPath = path_1.default.resolve(process.cwd(), '.env');
    const envFile = fs_1.default.readFileSync(envPath);
    const envConfig = dotenv_1.default.parse(envFile);
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
    console.log(`✅ SUCESSO: Lemos fisicamente ${Object.keys(envConfig).length} variáveis do arquivo .env!`);
    console.log(`🔍 DATABASE_URL carregada?`, !!process.env.DATABASE_URL);
    console.log(`🔍 WA_ACCESS_TOKEN carregada?`, !!process.env.WA_ACCESS_TOKEN);
}
catch (error) {
    console.error("❌ ERRO FATAL: O Node não encontrou o arquivo .env no caminho:", path_1.default.resolve(process.cwd(), '.env'));
}
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    },
}));
// Rota principal
app.get('/', (req, res) => {
    res.json({ message: 'Hello World from AutoGraph API!' });
});
// Rotas do webhook
app.use(webhook_routes_1.default);
// Rotas da OS
app.use('/api/os', os_routes_1.default);
// Rotas de autenticação
app.use('/api/auth', auth_routes_1.default);
// Rotas de Produtos
app.use('/api/produtos', produto_routes_1.default);
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
