import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { ProdutoRepository } from '../repositories/produto.repository';

const produtoRepo = new ProdutoRepository();

export class ProdutoController {
  async list(req: Request, res: Response) {
    try {
      const produtos = await produtoRepo.findAll();
      return res.json(produtos);
    } catch (error) {
      console.error('❌ Erro detalhado ao listar Produtos:', error);
      return res.status(500).json({ error: 'Erro ao buscar produtos.', details: error instanceof Error ? error.message : String(error) });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const produto = await produtoRepo.findById(id);
      if (!produto) return res.status(404).json({ error: 'Produto não encontrado.' });
      return res.json(produto);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar produto.' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { nome, descricao, precoBase, imagemUrl } = req.body;
      if (!nome || precoBase === undefined) {
        return res.status(400).json({ error: 'Nome e precoBase são obrigatórios.' });
      }
      const produto = await produtoRepo.create({ nome, descricao, imagemUrl, precoBase: Number(precoBase) });
      return res.status(201).json(produto);
    } catch (error) {
      console.error('❌ Erro ao criar Produto:', error);
      return res.status(500).json({ error: 'Erro ao criar produto.' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { nome, descricao, precoBase, imagemUrl } = req.body;
      const produto = await produtoRepo.update(id, { nome, descricao, imagemUrl, precoBase: precoBase ? Number(precoBase) : undefined });
      return res.json(produto);
    } catch (error) {
      console.error('❌ Erro ao atualizar Produto:', error);
      return res.status(500).json({ error: 'Erro ao atualizar produto.' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await produtoRepo.delete(id);
      return res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao deletar Produto:', error);
      return res.status(500).json({ error: 'Erro ao deletar produto.' });
    }
  }

  async getRegras(req: Request, res: Response) {
    try {
      const regrasPath = path.join(__dirname, '../../data/catalogo_produtos.json');
      if (fs.existsSync(regrasPath)) {
        const rawRegras = fs.readFileSync(regrasPath, 'utf8');
        return res.json(JSON.parse(rawRegras));
      } else {
        return res.status(404).json({ error: 'Arquivo de regras não encontrado.' });
      }
    } catch (error) {
      console.error('❌ Erro ao buscar regras dos produtos:', error);
      return res.status(500).json({ error: 'Erro ao buscar regras dos produtos.' });
    }
  }
}

export const produtoController = new ProdutoController();
