"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../config/prisma");
const authRoutes = (0, express_1.Router)();
/**
 * POST /api/auth/login
 * Body: { email: string, senha: string }
 * Returns: { user: { id, nome, email, telefone, role } }
 *
 * Valida credenciais e retorna Custom Claims (role).
 */
authRoutes.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) {
            return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
        }
        const usuario = await prisma_1.prisma.usuario.findUnique({ where: { email } });
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }
        // Em produção, usaria bcrypt.compare. Aqui compara direto para simplificar.
        if (usuario.senha !== senha) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }
        return res.json({
            user: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                telefone: usuario.telefone,
                role: usuario.role,
                enderecoCompleto: usuario.enderecoCompleto,
                enderecoReferencia: usuario.enderecoReferencia,
            },
        });
    }
    catch (error) {
        console.error('❌ Erro no login:', error);
        return res.status(500).json({ error: 'Erro interno.' });
    }
});
/**
 * POST /api/auth/register
 * Body: { nome: string, email: string, senha: string, telefone?: string, enderecoCompleto?: string, enderecoReferencia?: string }
 */
authRoutes.post('/register', async (req, res) => {
    try {
        const { nome, email, senha, telefone, enderecoCompleto, enderecoReferencia } = req.body;
        if (!nome || !email || !senha || !telefone) {
            return res.status(400).json({ error: 'Nome, e-mail, senha e telefone são obrigatórios.' });
        }
        const existingEmail = await prisma_1.prisma.usuario.findUnique({ where: { email } });
        if (existingEmail) {
            return res.status(400).json({ error: 'E-mail já cadastrado.' });
        }
        const existingPhone = await prisma_1.prisma.usuario.findUnique({ where: { telefone } });
        if (existingPhone) {
            return res.status(400).json({ error: 'Telefone já cadastrado.' });
        }
        const newUser = await prisma_1.prisma.usuario.create({
            data: {
                nome,
                email,
                senha, // Em produção, usar bcrypt
                telefone,
                role: 'CLIENTE',
                enderecoCompleto: enderecoCompleto || null,
                enderecoReferencia: enderecoReferencia || null,
            },
        });
        return res.status(201).json({
            user: {
                id: newUser.id,
                nome: newUser.nome,
                email: newUser.email,
                telefone: newUser.telefone,
                role: newUser.role,
                enderecoCompleto: newUser.enderecoCompleto,
                enderecoReferencia: newUser.enderecoReferencia,
            },
        });
    }
    catch (error) {
        console.error('❌ Erro no registro:', error);
        return res.status(500).json({ error: 'Erro interno.' });
    }
});
exports.default = authRoutes;
