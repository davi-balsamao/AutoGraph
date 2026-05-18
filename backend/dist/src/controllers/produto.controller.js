"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.produtoController = exports.ProdutoController = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const produto_repository_1 = require("../repositories/produto.repository");
const produtoRepo = new produto_repository_1.ProdutoRepository();
class ProdutoController {
    async list(req, res) {
        try {
            const produtos = await produtoRepo.findAll();
            return res.json(produtos);
        }
        catch (error) {
            console.error('❌ Erro detalhado ao listar Produtos:', error);
            if (error.name === 'PrismaClientInitializationError' || error.message?.includes('database server')) {
                return res.status(503).json({ error: 'Serviço de banco de dados indisponível no momento.' });
            }
            return res.status(500).json({ error: 'Erro ao buscar produtos.', details: error instanceof Error ? error.message : String(error) });
        }
    }
    async getById(req, res) {
        try {
            const id = req.params.id;
            const produto = await produtoRepo.findById(id);
            if (!produto)
                return res.status(404).json({ error: 'Produto não encontrado.' });
            return res.json(produto);
        }
        catch (error) {
            if (error.name === 'PrismaClientInitializationError' || error.message?.includes('database server')) {
                return res.status(503).json({ error: 'Serviço de banco de dados indisponível no momento.' });
            }
            return res.status(500).json({ error: 'Erro ao buscar produto.' });
        }
    }
    async create(req, res) {
        try {
            const { nome, descricao, precoBase, imagemUrl } = req.body;
            if (!nome || precoBase === undefined) {
                return res.status(400).json({ error: 'Nome e precoBase são obrigatórios.' });
            }
            const produto = await produtoRepo.create({ nome, descricao, imagemUrl, precoBase: Number(precoBase) });
            return res.status(201).json(produto);
        }
        catch (error) {
            console.error('❌ Erro ao criar Produto:', error);
            return res.status(500).json({ error: 'Erro ao criar produto.' });
        }
    }
    async update(req, res) {
        try {
            const id = req.params.id;
            const { nome, descricao, precoBase, imagemUrl } = req.body;
            const produto = await produtoRepo.update(id, { nome, descricao, imagemUrl, precoBase: precoBase ? Number(precoBase) : undefined });
            return res.json(produto);
        }
        catch (error) {
            console.error('❌ Erro ao atualizar Produto:', error);
            return res.status(500).json({ error: 'Erro ao atualizar produto.' });
        }
    }
    async delete(req, res) {
        try {
            const id = req.params.id;
            await produtoRepo.delete(id);
            return res.json({ success: true });
        }
        catch (error) {
            console.error('❌ Erro ao deletar Produto:', error);
            return res.status(500).json({ error: 'Erro ao deletar produto.' });
        }
    }
    async getRegras(req, res) {
        try {
            const regrasPath = path_1.default.join(__dirname, '../../data/catalogo_produtos.json');
            if (fs_1.default.existsSync(regrasPath)) {
                const rawRegras = fs_1.default.readFileSync(regrasPath, 'utf8');
                return res.json(JSON.parse(rawRegras));
            }
            else {
                return res.status(404).json({ error: 'Arquivo de regras não encontrado.' });
            }
        }
        catch (error) {
            console.error('❌ Erro ao buscar regras dos produtos:', error);
            return res.status(500).json({ error: 'Erro ao buscar regras dos produtos.' });
        }
    }
}
exports.ProdutoController = ProdutoController;
exports.produtoController = new ProdutoController();
