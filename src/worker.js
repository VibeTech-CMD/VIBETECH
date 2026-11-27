/**
 * VibeTech|CMD — Cloudflare Worker (Static Assets + Master Admin API + D1)
 * - Serve todo o site público via env.ASSETS
 * - Protege /api/* exclusivamente para o e-mail master (Cloudflare Access ou sessão assinada PBKDF2 + HMAC)
 * - Persiste orçamentos, contratos e configurações da VibeTech no Cloudflare D1 (vibetech-db)
 */

const MASTER_EMAIL = 'cleisson.md@gmail.com';
const SESSION_COOKIE = 'vt_master_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 dias

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      ...extraHeaders
    }
  });
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: fromHex(saltHex),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  return toHex(bits);
}

async function signValue(value, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return toHex(sig);
}

function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      out[k] = decodeURIComponent(v);
    }
  }
  return out;
}

async function getSetting(db, key) {
  const row = await db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first();
  return row ? row.value : null;
}

async function setSetting(db, key, value) {
  const now = new Date().toISOString();
  await db
    .prepare(
      'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
    )
    .bind(key, value, now)
    .run();
}

async function getOrCreateSessionSecret(db) {
  let secret = await getSetting(db, 'session_secret');
  if (!secret) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    secret = toHex(bytes);
    await setSetting(db, 'session_secret', secret);
  }
  return secret;
}

async function createSessionCookie(db, email, isHttps) {
  const secret = await getOrCreateSessionSecret(db);
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${email.toLowerCase()}|${exp}`;
  const sig = await signValue(payload, secret);
  const token = `${payload}|${sig}`;
  const secureFlag = isHttps ? 'Secure; ' : '';
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; ${secureFlag}SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}`;
}

async function authenticateRequest(request, env) {
  // 1. Prioridade máxima: Cloudflare Access (Zero Trust) quando ativado na conta
  const cfEmail = request.headers.get('Cf-Access-Authenticated-User-Email');
  if (cfEmail) {
    if (cfEmail.trim().toLowerCase() === MASTER_EMAIL) {
      return { ok: true, email: MASTER_EMAIL, authMode: 'cloudflare-access' };
    }
    return { ok: false, forbidden: true, email: cfEmail };
  }

  // 2. Sessão assinada HttpOnly via cookie (PBKDF2 + HMAC-SHA256)
  const cookies = parseCookies(request.headers.get('Cookie'));
  const token = cookies[SESSION_COOKIE];
  if (!token || !env.DB) return { ok: false };

  const parts = token.split('|');
  if (parts.length !== 3) return { ok: false };
  const [email, expStr, sig] = parts;
  const exp = Number(expStr);
  if (email !== MASTER_EMAIL || !Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
    return { ok: false };
  }

  const secret = await getSetting(env.DB, 'session_secret');
  if (!secret) return { ok: false };

  const expectedSig = await signValue(`${email}|${expStr}`, secret);
  if (!timingSafeEqual(sig, expectedSig)) return { ok: false };

  return { ok: true, email: MASTER_EMAIL, authMode: 'master-session' };
}

async function generateProposalCode(db) {
  const year = new Date().getFullYear();
  const prefix = `VT-${year}-`;
  const row = await db
    .prepare('SELECT COUNT(*) as total FROM proposals WHERE code LIKE ?')
    .bind(`${prefix}%`)
    .first();
  const nextNum = Number(row?.total || 0) + 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

async function handleApi(request, env, url) {
  const path = url.pathname;
  const method = request.method.toUpperCase();
  const isHttps = url.protocol === 'https:';

  if (!env.DB) {
    return jsonResponse({ error: 'Banco de dados D1 não configurado.' }, 500);
  }

  // ---------- Auth endpoints ----------
  if (path === '/api/auth/status' && method === 'GET') {
    const auth = await authenticateRequest(request, env);
    const hasPassword = Boolean(await getSetting(env.DB, 'master_password_hash'));
    return jsonResponse({
      authenticated: Boolean(auth.ok),
      email: auth.ok ? auth.email : null,
      authMode: auth.authMode || null,
      needsSetup: !hasPassword,
      masterEmailHint: MASTER_EMAIL
    });
  }

  if (path === '/api/auth/setup' && method === 'POST') {
    const existingHash = await getSetting(env.DB, 'master_password_hash');
    if (existingHash) {
      return jsonResponse({ error: 'Acesso Master já configurado. Faça login normalmente.' }, 409);
    }
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (email !== MASTER_EMAIL) {
      return jsonResponse({ error: 'E-mail não autorizado para o Acesso Master.' }, 403);
    }
    if (password.length < 6) {
      return jsonResponse({ error: 'Defina uma senha com pelo menos 6 caracteres.' }, 400);
    }

    const saltBytes = new Uint8Array(16);
    crypto.getRandomValues(saltBytes);
    const saltHex = toHex(saltBytes);
    const hashHex = await hashPassword(password, saltHex);

    await setSetting(env.DB, 'master_password_hash', `${saltHex}:${hashHex}`);
    const cookie = await createSessionCookie(env.DB, MASTER_EMAIL, isHttps);
    return jsonResponse(
      { ok: true, email: MASTER_EMAIL, message: 'Acesso Master configurado com sucesso.' },
      200,
      { 'Set-Cookie': cookie }
    );
  }

  if (path === '/api/auth/login' && method === 'POST') {
    const stored = await getSetting(env.DB, 'master_password_hash');
    if (!stored) {
      return jsonResponse({ error: 'Configure sua senha de primeiro acesso.', needsSetup: true }, 400);
    }
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (email !== MASTER_EMAIL) {
      return jsonResponse({ error: 'E-mail ou senha inválidos.' }, 401);
    }

    const [saltHex, expectedHash] = stored.split(':');
    const actualHash = await hashPassword(password, saltHex);
    if (!timingSafeEqual(actualHash, expectedHash)) {
      return jsonResponse({ error: 'E-mail ou senha inválidos.' }, 401);
    }

    const cookie = await createSessionCookie(env.DB, MASTER_EMAIL, isHttps);
    return jsonResponse(
      { ok: true, email: MASTER_EMAIL },
      200,
      { 'Set-Cookie': cookie }
    );
  }

  if (path === '/api/auth/logout' && method === 'POST') {
    const secureFlag = isHttps ? 'Secure; ' : '';
    return jsonResponse(
      { ok: true },
      200,
      { 'Set-Cookie': `${SESSION_COOKIE}=; Path=/; HttpOnly; ${secureFlag}SameSite=Strict; Max-Age=0` }
    );
  }

  // ---------- Rotas protegidas (exigem Acesso Master autenticado) ----------
  const auth = await authenticateRequest(request, env);
  if (!auth.ok) {
    return jsonResponse(
      { error: auth.forbidden ? 'Acesso restrito ao proprietário autorizado.' : 'Autenticação Master necessária.' },
      auth.forbidden ? 403 : 401
    );
  }

  // Perfil da VibeTech (dados do prestador salvos no D1)
  if (path === '/api/profile' && method === 'GET') {
    const raw = await getSetting(env.DB, 'provider_profile');
    const profile = raw ? JSON.parse(raw) : {};
    return jsonResponse({ profile });
  }

  if (path === '/api/profile' && method === 'PUT') {
    const body = await request.json().catch(() => ({}));
    const profile = {
      companyName: String(body.companyName || 'VibeTech|CMD').trim(),
      ownerName: String(body.ownerName || '').trim(),
      document: String(body.document || '').trim(),
      city: String(body.city || 'Macaé').trim(),
      state: String(body.state || 'RJ').trim(),
      whatsapp: String(body.whatsapp || '(22) 99916-2793').trim(),
      email: String(body.email || MASTER_EMAIL).trim(),
      website: String(body.website || 'https://vibetechcmd.com.br').trim()
    };
    await setSetting(env.DB, 'provider_profile', JSON.stringify(profile));
    return jsonResponse({ ok: true, profile });
  }

  // Listar todos os orçamentos e contratos
  if (path === '/api/proposals' && method === 'GET') {
    const { results } = await env.DB
      .prepare('SELECT * FROM proposals ORDER BY updated_at DESC LIMIT 200')
      .all();
    const proposals = (results || []).map((row) => ({
      ...row,
      items: safeJsonParse(row.items_json, []),
      provider: safeJsonParse(row.provider_json, null)
    }));
    return jsonResponse({ proposals });
  }

  // Criar novo orçamento
  if (path === '/api/proposals' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const id = crypto.randomUUID();
    const code = body.code ? String(body.code).trim() : await generateProposalCode(env.DB);
    const now = new Date().toISOString();

    const items = Array.isArray(body.items) ? body.items : [];
    const discount = Number(body.discount || 0);
    const subtotal = items.reduce((acc, item) => acc + Number(item.price || 0), 0);
    const totalValue = Math.max(0, subtotal - discount);

    await env.DB
      .prepare(
        `INSERT INTO proposals (
          id, code, status, template_id,
          client_name, client_company, client_document, client_whatsapp, client_email,
          project_title, project_summary, items_json, discount, total_value,
          delivery_days, validity_days, payment_terms, notes, contract_clauses,
          provider_json, validated_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        code,
        String(body.status || 'rascunho'),
        String(body.template_id || 'personalizado'),
        String(body.client_name || 'Cliente sem nome').trim(),
        String(body.client_company || '').trim(),
        String(body.client_document || '').trim(),
        String(body.client_whatsapp || '').trim(),
        String(body.client_email || '').trim(),
        String(body.project_title || 'Projeto Digital VibeTech|CMD').trim(),
        String(body.project_summary || '').trim(),
        JSON.stringify(items),
        discount,
        totalValue,
        String(body.delivery_days || '10 a 15 dias úteis').trim(),
        Number(body.validity_days || 15),
        String(body.payment_terms || '').trim(),
        String(body.notes || '').trim(),
        String(body.contract_clauses || '').trim(),
        JSON.stringify(body.provider || null),
        body.validated_at || null,
        now,
        now
      )
      .run();

    const created = await env.DB.prepare('SELECT * FROM proposals WHERE id = ?').bind(id).first();
    return jsonResponse(
      {
        ok: true,
        proposal: {
          ...created,
          items: safeJsonParse(created.items_json, []),
          provider: safeJsonParse(created.provider_json, null)
        }
      },
      201
    );
  }

  // Atualizar ou excluir orçamento/contrato por ID
  const proposalMatch = path.match(/^\/api\/proposals\/([a-zA-Z0-9-]+)$/);
  if (proposalMatch) {
    const id = proposalMatch[1];

    if (method === 'PUT') {
      const existing = await env.DB.prepare('SELECT * FROM proposals WHERE id = ?').bind(id).first();
      if (!existing) return jsonResponse({ error: 'Orçamento não encontrado.' }, 404);

      const body = await request.json().catch(() => ({}));
      const now = new Date().toISOString();
      const items = Array.isArray(body.items) ? body.items : safeJsonParse(existing.items_json, []);
      const discount = body.discount !== undefined ? Number(body.discount) : Number(existing.discount || 0);
      const subtotal = items.reduce((acc, item) => acc + Number(item.price || 0), 0);
      const totalValue = Math.max(0, subtotal - discount);
      const status = String(body.status || existing.status);
      const validatedAt =
        body.validated_at !== undefined
          ? body.validated_at
          : status === 'validado' || status === 'contrato_gerado'
          ? existing.validated_at || now
          : existing.validated_at;

      await env.DB
        .prepare(
          `UPDATE proposals SET
            status = ?, template_id = ?,
            client_name = ?, client_company = ?, client_document = ?, client_whatsapp = ?, client_email = ?,
            project_title = ?, project_summary = ?, items_json = ?, discount = ?, total_value = ?,
            delivery_days = ?, validity_days = ?, payment_terms = ?, notes = ?, contract_clauses = ?,
            provider_json = ?, validated_at = ?, updated_at = ?
          WHERE id = ?`
        )
        .bind(
          status,
          String(body.template_id ?? existing.template_id),
          String(body.client_name ?? existing.client_name).trim(),
          String(body.client_company ?? existing.client_company).trim(),
          String(body.client_document ?? existing.client_document).trim(),
          String(body.client_whatsapp ?? existing.client_whatsapp).trim(),
          String(body.client_email ?? existing.client_email).trim(),
          String(body.project_title ?? existing.project_title).trim(),
          String(body.project_summary ?? existing.project_summary).trim(),
          JSON.stringify(items),
          discount,
          totalValue,
          String(body.delivery_days ?? existing.delivery_days).trim(),
          Number(body.validity_days ?? existing.validity_days ?? 15),
          String(body.payment_terms ?? existing.payment_terms).trim(),
          String(body.notes ?? existing.notes).trim(),
          String(body.contract_clauses ?? existing.contract_clauses).trim(),
          JSON.stringify(body.provider !== undefined ? body.provider : safeJsonParse(existing.provider_json, null)),
          validatedAt,
          now,
          id
        )
        .run();

      const updated = await env.DB.prepare('SELECT * FROM proposals WHERE id = ?').bind(id).first();
      return jsonResponse({
        ok: true,
        proposal: {
          ...updated,
          items: safeJsonParse(updated.items_json, []),
          provider: safeJsonParse(updated.provider_json, null)
        }
      });
    }

    if (method === 'DELETE') {
      await env.DB.prepare('DELETE FROM proposals WHERE id = ?').bind(id).run();
      return jsonResponse({ ok: true });
    }
  }

  return jsonResponse({ error: 'Rota não encontrada.' }, 404);
}

function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API Master protegida
    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env, url);
    }

    // Normaliza /admin para /admin/
    if (url.pathname === '/admin') {
      return Response.redirect(`${url.origin}/admin/`, 302);
    }

    // Serve arquivos estáticos normalmente via Cloudflare Workers Static Assets
    return env.ASSETS.fetch(request);
  }
};
