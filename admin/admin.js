/* ==========================================================================
   VibeTech|CMD — Controlador Completo do Ecossistema Master (5 Módulos PRD)
   ========================================================================== */

(() => {
  'use strict';

  const PRD = window.VT_PRD;
  const { CATALOG, ADDONS, MAINTENANCE_PLANS, KANBAN_STAGES, formatBRL, computeInstallments, buildFullContractText } = PRD;

  /* ---------- Estado Global ---------- */
  let providerProfile = {
    companyName: 'VibeTech|CMD',
    ownerName: 'Cleisson Martins Diogo',
    document: '',
    address: 'Macaé – RJ',
    city: 'Macaé',
    state: 'RJ',
    whatsapp: '(22) 99916-2793',
    email: 'cleisson.md@gmail.com',
    pixKey: '',
    website: 'https://vibetechcmd.com.br'
  };

  let allProposals = [];
  let allClients = [];
  let allBriefings = [];
  let allProjects = [];
  let allMaintLogs = [];
  let currentMonthKey = new Date().toISOString().slice(0, 7);

  let currentId = null;
  let currentCode = 'NOVO';
  let isSetupMode = false;

  /* ---------- Utilitários ---------- */
  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(d = new Date()) {
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function addDays(date, days) {
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + days);
    return d;
  }

  let toastTimer = 0;
  function showToast(msg) {
    const el = document.getElementById('admin-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3400);
  }

  async function api(path, options = {}) {
    const res = await fetch(path, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Erro HTTP ${res.status}`);
    return data;
  }

  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /* ---------- Elementos ---------- */
  const authScreen = document.getElementById('auth-screen');
  const appShell = document.getElementById('app-shell');
  const authTitle = document.getElementById('auth-title');
  const authDesc = document.getElementById('auth-desc');
  const authError = document.getElementById('auth-error');
  const authForm = document.getElementById('auth-form');
  const authEmail = document.getElementById('auth-email');
  const authPassword = document.getElementById('auth-password');
  const authPassLabel = document.getElementById('auth-pass-label');
  const authConfirmWrap = document.getElementById('auth-confirm-wrap');
  const authPasswordConfirm = document.getElementById('auth-password-confirm');
  const authSubmit = document.getElementById('auth-submit');

  const fCrmSelect = document.getElementById('f-crm-select');
  const fClientName = document.getElementById('f-client-name');
  const fClientCompany = document.getElementById('f-client-company');
  const fClientDoc = document.getElementById('f-client-doc');
  const fClientWa = document.getElementById('f-client-wa');
  const fClientEmail = document.getElementById('f-client-email');
  const fClientAddr = document.getElementById('f-client-addr');
  const fPackage = document.getElementById('f-package');
  const fBasePrice = document.getElementById('f-base-price');
  const fProjectTitle = document.getElementById('f-project-title');
  const fProjectSummary = document.getElementById('f-project-summary');
  const fScopeDesc = document.getElementById('f-scope-desc');
  const addonsGrid = document.getElementById('addons-grid');
  const fFooterWaiver = document.getElementById('f-footer-waiver');
  const fUrgency = document.getElementById('f-urgency');
  const fDiscountPct = document.getElementById('f-discount-pct');
  const fAuditCredit = document.getElementById('f-audit-credit');
  const fDelivery = document.getElementById('f-delivery');
  const fRevisions = document.getElementById('f-revisions');
  const fStatus = document.getElementById('f-status');
  const fContractClauses = document.getElementById('f-contract-clauses');

  const quotePreviewDoc = document.getElementById('quote-preview-doc');
  const contractPreviewDoc = document.getElementById('contract-preview-doc');
  const editorCodeBadge = document.getElementById('editor-code-badge');
  const contractCodeBadge = document.getElementById('contract-code-badge');

  /* ---------- Inicialização de selects e checkboxes PRD ---------- */
  function initCatalogControls() {
    fPackage.innerHTML = '';
    CATALOG.forEach((pkg) => {
      const opt = document.createElement('option');
      opt.value = pkg.id;
      opt.textContent = `${pkg.name} — ${formatBRL(pkg.price)}`;
      fPackage.appendChild(opt);
    });

    addonsGrid.innerHTML = '';
    ADDONS.forEach((ad) => {
      const lbl = document.createElement('label');
      lbl.className = 'addon-check';
      lbl.innerHTML = `<input type="checkbox" data-addon-id="${esc(ad.id)}"><span>${esc(ad.label)} <b>+${esc(formatBRL(ad.price))}</b></span>`;
      lbl.querySelector('input').addEventListener('change', renderProposalAndContract);
      addonsGrid.appendChild(lbl);
    });
  }

  function applyCatalogPackage(pkgId) {
    const pkg = CATALOG.find((c) => c.id === pkgId) || CATALOG[0];
    fPackage.value = pkg.id;
    fBasePrice.value = pkg.price;
    fProjectTitle.value = pkg.name;
    fScopeDesc.value = pkg.scope;
    fDelivery.value = pkg.deadline;
    fRevisions.value = pkg.revisions;
    if (!fProjectSummary.value.trim()) {
      fProjectSummary.value = `Desenvolvimento de ${pkg.name} focado em fortalecer a presença digital, transmitir autoridade e facilitar o contato de novos clientes.`;
    }
    renderProposalAndContract();
  }

  /* ---------- Cálculo Financeiro Oficial (Regras 2.1 e 2.2) ---------- */
  function readProposalState() {
    const basePrice = Math.max(0, Number(fBasePrice.value || 0));
    const selectedAddons = [];
    addonsGrid.querySelectorAll('input[data-addon-id]:checked').forEach((chk) => {
      const found = ADDONS.find((a) => a.id === chk.dataset.addonId);
      if (found) selectedAddons.push(found);
    });

    const addonsSum = selectedAddons.reduce((a, b) => a + b.price, 0);
    const footerWaiver = Boolean(fFooterWaiver.checked);
    const footerFee = footerWaiver ? Math.max(250, Math.round(basePrice * 0.2 * 100) / 100) : 0;

    const urgencyPct = Math.max(0, Number(fUrgency.value || 0));
    const urgencyFee = Math.round((basePrice + addonsSum) * (urgencyPct / 100) * 100) / 100;

    const extrasTotal = addonsSum + footerFee + urgencyFee;
    const grossTotal = basePrice + extrasTotal;

    const discountPct = Math.min(10, Math.max(0, Number(fDiscountPct.value || 0)));
    const discountPctValue = Math.round(grossTotal * (discountPct / 100) * 100) / 100;
    const auditCredit = Math.max(0, Number(fAuditCredit.value || 0));
    const totalDiscount = discountPctValue + auditCredit;
    const totalValue = Math.max(0, Math.round((grossTotal - totalDiscount) * 100) / 100);

    const items = [{ desc: `${fProjectTitle.value.trim() || 'Projeto Principal'} — ${fScopeDesc.value.trim()}`, price: basePrice }];
    selectedAddons.forEach((a) => items.push({ desc: `Adicional: ${a.label}`, price: a.price }));
    if (footerWaiver) items.push({ desc: 'Isenção de crédito no rodapé (vibetechcmd.com.br)', price: footerFee });
    if (urgencyPct > 0) items.push({ desc: `Taxa de urgência (+${urgencyPct}%)`, price: urgencyFee });

    const inst = computeInstallments(totalValue);

    return {
      id: currentId,
      code: currentCode,
      status: fStatus.value || 'rascunho',
      template_id: fPackage.value || 'lp-basic',
      client_name: fClientName.value.trim(),
      client_company: fClientCompany.value.trim(),
      client_document: fClientDoc.value.trim(),
      client_whatsapp: fClientWa.value.trim(),
      client_email: fClientEmail.value.trim(),
      project_title: fProjectTitle.value.trim() || 'Projeto Digital VibeTech|CMD',
      project_summary: fProjectSummary.value.trim(),
      items,
      discount: totalDiscount,
      total_value: totalValue,
      delivery_days: fDelivery.value.trim() || 'Até 15 dias',
      validity_days: 7,
      payment_terms: inst.rule,
      notes: '',
      contract_clauses: fContractClauses.value,
      provider: providerProfile,
      meta: {
        client_id: fCrmSelect.value || '',
        client_address: fClientAddr.value.trim(),
        package_name: fProjectTitle.value.trim(),
        scope_desc: fScopeDesc.value.trim(),
        base_price: basePrice,
        addons_ids: selectedAddons.map((a) => a.id),
        addons_labels: selectedAddons.map((a) => a.label),
        footer_waiver: footerWaiver,
        footer_fee: footerFee,
        urgency_pct: urgencyPct,
        urgency_fee: urgencyFee,
        extras_total: extrasTotal,
        discount_pct: discountPct,
        audit_credit: auditCredit,
        revisions_count: Number(fRevisions.value || 2)
      }
    };
  }

  /* ---------- Renderização dos Templates Oficiais A4 (Seções 4 e 5) ---------- */
  function renderProposalAndContract() {
    const s = readProposalState();
    const inst = computeInstallments(s.total_value);
    const today = new Date();
    const validUntil = addDays(today, 7);

    editorCodeBadge.textContent = currentId ? currentCode : 'Nova Proposta';
    contractCodeBadge.textContent = currentId ? currentCode : 'Contrato Oficial';

    const addonsListText = [
      ...(s.meta.addons_labels || []),
      ...(s.meta.footer_waiver ? ['Isenção de crédito no rodapé'] : [])
    ].join(', ') || 'Nenhum';

    // MÓDULO 2 — MODELO OFICIAL DA SEÇÃO 4
    quotePreviewDoc.innerHTML = `
      <div class="doc-header">
        <div class="doc-brand">
          <img src="/assets/vibetech-logo.svg" alt="VibeTech|CMD">
          <div>
            <h3>VIBETECH|CMD</h3>
            <small>Estúdio Digital de Webdesign e Desenvolvimento Web · 100% Remoto</small>
          </div>
        </div>
        <div class="doc-meta-right">
          <strong>PROPOSTA COMERCIAL Nº ${esc(s.code)}</strong>
          <div>Emissão: ${esc(formatDate(today))}</div>
          <div>Validade: ${esc(formatDate(validUntil))} (7 dias corridos)</div>
        </div>
      </div>

      <div class="doc-body">
        <div class="doc-parties">
          <div class="doc-box">
            <b>1. Dados do Cliente</b>
            <div><strong>${esc(s.client_name || 'Nome do Cliente')}${s.client_company ? ` — ${esc(s.client_company)}` : ''}</strong></div>
            <div>WhatsApp: ${esc(s.client_whatsapp || '—')}</div>
            <div>E-mail: ${esc(s.client_email || '—')}</div>
          </div>
          <div class="doc-box">
            <b>2. Objetivo do Projeto</b>
            <div>${esc(s.project_summary || 'Construir presença digital profissional, rápida e focada em conversão.')}</div>
          </div>
        </div>

        <div class="doc-box" style="margin-bottom:14px;">
          <b>3. Escopo Detalhado (O que está incluído)</b>
          <div>• <strong>Categoria / Pacote:</strong> ${esc(s.project_title)}</div>
          <div>• <strong>Estrutura prevista:</strong> ${esc(s.meta.scope_desc || 'Conforme alinhamento.')}</div>
          <div>• Design responsivo adaptado para celulares, tablets e computadores.</div>
          <div>• Botão de direcionamento direto para WhatsApp e links de redes sociais.</div>
          <div>• Estrutura básica de contato.</div>
          <div>• <strong>Adicionais selecionados:</strong> ${esc(addonsListText)}</div>
        </div>

        <div class="bonus-box">
          <b>★ BÔNUS EXCLUSIVO VIBETECH|CMD (INCLUSO SEM CUSTO ADICIONAL) ★</b>
          • Publicação inicial do projeto no ar (configuração técnica no provedor/domínio);<br>
          • Configuração de SEO básico (títulos, descrições e estrutura amigável ao Google);<br>
          • Configuração inicial de métricas básicas;<br>
          • Janela operacional de até +5 (cinco) dias após a entrega final para validação completa de operacionalidade e estabilidade no ar.
        </div>

        <div class="doc-box" style="margin-bottom:14px;">
          <b>4. O que não está incluído (Itens externos ou opcionais)</b>
          <div>• Compra/renovação de domínio próprio e planos pagos de hospedagem ou serviços externos (titularidade e custeio do cliente).</div>
          <div>• Produção fotográfica, vídeos, criação de logomarca/identidade visual completa ou copywriting integral (salvo se contratado nos adicionais).</div>
          <div>• Chatbots, WhatsApp API, CRM, integrações ou funcionalidades não descritas no item 3.</div>
        </div>

        <div class="doc-box" style="margin-bottom:14px;">
          <b>5. Processo de Execução, Revisões e Prazos</b>
          <div>• <strong>Fluxo em 3 etapas:</strong> (1) Alinhamento/Onboarding + Brainstorm; (2) 1ª Prévia e Revisão; (3) Validação Final e Publicação.</div>
          <div>• <strong>Revisões incluídas:</strong> ${esc(s.meta.revisions_count)} rodadas estruturadas dentro do escopo. Rodadas extras ou aditivos: taxa mínima de R$ 150,00.</div>
          <div>• <strong>Prazo estimado:</strong> ${esc(s.delivery_days)} (iniciado após pagamento inicial + envio dos materiais + Brainstorm validado) + janela bônus de até 5 dias para publicação.</div>
          <div>• <strong>Garantia técnica pós-entrega:</strong> 30 dias para correção de bugs visuais, falhas funcionais e erros pontuais de digitação.</div>
        </div>

        <table class="doc-table">
          <thead><tr><th>6. Investimento e Condições de Pagamento (Pix)</th><th>Valor</th></tr></thead>
          <tbody>
            <tr><td>Valor Base do Projeto (${esc(s.project_title)})</td><td>${esc(formatBRL(s.meta.base_price))}</td></tr>
            <tr><td>Adicionais / Urgência / Isenção de Rodapé</td><td>${esc(formatBRL(s.meta.extras_total))}</td></tr>
            ${s.discount > 0 ? `<tr><td>Desconto Comercial (${esc(s.meta.discount_pct)}%)${s.meta.audit_credit > 0 ? ' + Abatimento Auditoria' : ''}</td><td>- ${esc(formatBRL(s.discount))}</td></tr>` : ''}
          </tbody>
        </table>

        <div class="doc-totals">
          <div class="doc-totals-row grand"><span>VALOR TOTAL</span><span>${esc(formatBRL(s.total_value))}</span></div>
        </div>

        <div class="doc-conditions">
          <div><strong>Forma de Pagamento via Pix (${esc(inst.rule)}):</strong></div>
          <div style="white-space:pre-line;margin:4px 0 8px;">${esc(inst.proposalText)}</div>
          <small style="color:#475569;">*A publicação definitiva no domínio oficial e/ou entrega do código-fonte ocorrerá exclusivamente após a confirmação da parcela final. Documentação emitida mediante Contrato de Prestação de Serviços e recibo/comprovante Pix.*</small>
        </div>

        <div class="doc-box" style="margin-top:14px;">
          <b>7. Opcional — Planos de Manutenção Mensal (Pós-Garantia)</b>
          <div>• <strong>Básico</strong> (1 a 2 atendimentos/mês): R$ 80,00/mês</div>
          <div>• <strong>Médio</strong> (2 a 4 atendimentos/mês — economize R$ 10/mês): R$ 150,00/mês</div>
          <div>• <strong>Avançado</strong> (até 10 atendimentos/mês — SUPER ECONOMIA DE R$ 100/mês / 25% OFF): R$ 300,00/mês</div>
          <small style="color:#64748b;">*(Cada atendimento cobre solicitações agrupadas de ajustes simples de 30 a 45 min).*</small>
        </div>
      </div>

      <div class="doc-footer">
        <span>VibeTech|CMD · https://vibetechcmd.com.br</span>
        <span>WhatsApp ${esc(providerProfile.whatsapp)} · Validade 7 dias corridos</span>
      </div>
    `;

    // MÓDULO 3 — CONTRATO INTEGRAL DA SEÇÃO 5
    const contractText = s.contract_clauses.trim() || buildFullContractText(s, providerProfile);
    contractPreviewDoc.innerHTML = `
      <div class="doc-header">
        <div class="doc-brand">
          <img src="/assets/vibetech-logo.svg" alt="VibeTech|CMD">
          <div>
            <h3>CONTRATO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS</h3>
            <small>Webdesign e Desenvolvimento Web · VibeTech|CMD</small>
          </div>
        </div>
        <div class="doc-meta-right">
          <strong>CONTRATO Nº ${esc(s.code)}</strong>
          <div>Base: Lei 10.406/02 · Lei 9.609/98 · LGPD</div>
        </div>
      </div>

      <div class="doc-body">
        <div class="doc-clauses">${esc(contractText)}</div>

        <div class="doc-signatures">
          <div class="sig-line">
            <strong>CONTRATADA: ${esc(providerProfile.ownerName || 'Cleisson Martins Diogo')}</strong><br>
            VibeTech|CMD | CPF: ${esc(providerProfile.document || '—')}
          </div>
          <div class="sig-line">
            <strong>CONTRATANTE: ${esc(s.client_name || '—')}</strong><br>
            CPF/CNPJ: ${esc(s.client_document || '—')}
          </div>
        </div>
      </div>

      <div class="doc-footer">
        <span>VibeTech|CMD · https://vibetechcmd.com.br</span>
        <span>Contrato Nº ${esc(s.code)} · Foro de Macaé – RJ</span>
      </div>
    `;
  }

  /* ---------- Salvar Proposta/Contrato no D1 ---------- */
  async function saveProposal(overrideStatus) {
    const s = readProposalState();
    if (!s.client_name) {
      showToast('Preencha o nome do cliente antes de salvar.');
      fClientName.focus();
      return null;
    }
    if (overrideStatus) {
      s.status = overrideStatus;
      fStatus.value = overrideStatus;
    }
    if (!s.contract_clauses.trim()) {
      s.contract_clauses = buildFullContractText(s, providerProfile);
      fContractClauses.value = s.contract_clauses;
    }
    try {
      const res = currentId
        ? await api(`/api/proposals/${currentId}`, { method: 'PUT', body: JSON.stringify(s) })
        : await api('/api/proposals', { method: 'POST', body: JSON.stringify(s) });
      if (res.proposal) {
        currentId = res.proposal.id;
        currentCode = res.proposal.code;
        await refreshAllData();
        renderProposalAndContract();
        showToast(`Salvo no Cloudflare D1 (${currentCode})!`);
        return res.proposal;
      }
    } catch (err) {
      showToast(err.message || 'Erro ao salvar proposta.');
    }
    return null;
  }

  function loadProposalIntoEditor(p, tab = 'quote') {
    currentId = p.id;
    currentCode = p.code || 'VT';
    const m = p.meta || {};
    fCrmSelect.value = m.client_id || '';
    fClientName.value = p.client_name || '';
    fClientCompany.value = p.client_company || '';
    fClientDoc.value = p.client_document || '';
    fClientWa.value = p.client_whatsapp || '';
    fClientEmail.value = p.client_email || '';
    fClientAddr.value = m.client_address || '';
    if (CATALOG.some((c) => c.id === p.template_id)) fPackage.value = p.template_id;
    fBasePrice.value = m.base_price ?? p.total_value ?? 950;
    fProjectTitle.value = p.project_title || '';
    fProjectSummary.value = p.project_summary || '';
    fScopeDesc.value = m.scope_desc || '';
    fFooterWaiver.checked = Boolean(m.footer_waiver);
    fUrgency.value = String(m.urgency_pct || 0);
    fDiscountPct.value = Number(m.discount_pct || 0);
    fAuditCredit.value = Number(m.audit_credit || 0);
    fDelivery.value = p.delivery_days || 'Até 15 dias';
    fRevisions.value = Number(m.revisions_count || 2);
    fStatus.value = p.status || 'rascunho';

    const checkedIds = new Set(m.addons_ids || []);
    addonsGrid.querySelectorAll('input[data-addon-id]').forEach((chk) => {
      chk.checked = checkedIds.has(chk.dataset.addonId);
    });

    fContractClauses.value = p.contract_clauses || buildFullContractText(readProposalState(), providerProfile);
    renderProposalAndContract();
    switchTab(tab);
  }

  /* ---------- Renderização do Dashboard + Alerta Dia 15 ---------- */
  function renderDashboard() {
    const nowMonth = new Date().toISOString().slice(0, 7);
    const closedStatuses = new Set(['validado', 'contrato_gerado']);

    const monthRev = allProposals
      .filter((p) => closedStatuses.has(p.status) && String(p.updated_at || '').startsWith(nowMonth))
      .reduce((acc, p) => acc + Number(p.total_value || 0), 0);

    const activeMaintClients = allClients.filter((c) => c.maintenance_plan && c.maintenance_plan !== 'nenhum');
    const mrr = activeMaintClients.reduce((acc, c) => acc + (MAINTENANCE_PLANS[c.maintenance_plan]?.price || 0), 0);
    const maintCount = allMaintLogs.filter((l) => !l.is_bonus).length;

    document.getElementById('kpi-month-rev').textContent = formatBRL(monthRev);
    document.getElementById('kpi-goal-status').textContent =
      monthRev >= 500 ? 'Meta de R$ 500/mês batida!' : monthRev >= 300 ? 'Dentro da meta (R$ 300–500/mês)' : 'Meta Fase 1: R$ 300 a R$ 500/mês';
    document.getElementById('kpi-mrr').textContent = formatBRL(mrr);
    document.getElementById('kpi-mrr-clients').textContent = `${activeMaintClients.length} plano(s) ativo(s)`;
    document.getElementById('kpi-projects').textContent = String(allProjects.length);
    document.getElementById('kpi-briefings').textContent = `${allBriefings.length} briefing(s) recebido(s)`;
    document.getElementById('kpi-maint-count').textContent = String(maintCount);

    // Alerta Dia 15 Pós-Venda
    const day15List = document.getElementById('day15-alert-list');
    const day15Box = document.getElementById('day15-alert-box');
    const dueProjects = allProjects.filter((p) => {
      if (!p.published_at || p.followup_15_done) return false;
      const diff = Math.floor((Date.now() - new Date(p.published_at).getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 15;
    });
    day15Box.classList.toggle('is-hidden', dueProjects.length === 0);
    day15List.innerHTML = '';
    dueProjects.forEach((p) => {
      const days = Math.floor((Date.now() - new Date(p.published_at).getTime()) / (1000 * 60 * 60 * 24));
      const row = document.createElement('div');
      row.className = 'alert-day15-item';
      const msg = `Olá${p.client_name ? `, ${p.client_name}` : ''}! Passando para saber como está sendo a experiência com o projeto "${p.title}" (já completou ${days} dias no ar!). Se puder deixar um depoimento rápido, ajuda muito! Aproveito para lembrar que temos planos de manutenção mensal a partir de R$ 80/mês para manter tudo sempre atualizado.`;
      row.innerHTML = `<div><strong>${esc(p.title)}</strong> (${days} dias no ar · Cliente: ${esc(p.client_name || '—')})</div><div style="display:flex;gap:8px;flex-wrap:wrap;"><a class="btn btn-success btn-sm" target="_blank" rel="noopener noreferrer" href="https://wa.me/?text=${encodeURIComponent(msg)}">Enviar Pós-Venda ↗</a><button type="button" class="btn btn-secondary btn-sm">Marcar feito ✓</button></div>`;
      row.querySelector('button').addEventListener('click', async () => {
        await api(`/api/projects/${p.id}`, { method: 'PUT', body: JSON.stringify({ followup_15_done: 1 }) });
        await refreshAllData();
        showToast('Acompanhamento Dia 15 marcado como concluído!');
      });
      day15List.appendChild(row);
    });

    // Gráfico de Faturamento dos últimos 6 meses
    const revChart = document.getElementById('revenue-chart');
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      const lbl = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      const val = allProposals
        .filter((p) => closedStatuses.has(p.status) && String(p.updated_at || '').startsWith(key))
        .reduce((a, p) => a + Number(p.total_value || 0), 0);
      months.push({ lbl, val });
    }
    const maxVal = Math.max(500, ...months.map((m) => m.val));
    revChart.innerHTML = months
      .map((m) => {
        const pct = Math.max(4, Math.round((m.val / maxVal) * 100));
        return `<div class="bar-col"><span class="bar-val">${m.val > 0 ? esc(formatBRL(m.val)) : '—'}</span><div class="bar-fill" style="height:${pct}%"></div><span class="bar-lbl">${esc(m.lbl)}</span></div>`;
      })
      .join('');

    // Distribuição Kanban
    const kbBars = document.getElementById('kanban-summary-bars');
    const totalProj = Math.max(1, allProjects.length);
    kbBars.innerHTML = KANBAN_STAGES.map((st) => {
      const count = allProjects.filter((p) => p.stage === st.id).length;
      const pct = Math.round((count / totalProj) * 100);
      return `<div><div style="display:flex;justify-content:space-between;font-size:.8rem;color:#dce4ed;"><span>${esc(st.label)}</span><strong>${count}</strong></div><div class="quota-bar"><div class="quota-fill" style="width:${pct}%"></div></div></div>`;
    }).join('');

    renderHistoryList();
  }

  function renderHistoryList() {
    const q = (document.getElementById('history-search').value || '').trim().toLowerCase();
    const filter = document.getElementById('history-filter').value || 'all';
    const labels = { rascunho: 'Rascunho', enviado: 'Enviado', validado: 'Validado', contrato_gerado: 'Contrato Gerado' };

    const list = allProposals.filter((p) => {
      if (filter !== 'all' && p.status !== filter) return false;
      if (!q) return true;
      return `${p.code} ${p.client_name} ${p.client_company} ${p.project_title}`.toLowerCase().includes(q);
    });

    const sum = list.reduce((a, p) => a + Number(p.total_value || 0), 0);
    document.getElementById('history-summary').textContent = `${list.length} proposta(s) · Total exibido: ${formatBRL(sum)}`;

    const grid = document.getElementById('history-grid');
    grid.innerHTML = '';
    if (!list.length) {
      grid.innerHTML = '<p style="color:#9eb0c8;font-size:.88rem;">Nenhuma proposta encontrada.</p>';
      return;
    }

    list.forEach((p) => {
      const card = document.createElement('article');
      card.className = 'history-card';
      card.innerHTML = `
        <div class="history-top"><span class="code-tag">${esc(p.code)}</span><span class="status-badge st-${esc(p.status)}">${esc(labels[p.status] || p.status)}</span></div>
        <h3>${esc(p.client_name)}${p.client_company ? ` · ${esc(p.client_company)}` : ''}</h3>
        <div class="history-meta">${esc(p.project_title)}</div>
        <div class="history-price">${esc(formatBRL(p.total_value))}</div>
        <div class="history-actions"></div>
      `;
      const act = card.querySelector('.history-actions');
      const b1 = document.createElement('button');
      b1.className = 'btn btn-primary btn-sm';
      b1.textContent = 'Orçamento';
      b1.onclick = () => loadProposalIntoEditor(p, 'quote');

      const b2 = document.createElement('button');
      b2.className = 'btn btn-success btn-sm';
      b2.textContent = 'Contrato';
      b2.onclick = () => loadProposalIntoEditor(p, 'contract');

      const b3 = document.createElement('button');
      b3.className = 'btn btn-danger btn-sm';
      b3.textContent = 'Excluir';
      b3.onclick = async () => {
        if (!confirm(`Excluir ${p.code}?`)) return;
        await api(`/api/proposals/${p.id}`, { method: 'DELETE' });
        await refreshAllData();
        showToast(`${p.code} excluído.`);
      };
      act.append(b1, b2, b3);
      grid.appendChild(card);
    });
  }

  /* ---------- Renderização CRM, Kanban & Briefings ---------- */
  function renderCrmAndKanban() {
    // Select de clientes no Gerador de Orçamentos e na Manutenção
    fCrmSelect.innerHTML = '<option value="">— Preenchimento manual —</option>';
    const mClientSel = document.getElementById('m-client');
    mClientSel.innerHTML = '<option value="">Selecione o cliente...</option>';
    allClients.forEach((c) => {
      const label = `${c.name}${c.company ? ` (${c.company})` : ''}`;
      const o1 = document.createElement('option');
      o1.value = c.id;
      o1.textContent = label;
      fCrmSelect.appendChild(o1);

      const o2 = document.createElement('option');
      o2.value = c.id;
      o2.textContent = `${label} · ${MAINTENANCE_PLANS[c.maintenance_plan]?.label || 'Sem plano'}`;
      mClientSel.appendChild(o2);
    });

    // Briefings recebidos
    const bList = document.getElementById('briefings-list');
    bList.innerHTML = '';
    if (!allBriefings.length) {
      bList.innerHTML = '<p style="color:#9eb0c8;font-size:.86rem;">Nenhum briefing recebido ainda. Compartilhe <strong>https://vibetechcmd.com.br/briefing</strong> com seus leads!</p>';
    } else {
      allBriefings.forEach((b) => {
        const card = document.createElement('article');
        card.className = 'history-card';
        card.innerHTML = `
          <div class="history-top"><span class="code-tag">Trilha: ${esc(b.track)}</span><span class="status-badge st-enviado">${esc(b.status)}</span></div>
          <h3>${esc(b.client_name)}${b.client_company ? ` · ${esc(b.client_company)}` : ''}</h3>
          <div class="history-meta">${esc(b.client_whatsapp)} ${b.client_email ? `· ${esc(b.client_email)}` : ''}</div>
          <div class="history-actions"></div>
        `;
        const act = card.querySelector('.history-actions');
        const bView = document.createElement('button');
        bView.className = 'btn btn-secondary btn-sm';
        bView.textContent = 'Ver Resumo';
        bView.onclick = () => alert(b.brainstorm_summary || 'Sem resumo.');

        const bProp = document.createElement('button');
        bProp.className = 'btn btn-primary btn-sm';
        bProp.textContent = 'Montar Orçamento →';
        bProp.onclick = () => {
          currentId = null;
          currentCode = 'NOVO';
          fClientName.value = b.client_name || '';
          fClientCompany.value = b.client_company || '';
          fClientWa.value = b.client_whatsapp || '';
          fClientEmail.value = b.client_email || '';
          fProjectSummary.value = (b.answers?.business_goal || b.answers?.new_goals || b.answers?.brand_base || '').slice(0, 320);
          renderProposalAndContract();
          switchTab('quote');
        };
        act.append(bView, bProp);
        bList.appendChild(card);
      });
    }

    // Kanban 5 Colunas
    const board = document.getElementById('kanban-board');
    board.innerHTML = '';
    KANBAN_STAGES.forEach((stage, sIdx) => {
      const col = document.createElement('div');
      col.className = 'kanban-col';
      const items = allProjects.filter((p) => p.stage === stage.id);
      col.innerHTML = `<div class="kanban-col-head"><span>${esc(stage.label)}</span><span>${items.length}</span></div>`;
      items.forEach((p) => {
        const card = document.createElement('div');
        card.className = 'kanban-card';
        card.innerHTML = `<strong>${esc(p.title)}</strong><small>${esc(p.client_name || 'Cliente')}${p.value ? ` · ${esc(formatBRL(p.value))}` : ''}</small>${p.published_at ? `<small style="color:#00D6A0;">Publicado: ${esc(p.published_at)}</small>` : ''}<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:4px;"></div>`;
        const btns = card.querySelector('div');
        if (sIdx > 0) {
          const prev = document.createElement('button');
          prev.className = 'btn btn-secondary btn-sm';
          prev.textContent = '←';
          prev.onclick = async () => {
            await api(`/api/projects/${p.id}`, { method: 'PUT', body: JSON.stringify({ stage: KANBAN_STAGES[sIdx - 1].id }) });
            await refreshAllData();
          };
          btns.appendChild(prev);
        }
        if (sIdx < KANBAN_STAGES.length - 1) {
          const next = document.createElement('button');
          next.className = 'btn btn-primary btn-sm';
          next.textContent = 'Avançar →';
          next.onclick = async () => {
            await api(`/api/projects/${p.id}`, { method: 'PUT', body: JSON.stringify({ stage: KANBAN_STAGES[sIdx + 1].id }) });
            await refreshAllData();
          };
          btns.appendChild(next);
        }
        const del = document.createElement('button');
        del.className = 'btn btn-danger btn-sm';
        del.textContent = '×';
        del.onclick = async () => {
          if (!confirm(`Remover "${p.title}" do Kanban?`)) return;
          await api(`/api/projects/${p.id}`, { method: 'DELETE' });
          await refreshAllData();
        };
        btns.appendChild(del);
        col.appendChild(card);
      });
      board.appendChild(col);
    });

    // Cards CRM Clientes
    const cGrid = document.getElementById('clients-grid');
    cGrid.innerHTML = '';
    allClients.forEach((c) => {
      const waDigits = (c.whatsapp || '').replace(/\D/g, '');
      const card = document.createElement('article');
      card.className = 'history-card';
      card.innerHTML = `
        <div class="history-top"><span class="code-tag">${esc(MAINTENANCE_PLANS[c.maintenance_plan]?.label || 'Sem plano')}</span>${c.domain ? `<span class="status-badge st-validado">${esc(c.domain)}</span>` : ''}</div>
        <h3>${esc(c.name)}${c.company ? ` · ${esc(c.company)}` : ''}</h3>
        <div class="history-meta">${c.whatsapp ? `<a href="https://wa.me/55${esc(waDigits)}" target="_blank" style="color:#00D6A0;">WhatsApp: ${esc(c.whatsapp)} ↗</a>` : ''}${c.hosting ? ` · Host: ${esc(c.hosting)}` : ''}</div>
        ${c.folder_ref ? `<div class="history-meta" style="font-size:.75rem;">📁 ${esc(c.folder_ref)}</div>` : ''}
        <div class="history-actions"></div>
      `;
      const act = card.querySelector('.history-actions');
      const bEdit = document.createElement('button');
      bEdit.className = 'btn btn-secondary btn-sm';
      bEdit.textContent = 'Editar';
      bEdit.onclick = () => {
        document.getElementById('c-id').value = c.id;
        document.getElementById('c-name').value = c.name || '';
        document.getElementById('c-company').value = c.company || '';
        document.getElementById('c-doc').value = c.document || '';
        document.getElementById('c-wa').value = c.whatsapp || '';
        document.getElementById('c-email').value = c.email || '';
        document.getElementById('c-addr').value = c.address || '';
        document.getElementById('c-domain').value = c.domain || '';
        document.getElementById('c-hosting').value = c.hosting || '';
        document.getElementById('c-plan').value = c.maintenance_plan || 'nenhum';
        document.getElementById('c-folder').value = c.folder_ref || '';
        window.scrollTo({ top: document.getElementById('client-form').offsetTop - 90, behavior: 'smooth' });
      };
      const bQuote = document.createElement('button');
      bQuote.className = 'btn btn-primary btn-sm';
      bQuote.textContent = 'Orçar →';
      bQuote.onclick = () => {
        fCrmSelect.value = c.id;
        fillClientFromCrm(c.id);
        switchTab('quote');
      };
      act.append(bEdit, bQuote);
      cGrid.appendChild(card);
    });
  }

  function fillClientFromCrm(clientId) {
    const c = allClients.find((x) => x.id === clientId);
    if (!c) return;
    fClientName.value = c.name || '';
    fClientCompany.value = c.company || '';
    fClientDoc.value = c.document || '';
    fClientWa.value = c.whatsapp || '';
    fClientEmail.value = c.email || '';
    fClientAddr.value = c.address || '';
    renderProposalAndContract();
  }

  /* ---------- Renderização Manutenção (Cota 30–45 min + Indicação +2) ---------- */
  function renderMaintenance() {
    document.getElementById('maint-month-label').textContent = currentMonthKey;
    const quotasEl = document.getElementById('maint-clients-quotas');
    quotasEl.innerHTML = '';

    const activeClients = allClients.filter((c) => c.maintenance_plan && c.maintenance_plan !== 'nenhum');
    if (!activeClients.length) {
      quotasEl.innerHTML = '<p style="color:#9eb0c8;font-size:.86rem;">Nenhum cliente com plano de manutenção ativo ainda. Ative um plano na ficha do cliente em <strong>CRM &amp; Kanban</strong>.</p>';
    } else {
      activeClients.forEach((c) => {
        const logs = allMaintLogs.filter((l) => l.client_id === c.id);
        const bonus = logs.filter((l) => l.is_bonus).length * 2;
        const used = logs.filter((l) => !l.is_bonus).reduce((a, l) => a + Number(l.credits_debited || 1), 0);
        const totalQuota = (MAINTENANCE_PLANS[c.maintenance_plan]?.quota || 0) + bonus;
        const pct = totalQuota > 0 ? Math.min(100, Math.round((used / totalQuota) * 100)) : 0;

        const div = document.createElement('div');
        div.className = 'history-card';
        div.innerHTML = `
          <div class="history-top"><strong>${esc(c.name)}${c.company ? ` (${esc(c.company)})` : ''}</strong><span class="code-tag">${used} / ${totalQuota} atend.</span></div>
          <div class="quota-bar"><div class="quota-fill ${pct >= 90 ? 'is-warn' : ''}" style="width:${pct}%"></div></div>
          <small style="color:#9eb0c8;">${esc(MAINTENANCE_PLANS[c.maintenance_plan]?.label)}${bonus > 0 ? ` · +${bonus} bônus indicação` : ''}</small>
        `;
        quotasEl.appendChild(div);
      });
    }

    const logsEl = document.getElementById('maint-logs-list');
    logsEl.innerHTML = '';
    if (!allMaintLogs.length) {
      logsEl.innerHTML = '<p style="color:#9eb0c8;font-size:.84rem;">Nenhum atendimento registrado neste mês.</p>';
    } else {
      allMaintLogs.forEach((l) => {
        const cli = allClients.find((c) => c.id === l.client_id);
        const row = document.createElement('div');
        row.className = 'alert-day15-item';
        row.style.borderColor = 'rgba(120,170,235,.18)';
        row.innerHTML = `<div><strong>${esc(cli ? cli.name : 'Cliente')}</strong> — ${esc(l.description)}<br><small style="color:#9eb0c8;">${l.is_bonus ? '🎁 Bônus Indicação (+2 atendimentos)' : `⏱ ${l.minutes} min · Debitados: ${l.credits_debited} atendimento(s)`}</small></div><button type="button" class="btn btn-danger btn-sm">×</button>`;
        row.querySelector('button').onclick = async () => {
          await api(`/api/maintenance/${l.id}`, { method: 'DELETE' });
          await refreshAllData();
        };
        logsEl.appendChild(row);
      });
    }
  }

  /* ---------- Carregamento Global do D1 ---------- */
  async function refreshAllData() {
    const [profRes, propRes, cliRes, briRes, projRes, maintRes] = await Promise.all([
      api('/api/profile'),
      api('/api/proposals'),
      api('/api/clients'),
      api('/api/briefings'),
      api('/api/projects'),
      api(`/api/maintenance?month=${currentMonthKey}`)
    ]);

    if (profRes.profile) providerProfile = { ...providerProfile, ...profRes.profile };
    allProposals = propRes.proposals || [];
    allClients = cliRes.clients || [];
    allBriefings = briRes.briefings || [];
    allProjects = projRes.projects || [];
    allMaintLogs = maintRes.logs || [];

    document.getElementById('p-company').value = providerProfile.companyName || '';
    document.getElementById('p-owner').value = providerProfile.ownerName || 'Cleisson Martins Diogo';
    document.getElementById('p-doc').value = providerProfile.document || '';
    document.getElementById('p-pix').value = providerProfile.pixKey || '';
    document.getElementById('p-addr').value = providerProfile.address || 'Macaé – RJ';
    document.getElementById('p-city').value = providerProfile.city || 'Macaé';
    document.getElementById('p-state').value = providerProfile.state || 'RJ';
    document.getElementById('p-wa').value = providerProfile.whatsapp || '';
    document.getElementById('p-email').value = providerProfile.email || '';
    document.getElementById('p-web').value = providerProfile.website || '';

    renderDashboard();
    renderCrmAndKanban();
    renderMaintenance();
    renderProposalAndContract();
  }

  /* ---------- Abas & Eventos ---------- */
  function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-view').forEach((s) => s.classList.toggle('is-hidden', s.id !== `tab-${tab}`));
    if (tab === 'contract' && !fContractClauses.value.trim()) {
      fContractClauses.value = buildFullContractText(readProposalState(), providerProfile);
    }
    renderProposalAndContract();
  }

  document.querySelectorAll('.tab-btn').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));

  fPackage.addEventListener('change', () => applyCatalogPackage(fPackage.value));
  fCrmSelect.addEventListener('change', () => fillClientFromCrm(fCrmSelect.value));
  [fClientName, fClientCompany, fClientDoc, fClientWa, fClientEmail, fClientAddr, fBasePrice, fProjectTitle, fProjectSummary, fScopeDesc, fFooterWaiver, fUrgency, fDiscountPct, fAuditCredit, fDelivery, fRevisions, fStatus, fContractClauses].forEach((el) =>
    el.addEventListener('input', renderProposalAndContract)
  );

  document.getElementById('btn-new-proposal').addEventListener('click', () => {
    currentId = null;
    currentCode = 'NOVO';
    fCrmSelect.value = '';
    fClientName.value = '';
    fClientCompany.value = '';
    fClientDoc.value = '';
    fClientWa.value = '';
    fClientEmail.value = '';
    fClientAddr.value = '';
    fFooterWaiver.checked = false;
    fUrgency.value = '0';
    fDiscountPct.value = '0';
    fAuditCredit.value = '0';
    fStatus.value = 'rascunho';
    fContractClauses.value = '';
    addonsGrid.querySelectorAll('input').forEach((i) => (i.checked = false));
    applyCatalogPackage('lp-basic');
    switchTab('quote');
  });

  document.getElementById('btn-save-quote').addEventListener('click', () => saveProposal());
  document.getElementById('btn-save-contract').addEventListener('click', () => saveProposal('contrato_gerado'));
  document.getElementById('btn-validate-contract').addEventListener('click', async () => {
    const s = readProposalState();
    fContractClauses.value = buildFullContractText(s, providerProfile);
    const saved = await saveProposal('validado');
    if (saved) {
      switchTab('contract');
      showToast('Orçamento validado e Contrato das 14 cláusulas preenchido!');
    }
  });
  document.getElementById('btn-reset-clauses').addEventListener('click', () => {
    fContractClauses.value = buildFullContractText(readProposalState(), providerProfile);
    renderProposalAndContract();
    showToast('Cláusulas oficiais regeradas.');
  });

  const doPrint = (tab) => {
    switchTab(tab);
    setTimeout(() => window.print(), 120);
  };
  document.getElementById('btn-print-quote').onclick = () => doPrint('quote');
  document.getElementById('btn-print-quote-top').onclick = () => doPrint('quote');
  document.getElementById('btn-print-contract').onclick = () => doPrint('contract');
  document.getElementById('btn-print-contract-top').onclick = () => doPrint('contract');

  document.getElementById('btn-copy-wa').addEventListener('click', async () => {
    const s = readProposalState();
    const inst = computeInstallments(s.total_value);
    const txt = [
      `*PROPOSTA COMERCIAL VIBETECH|CMD* (${s.code})`,
      `Olá${s.client_name ? `, ${s.client_name}` : ''}! Segue o resumo do seu orçamento:`,
      `• *Pacote:* ${s.project_title}`,
      `• *Prazo:* ${s.delivery_days} (+ até 5 dias bônus de publicação/SEO)`,
      `• *Investimento Total:* *${formatBRL(s.total_value)}*`,
      `• *Pagamento (Pix):* ${inst.rule}`,
      inst.proposalText,
      `• *Validade:* 7 dias corridos`,
      `Estou enviando o PDF completo logo abaixo!`
    ].join('\n');
    try {
      await navigator.clipboard.writeText(txt);
      showToast('Resumo copiado para colar no WhatsApp!');
    } catch {
      alert(txt);
    }
  });

  document.getElementById('btn-copy-briefing-link').addEventListener('click', async () => {
    const link = 'https://vibetechcmd.com.br/briefing/';
    try {
      await navigator.clipboard.writeText(link);
      showToast('Link https://vibetechcmd.com.br/briefing/ copiado!');
    } catch {
      prompt('Copie o link do Briefing:', link);
    }
  });

  // CRM Form
  document.getElementById('client-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('c-id').value;
    const payload = {
      name: document.getElementById('c-name').value,
      company: document.getElementById('c-company').value,
      document: document.getElementById('c-doc').value,
      whatsapp: document.getElementById('c-wa').value,
      email: document.getElementById('c-email').value,
      address: document.getElementById('c-addr').value,
      domain: document.getElementById('c-domain').value,
      hosting: document.getElementById('c-hosting').value,
      maintenance_plan: document.getElementById('c-plan').value,
      folder_ref: document.getElementById('c-folder').value
    };
    if (id) {
      await api(`/api/clients/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await api('/api/clients', { method: 'POST', body: JSON.stringify(payload) });
    }
    document.getElementById('client-form').reset();
    document.getElementById('c-id').value = '';
    await refreshAllData();
    showToast('Cliente salvo no CRM (Cloudflare D1)!');
  });
  document.getElementById('btn-reset-client').onclick = () => {
    document.getElementById('client-form').reset();
    document.getElementById('c-id').value = '';
  };

  // Novo Projeto no Kanban
  document.getElementById('btn-add-project').addEventListener('click', async () => {
    const title = prompt('Nome do projeto para o Kanban:');
    if (!title) return;
    const client_name = prompt('Nome do cliente (opcional):') || '';
    const value = Number(prompt('Valor estimado R$ (opcional):') || 0);
    await api('/api/projects', { method: 'POST', body: JSON.stringify({ title, client_name, value, stage: 'lead_briefing' }) });
    await refreshAllData();
    showToast('Projeto adicionado ao Kanban!');
  });

  // Manutenção (Regra automática > 45 min)
  const mMinutes = document.getElementById('m-minutes');
  const mDebitPreview = document.getElementById('m-debit-preview');
  mMinutes.addEventListener('input', () => {
    const mins = Math.max(1, Number(mMinutes.value || 30));
    const credits = Math.max(1, Math.ceil(mins / 45));
    mDebitPreview.textContent =
      credits > 1 ? `⚠ ${credits} atendimentos (> 45 min)` : '1 atendimento (dentro de 30–45 min)';
    mDebitPreview.style.color = credits > 1 ? '#f59e0b' : '#00D9F5';
  });

  document.getElementById('maint-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const client_id = document.getElementById('m-client').value;
    if (!client_id) return showToast('Selecione o cliente.');
    const minutes = Number(mMinutes.value || 30);
    const description = document.getElementById('m-desc').value.trim();
    await api('/api/maintenance', { method: 'POST', body: JSON.stringify({ client_id, minutes, description, month_key: currentMonthKey }) });
    document.getElementById('m-desc').value = '';
    await refreshAllData();
    showToast('Atendimento registrado na cota mensal!');
  });

  document.getElementById('btn-referral-bonus').addEventListener('click', async () => {
    const client_id = document.getElementById('m-client').value;
    if (!client_id) return showToast('Selecione o cliente que fez a indicação.');
    await api('/api/maintenance', {
      method: 'POST',
      body: JSON.stringify({ client_id, is_bonus: true, minutes: 0, month_key: currentMonthKey })
    });
    await refreshAllData();
    showToast('+2 atendimentos grátis (Programa de Indicação) adicionados!');
  });

  // Perfil VibeTech
  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await api('/api/profile', {
      method: 'PUT',
      body: JSON.stringify({
        companyName: document.getElementById('p-company').value,
        ownerName: document.getElementById('p-owner').value,
        document: document.getElementById('p-doc').value,
        pixKey: document.getElementById('p-pix').value,
        address: document.getElementById('p-addr').value,
        city: document.getElementById('p-city').value,
        state: document.getElementById('p-state').value,
        whatsapp: document.getElementById('p-wa').value,
        email: document.getElementById('p-email').value,
        website: document.getElementById('p-web').value
      })
    });
    await refreshAllData();
    showToast('Dados oficiais da VibeTech|CMD salvos no D1!');
  });

  // Central de Backup (.JSON e .CSV)
  document.getElementById('btn-export-json').addEventListener('click', async () => {
    const backup = await api('/api/backup');
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(`vibetech-backup-${stamp}.json`, JSON.stringify(backup, null, 2), 'application/json');
    showToast('Backup completo .JSON baixado!');
  });

  document.getElementById('btn-export-csv').addEventListener('click', async () => {
    const backup = await api('/api/backup');
    const stamp = new Date().toISOString().slice(0, 10);
    const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['TIPO', 'CODIGO_ID', 'CLIENTE', 'EMPRESA', 'TITULO_DETALHE', 'STATUS', 'VALOR_BRL', 'DATA'].join(';')
    ];
    (backup.proposals || []).forEach((p) =>
      rows.push(['PROPOSTA', p.code, p.client_name, p.client_company, p.project_title, p.status, p.total_value, p.updated_at].map(csvCell).join(';'))
    );
    (backup.clients || []).forEach((c) =>
      rows.push(['CLIENTE', c.id, c.name, c.company, `${c.domain || ''} | Plano: ${c.maintenance_plan}`, c.maintenance_plan, 0, c.created_at].map(csvCell).join(';'))
    );
    (backup.projects || []).forEach((p) =>
      rows.push(['KANBAN', p.id, p.client_name, '', p.title, p.stage, p.value, p.published_at || p.updated_at].map(csvCell).join(';'))
    );
    downloadFile(`vibetech-planilha-${stamp}.csv`, '\uFEFF' + rows.join('\n'), 'text/csv;charset=utf-8');
    showToast('Planilha consolidada .CSV baixada!');
  });

  document.getElementById('history-search').addEventListener('input', renderHistoryList);
  document.getElementById('history-filter').addEventListener('change', renderHistoryList);

  /* ---------- Auth Boot ---------- */
  async function enterApp() {
    try {
      localStorage.setItem('vt_master_hint', '1');
    } catch {
      // ignora
    }
    authScreen.classList.add('is-hidden');
    appShell.classList.remove('is-hidden');
    initCatalogControls();
    await refreshAllData();
    applyCatalogPackage('lp-basic');
    switchTab('dashboard');
  }

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authError.classList.add('is-hidden');
    const email = authEmail.value.trim();
    const password = authPassword.value;
    if (isSetupMode && password !== authPasswordConfirm.value) {
      authError.textContent = 'As duas senhas não conferem.';
      authError.classList.remove('is-hidden');
      return;
    }
    authSubmit.disabled = true;
    try {
      await api(isSetupMode ? '/api/auth/setup' : '/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      await enterApp();
      showToast('Bem-vindo ao Ecossistema Master VibeTech|CMD!');
    } catch (err) {
      authError.textContent = err.message || 'Falha na autenticação.';
      authError.classList.remove('is-hidden');
    } finally {
      authSubmit.disabled = false;
    }
  });

  document.getElementById('btn-logout').addEventListener('click', async () => {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
    try {
      localStorage.removeItem('vt_master_hint');
    } catch {
      // ignora
    }
    window.location.reload();
  });

  async function boot() {
    try {
      const status = await api('/api/auth/status');
      if (status.authenticated) {
        await enterApp();
        return;
      }
      isSetupMode = Boolean(status.needsSetup);
      if (isSetupMode) {
        authTitle.textContent = 'Configurar Primeiro Acesso Master';
        authDesc.textContent = 'Confirme seu e-mail autorizado e defina sua senha pessoal para liberar o ecossistema interno.';
        authPassLabel.textContent = 'Criar senha Master (mín. 6 caracteres)';
        authConfirmWrap.classList.remove('is-hidden');
        authPasswordConfirm.required = true;
        authSubmit.textContent = 'Ativar Acesso Master';
      }
      authEmail.focus();
    } catch {
      authError.textContent = 'Erro ao conectar à API Master. Recarregue a página.';
      authError.classList.remove('is-hidden');
    }
  }

  boot();
})();
