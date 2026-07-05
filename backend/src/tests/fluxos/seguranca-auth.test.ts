/**
 * Testes de segurança das rotas protegidas por JWT (Fase 0).
 *
 * Padrão E2E dos fluxos: o servidor precisa estar rodando (npm run dev) com
 * o mesmo banco. Não depende de LLM — só de auth + Postgres.
 *
 * Cobre:
 *  · rota protegida sem token → 401
 *  · token inválido → 401
 *  · token de CLIENTE em rota de gerente → 403
 *  · login → token válido que abre rota protegida
 *  · GET /api/auth/users nunca expõe o campo senha
 *  · cliente não consegue se promover a GERENTE
 */

import { prisma } from '../../config/prisma';
import {
  BASE_URL,
  GERENTE_TESTE,
  CLIENTE_TESTE,
  loginAsGerenteTeste,
  loginAsClienteTeste,
} from './helpers';

async function removeTestUsers() {
  await prisma.usuario.deleteMany({
    where: { email: { in: [GERENTE_TESTE.email, CLIENTE_TESTE.email] } },
  });
}

describe('Segurança · JWT nas rotas da API', () => {
  let gerenteToken: string;
  let clienteToken: string;

  beforeAll(async () => {
    await removeTestUsers();
    gerenteToken = await loginAsGerenteTeste();
    clienteToken = await loginAsClienteTeste();
  });

  afterAll(async () => {
    await removeTestUsers();
  });

  it('recusa rota protegida sem token (401)', async () => {
    const res = await fetch(`${BASE_URL}/api/os`);
    expect(res.status).toBe(401);
  });

  it('recusa token inválido (401)', async () => {
    const res = await fetch(`${BASE_URL}/api/os`, {
      headers: { Authorization: 'Bearer token-falso-qualquer' },
    });
    expect(res.status).toBe(401);
  });

  it('aceita token de GERENTE em rota protegida (200)', async () => {
    const res = await fetch(`${BASE_URL}/api/os`, {
      headers: { Authorization: `Bearer ${gerenteToken}` },
    });
    expect(res.status).toBe(200);
  });

  it('recusa token de CLIENTE em rota de gerente (403)', async () => {
    const res = await fetch(`${BASE_URL}/api/propostas`, {
      headers: { Authorization: `Bearer ${clienteToken}` },
    });
    expect(res.status).toBe(403);
  });

  it('GET /api/auth/users exige gerente e não expõe senha', async () => {
    const semToken = await fetch(`${BASE_URL}/api/auth/users`);
    expect(semToken.status).toBe(401);

    const comCliente = await fetch(`${BASE_URL}/api/auth/users`, {
      headers: { Authorization: `Bearer ${clienteToken}` },
    });
    expect(comCliente.status).toBe(403);

    const comGerente = await fetch(`${BASE_URL}/api/auth/users`, {
      headers: { Authorization: `Bearer ${gerenteToken}` },
    });
    expect(comGerente.status).toBe(200);
    const usuarios = await comGerente.json();
    expect(Array.isArray(usuarios)).toBe(true);
    for (const u of usuarios) {
      expect(u).not.toHaveProperty('senha');
    }
  });

  it('cliente não consegue se promover a GERENTE', async () => {
    const cliente = await prisma.usuario.findUnique({
      where: { email: CLIENTE_TESTE.email },
    });
    expect(cliente).not.toBeNull();

    const res = await fetch(`${BASE_URL}/api/auth/users/${cliente!.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clienteToken}`,
      },
      body: JSON.stringify({ role: 'GERENTE' }),
    });
    expect(res.status).toBe(403);

    const aindaCliente = await prisma.usuario.findUnique({
      where: { email: CLIENTE_TESTE.email },
    });
    expect(aindaCliente!.role).toBe('CLIENTE');
  });

  it('cliente não edita cadastro de outro usuário', async () => {
    const gerente = await prisma.usuario.findUnique({
      where: { email: GERENTE_TESTE.email },
    });
    const res = await fetch(`${BASE_URL}/api/auth/users/${gerente!.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clienteToken}`,
      },
      body: JSON.stringify({ nome: 'Hackeado' }),
    });
    expect(res.status).toBe(403);
  });

  it('login com senha errada não retorna token', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: GERENTE_TESTE.email, senha: 'senha-errada' }),
    });
    expect(res.status).toBe(401);
  });
});
