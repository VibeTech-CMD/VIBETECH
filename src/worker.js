/**
 * VibeTech|CMD — Cloudflare Worker (Static Assets + Ecossistema Interno + D1)
 * - Serve o site público + /briefing via env.ASSETS
 * - Aceita envio público em POST /api/public/briefing (grava Briefing + Lead CRM + Kanban)
 * - Protege /api/* (demais rotas) exclusivamente para cleisson.md@gmail.com
 * - Persiste Clientes, Briefings, Propostas/Contratos, Kanban, Manutenção e Configurações no D1
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

function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: fromHex(saltHex), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return toHex(bits);
}

async function signValue(value, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign'
  ]);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return toHex(sig);
}

function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
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
  const cfEmail = request.headers.get('Cf-Access-Authenticated-User-Email');
  if (cfEmail) {
    if (cfEmail.trim().toLowerCase() === MASTER_EMAIL) {
      return { ok: true, email: MASTER_EMAIL, authMode: 'cloudflare-access' };
    }
    return { ok: false, forbidden: true, email: cfEmail };
  }

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
  const row = await db.prepare('SELECT COUNT(*) as total FROM proposals WHERE code LIKE ?').bind(`${prefix}%`).first();
  const nextNum = Number(row?.total || 0) + 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

function getQuotaForPlan(plan) {
  if (plan === 'basico') return 2;
  if (plan === 'medio') return 4;
  if (plan === 'avancado') return 10;
  return 0;
}

async function handleApi(request, env, url) {
  const path = url.pathname;
  const method = request.method.toUpperCase();
  const isHttps = url.protocol === 'https:';

  if (!env.DB) return jsonResponse({ error: 'Banco de dados D1 não configurado.' }, 500);

  /* ==================== ROTA PÚBLICA: BRIEFING INTERATIVO ==================== */
  if (path === '/api/public/briefing' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const clientName = String(body.client_name || '').trim();
    const clientCompany = String(body.client_company || '').trim();
    const clientWhatsapp = String(body.client_whatsapp || '').trim();
    const clientEmail = String(body.client_email || '').trim();
    const track = String(body.track || 'ideia').trim();
    const answers = body.answers && typeof body.answers === 'object' ? body.answers : {};
    const brainstormSummary = String(body.brainstorm_summary || '').trim();

    if (!clientName || !clientWhatsapp) {
      return jsonResponse({ error: 'Informe seu nome e WhatsApp para enviar o briefing.' }, 400);
    }

    const now = new Date().toISOString();
    const clientId = crypto.randomUUID();
    const briefingId = crypto.randomUUID();
    const projectId = crypto.randomUUID();
    const folderSlug = (clientCompany || clientName)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 32);

    // 1. Cria lead no CRM (clients)
    await env.DB.prepare(
      `INSERT INTO clients (
        id, name, company, document, whatsapp, email, address, domain, hosting,
        folder_ref, maintenance_plan, monthly_quota, bonus_credits, notes, created_at, updated_at
      ) VALUES (?, ?, ?, '', ?, ?, '', ?, '', ?, 'nenhum', 0, 0, ?, ?, ?)`
    )
      .bind(
        clientId,
        clientName,
        clientCompany,
        clientWhatsapp,
        clientEmail,
        String(answers.current_url || answers.domain_info || '').trim(),
        folderSlug ? `clientes/${folderSlug} (01-Briefing, 02-Contrato-Comprovantes, 03-Materiais-Cliente, 04-Entrega-Backup)` : '',
        `Lead captado via Briefing Interativo (Trilha: ${track}).`,
        now,
        now
      )
      .run();

    // 2. Salva o Briefing estruturado
    await env.DB.prepare(
      `INSERT INTO briefings (
        id, client_id, track, client_name, client_company, client_whatsapp, client_email,
        answers_json, brainstorm_summary, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'novo', ?)`
    )
      .bind(
        briefingId,
        clientId,
        track,
        clientName,
        clientCompany,
        clientWhatsapp,
        clientEmail,
        JSON.stringify(answers),
        brainstormSummary,
        now
      )
      .run();

    // 3. Cria cartão automático no Kanban (Lead / Briefing)
    const trackLabel =
      track === 'redesign' ? 'Redesign' : track === 'base' ? 'Projeto com Base' : 'Novo Projeto';
    await env.DB.prepare(
      `INSERT INTO projects (
        id, client_id, proposal_id, title, client_name, stage, value, published_at, followup_15_done, notes, created_at, updated_at
      ) VALUES (?, ?, NULL, ?, ?, 'lead_briefing', 0, NULL, 0, ?, ?, ?)`
    )
      .bind(
        projectId,
        clientId,
        `${trackLabel} — ${clientCompany || clientName}`,
        clientName,
        brainstormSummary.slice(0, 400),
        now,
        now
      )
      .run();

    return jsonResponse({ ok: true, briefing_id: briefingId, client_id: clientId }, 201);
  }

  /* ==================== AUTENTICAÇÃO MASTER ==================== */
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
    if (existingHash) return jsonResponse({ error: 'Acesso Master já configurado.' }, 409);

    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (email !== MASTER_EMAIL) return jsonResponse({ error: 'E-mail não autorizado para o Acesso Master.' }, 403);
    if (password.length < 6) return jsonResponse({ error: 'Defina uma senha com pelo menos 6 caracteres.' }, 400);

    const saltBytes = new Uint8Array(16);
    crypto.getRandomValues(saltBytes);
    const saltHex = toHex(saltBytes);
    const hashHex = await hashPassword(password, saltHex);

    await setSetting(env.DB, 'master_password_hash', `${saltHex}:${hashHex}`);
    const cookie = await createSessionCookie(env.DB, MASTER_EMAIL, isHttps);
    return jsonResponse({ ok: true, email: MASTER_EMAIL }, 200, { 'Set-Cookie': cookie });
  }

  if (path === '/api/auth/login' && method === 'POST') {
    const stored = await getSetting(env.DB, 'master_password_hash');
    if (!stored) return jsonResponse({ error: 'Configure sua senha de primeiro acesso.', needsSetup: true }, 400);

    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (email !== MASTER_EMAIL) return jsonResponse({ error: 'E-mail ou senha inválidos.' }, 401);

    const [saltHex, expectedHash] = stored.split(':');
    const actualHash = await hashPassword(password, saltHex);
    if (!timingSafeEqual(actualHash, expectedHash)) return jsonResponse({ error: 'E-mail ou senha inválidos.' }, 401);

    const cookie = await createSessionCookie(env.DB, MASTER_EMAIL, isHttps);
    return jsonResponse({ ok: true, email: MASTER_EMAIL }, 200, { 'Set-Cookie': cookie });
  }

  if (path === '/api/auth/logout' && method === 'POST') {
    const secureFlag = isHttps ? 'Secure; ' : '';
    return jsonResponse({ ok: true }, 200, {
      'Set-Cookie': `${SESSION_COOKIE}=; Path=/; HttpOnly; ${secureFlag}SameSite=Strict; Max-Age=0`
    });
  }

  /* ==================== ROTAS PROTEGIDAS MASTER ==================== */
  const auth = await authenticateRequest(request, env);
  if (!auth.ok) {
    return jsonResponse(
      { error: auth.forbidden ? 'Acesso restrito ao proprietário autorizado.' : 'Autenticação Master necessária.' },
      auth.forbidden ? 403 : 401
    );
  }

  /* ---------- Perfil da VibeTech ---------- */
  if (path === '/api/profile' && method === 'GET') {
    const raw = await getSetting(env.DB, 'provider_profile');
    return jsonResponse({ profile: safeJsonParse(raw, {}) });
  }

  if (path === '/api/profile' && method === 'PUT') {
    const body = await request.json().catch(() => ({}));
    const profile = {
      companyName: String(body.companyName || 'VibeTech|CMD').trim(),
      ownerName: String(body.ownerName || 'Cleisson Martins Diogo').trim(),
      document: String(body.document || '').trim(),
      address: String(body.address || 'Macaé – RJ').trim(),
      city: String(body.city || 'Macaé').trim(),
      state: String(body.state || 'RJ').trim(),
      whatsapp: String(body.whatsapp || '(22) 99916-2793').trim(),
      email: String(body.email || MASTER_EMAIL).trim(),
      pixKey: String(body.pixKey || '').trim(),
      website: String(body.website || 'https://vibetechcmd.com.br').trim()
    };
    await setSetting(env.DB, 'provider_profile', JSON.stringify(profile));
    return jsonResponse({ ok: true, profile });
  }

  /* ---------- Propostas / Orçamentos / Contratos ---------- */
  if (path === '/api/proposals' && method === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM proposals ORDER BY updated_at DESC LIMIT 300').all();
    const proposals = (results || []).map((row) => ({
      ...row,
      items: safeJsonParse(row.items_json, []),
      provider: safeJsonParse(row.provider_json, null),
      meta: safeJsonParse(row.meta_json, {})
    }));
    return jsonResponse({ proposals });
  }

  if (path === '/api/proposals' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const id = crypto.randomUUID();
    const code = body.code && body.code !== 'NOVO' && body.code !== 'RASCUNHO' ? String(body.code).trim() : await generateProposalCode(env.DB);
    const now = new Date().toISOString();
    const items = Array.isArray(body.items) ? body.items : [];
    const discount = Number(body.discount || 0);
    const totalValue = Number(body.total_value ?? Math.max(0, items.reduce((a, i) => a + Number(i.price || 0), 0) - discount));

    await env.DB.prepare(
      `INSERT INTO proposals (
        id, code, status, template_id,
        client_name, client_company, client_document, client_whatsapp, client_email,
        project_title, project_summary, items_json, discount, total_value,
        delivery_days, validity_days, payment_terms, notes, contract_clauses,
        provider_json, meta_json, validated_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
        String(body.delivery_days || 'Até 15 dias').trim(),
        Number(body.validity_days || 7),
        String(body.payment_terms || '').trim(),
        String(body.notes || '').trim(),
        String(body.contract_clauses || '').trim(),
        JSON.stringify(body.provider || null),
        JSON.stringify(body.meta || {}),
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
          provider: safeJsonParse(created.provider_json, null),
          meta: safeJsonParse(created.meta_json, {})
        }
      },
      201
    );
  }

  const proposalMatch = path.match(/^\/api\/proposals\/([a-zA-Z0-9-]+)$/);
  if (proposalMatch) {
    const id = proposalMatch[1];
    if (method === 'PUT') {
      const existing = await env.DB.prepare('SELECT * FROM proposals WHERE id = ?').bind(id).first();
      if (!existing) return jsonResponse({ error: 'Proposta não encontrada.' }, 404);

      const body = await request.json().catch(() => ({}));
      const now = new Date().toISOString();
      const items = Array.isArray(body.items) ? body.items : safeJsonParse(existing.items_json, []);
      const discount = body.discount !== undefined ? Number(body.discount) : Number(existing.discount || 0);
      const totalValue =
        body.total_value !== undefined
          ? Number(body.total_value)
          : Math.max(0, items.reduce((a, i) => a + Number(i.price || 0), 0) - discount);
      const status = String(body.status || existing.status);
      const validatedAt =
        body.validated_at !== undefined
          ? body.validated_at
          : status === 'validado' || status === 'contrato_gerado'
          ? existing.validated_at || now
          : existing.validated_at;

      await env.DB.prepare(
        `UPDATE proposals SET
          status = ?, template_id = ?,
          client_name = ?, client_company = ?, client_document = ?, client_whatsapp = ?, client_email = ?,
          project_title = ?, project_summary = ?, items_json = ?, discount = ?, total_value = ?,
          delivery_days = ?, validity_days = ?, payment_terms = ?, notes = ?, contract_clauses = ?,
          provider_json = ?, meta_json = ?, validated_at = ?, updated_at = ?
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
          Number(body.validity_days ?? existing.validity_days ?? 7),
          String(body.payment_terms ?? existing.payment_terms).trim(),
          String(body.notes ?? existing.notes).trim(),
          String(body.contract_clauses ?? existing.contract_clauses).trim(),
          JSON.stringify(body.provider !== undefined ? body.provider : safeJsonParse(existing.provider_json, null)),
          JSON.stringify(body.meta !== undefined ? body.meta : safeJsonParse(existing.meta_json, {})),
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
          provider: safeJsonParse(updated.provider_json, null),
          meta: safeJsonParse(updated.meta_json, {})
        }
      });
    }

    if (method === 'DELETE') {
      await env.DB.prepare('DELETE FROM proposals WHERE id = ?').bind(id).run();
      return jsonResponse({ ok: true });
    }
  }

  /* ---------- CRM de Clientes ---------- */
  if (path === '/api/clients' && method === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM clients ORDER BY updated_at DESC LIMIT 300').all();
    return jsonResponse({ clients: results || [] });
  }

  if (path === '/api/clients' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const plan = String(body.maintenance_plan || 'nenhum');
    const quota = body.monthly_quota !== undefined ? Number(body.monthly_quota) : getQuotaForPlan(plan);
    await env.DB.prepare(
      `INSERT INTO clients (
        id, name, company, document, whatsapp, email, address, domain, hosting,
        folder_ref, maintenance_plan, monthly_quota, bonus_credits, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        String(body.name || 'Sem nome').trim(),
        String(body.company || '').trim(),
        String(body.document || '').trim(),
        String(body.whatsapp || '').trim(),
        String(body.email || '').trim(),
        String(body.address || '').trim(),
        String(body.domain || '').trim(),
        String(body.hosting || '').trim(),
        String(body.folder_ref || '').trim(),
        plan,
        quota,
        Number(body.bonus_credits || 0),
        String(body.notes || '').trim(),
        now,
        now
      )
      .run();
    const client = await env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first();
    return jsonResponse({ ok: true, client }, 201);
  }

  const clientMatch = path.match(/^\/api\/clients\/([a-zA-Z0-9-]+)$/);
  if (clientMatch) {
    const id = clientMatch[1];
    if (method === 'PUT') {
      const existing = await env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first();
      if (!existing) return jsonResponse({ error: 'Cliente não encontrado.' }, 404);
      const body = await request.json().catch(() => ({}));
      const now = new Date().toISOString();
      const plan = String(body.maintenance_plan ?? existing.maintenance_plan);
      const quota =
        body.monthly_quota !== undefined
          ? Number(body.monthly_quota)
          : body.maintenance_plan !== undefined
          ? getQuotaForPlan(plan)
          : Number(existing.monthly_quota || 0);
      await env.DB.prepare(
        `UPDATE clients SET
          name = ?, company = ?, document = ?, whatsapp = ?, email = ?, address = ?,
          domain = ?, hosting = ?, folder_ref = ?, maintenance_plan = ?, monthly_quota = ?,
          bonus_credits = ?, notes = ?, updated_at = ?
        WHERE id = ?`
      )
        .bind(
          String(body.name ?? existing.name).trim(),
          String(body.company ?? existing.company).trim(),
          String(body.document ?? existing.document).trim(),
          String(body.whatsapp ?? existing.whatsapp).trim(),
          String(body.email ?? existing.email).trim(),
          String(body.address ?? existing.address).trim(),
          String(body.domain ?? existing.domain).trim(),
          String(body.hosting ?? existing.hosting).trim(),
          String(body.folder_ref ?? existing.folder_ref).trim(),
          plan,
          quota,
          Number(body.bonus_credits ?? existing.bonus_credits ?? 0),
          String(body.notes ?? existing.notes).trim(),
          now,
          id
        )
        .run();
      const client = await env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first();
      return jsonResponse({ ok: true, client });
    }
    if (method === 'DELETE') {
      await env.DB.prepare('DELETE FROM clients WHERE id = ?').bind(id).run();
      return jsonResponse({ ok: true });
    }
  }

  /* ---------- Briefings recebidos ---------- */
  if (path === '/api/briefings' && method === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM briefings ORDER BY created_at DESC LIMIT 200').all();
    const briefings = (results || []).map((b) => ({ ...b, answers: safeJsonParse(b.answers_json, {}) }));
    return jsonResponse({ briefings });
  }

  const briefingMatch = path.match(/^\/api\/briefings\/([a-zA-Z0-9-]+)$/);
  if (briefingMatch) {
    const id = briefingMatch[1];
    if (method === 'PUT') {
      const body = await request.json().catch(() => ({}));
      await env.DB.prepare('UPDATE briefings SET status = ? WHERE id = ?')
        .bind(String(body.status || 'analisado'), id)
        .run();
      return jsonResponse({ ok: true });
    }
    if (method === 'DELETE') {
      await env.DB.prepare('DELETE FROM briefings WHERE id = ?').bind(id).run();
      return jsonResponse({ ok: true });
    }
  }

  /* ---------- Kanban de Projetos ---------- */
  if (path === '/api/projects' && method === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM projects ORDER BY updated_at DESC LIMIT 300').all();
    return jsonResponse({ projects: results || [] });
  }

  if (path === '/api/projects' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const stage = String(body.stage || 'lead_briefing');
    const publishedAt =
      body.published_at || (stage === 'publicado_manutencao' ? now.slice(0, 10) : null);
    await env.DB.prepare(
      `INSERT INTO projects (
        id, client_id, proposal_id, title, client_name, stage, value, published_at, followup_15_done, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`
    )
      .bind(
        id,
        body.client_id || null,
        body.proposal_id || null,
        String(body.title || 'Novo Projeto').trim(),
        String(body.client_name || '').trim(),
        stage,
        Number(body.value || 0),
        publishedAt,
        String(body.notes || '').trim(),
        now,
        now
      )
      .run();
    const project = await env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
    return jsonResponse({ ok: true, project }, 201);
  }

  const projectMatch = path.match(/^\/api\/projects\/([a-zA-Z0-9-]+)$/);
  if (projectMatch) {
    const id = projectMatch[1];
    if (method === 'PUT') {
      const existing = await env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
      if (!existing) return jsonResponse({ error: 'Projeto não encontrado.' }, 404);
      const body = await request.json().catch(() => ({}));
      const now = new Date().toISOString();
      const stage = String(body.stage ?? existing.stage);
      let publishedAt = body.published_at !== undefined ? body.published_at : existing.published_at;
      if (stage === 'publicado_manutencao' && !publishedAt) {
        publishedAt = now.slice(0, 10);
      }
      await env.DB.prepare(
        `UPDATE projects SET
          title = ?, client_name = ?, stage = ?, value = ?, published_at = ?,
          followup_15_done = ?, notes = ?, updated_at = ?
        WHERE id = ?`
      )
        .bind(
          String(body.title ?? existing.title).trim(),
          String(body.client_name ?? existing.client_name).trim(),
          stage,
          Number(body.value ?? existing.value ?? 0),
          publishedAt,
          body.followup_15_done !== undefined ? Number(body.followup_15_done ? 1 : 0) : Number(existing.followup_15_done || 0),
          String(body.notes ?? existing.notes).trim(),
          now,
          id
        )
        .run();
      const project = await env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
      return jsonResponse({ ok: true, project });
    }
    if (method === 'DELETE') {
      await env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
      return jsonResponse({ ok: true });
    }
  }

  /* ---------- Manutenção Mensal e Regra de Cota (30–45 min) ---------- */
  if (path === '/api/maintenance' && method === 'GET') {
    const monthKey = url.searchParams.get('month') || new Date().toISOString().slice(0, 7);
    const { results } = await env.DB.prepare(
      'SELECT * FROM maintenance_logs WHERE month_key = ? ORDER BY created_at DESC LIMIT 300'
    )
      .bind(monthKey)
      .all();
    return jsonResponse({ month: monthKey, logs: results || [] });
  }

  if (path === '/api/maintenance' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const monthKey = String(body.month_key || now.slice(0, 7));
    const isBonus = body.is_bonus ? 1 : 0;
    const minutes = Math.max(0, Number(body.minutes || 30));
    // Regra oficial PRD: até 45 min = 1 atendimento; > 45 min = múltiplo proporcional (ex.: 46-90 min = 2)
    const creditsDebited = isBonus
      ? -2
      : body.credits_debited !== undefined
      ? Number(body.credits_debited)
      : Math.max(1, Math.ceil(minutes / 45));

    await env.DB.prepare(
      `INSERT INTO maintenance_logs (
        id, client_id, month_key, description, minutes, credits_debited, is_bonus, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        String(body.client_id),
        monthKey,
        String(body.description || (isBonus ? 'Bônus Programa de Indicação (+2 atendimentos grátis)' : 'Atendimento de manutenção')).trim(),
        minutes,
        creditsDebited,
        isBonus,
        now
      )
      .run();

    const log = await env.DB.prepare('SELECT * FROM maintenance_logs WHERE id = ?').bind(id).first();
    return jsonResponse({ ok: true, log }, 201);
  }

  const maintMatch = path.match(/^\/api\/maintenance\/([a-zA-Z0-9-]+)$/);
  if (maintMatch && method === 'DELETE') {
    await env.DB.prepare('DELETE FROM maintenance_logs WHERE id = ?').bind(maintMatch[1]).run();
    return jsonResponse({ ok: true });
  }

  /* ---------- Backup Completo da Base (JSON / CSV) ---------- */
  if (path === '/api/backup' && method === 'GET') {
    const [clients, briefings, proposals, projects, maintenance, profileRaw] = await Promise.all([
      env.DB.prepare('SELECT * FROM clients ORDER BY created_at DESC').all(),
      env.DB.prepare('SELECT * FROM briefings ORDER BY created_at DESC').all(),
      env.DB.prepare('SELECT * FROM proposals ORDER BY created_at DESC').all(),
      env.DB.prepare('SELECT * FROM projects ORDER BY created_at DESC').all(),
      env.DB.prepare('SELECT * FROM maintenance_logs ORDER BY created_at DESC').all(),
      getSetting(env.DB, 'provider_profile')
    ]);
    return jsonResponse({
      exported_at: new Date().toISOString(),
      brand: 'VibeTech|CMD',
      provider_profile: safeJsonParse(profileRaw, {}),
      clients: clients.results || [],
      briefings: briefings.results || [],
      proposals: proposals.results || [],
      projects: projects.results || [],
      maintenance_logs: maintenance.results || []
    });
  }

  return jsonResponse({ error: 'Rota não encontrada.' }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env, url);
    }

    if (url.pathname === '/admin') {
      return Response.redirect(`${url.origin}/admin/`, 302);
    }

    if (url.pathname === '/briefing') {
      return Response.redirect(`${url.origin}/briefing/`, 302);
    }

    return env.ASSETS.fetch(request);
  }
};
