/* ==========================================================================
   VibeTech|CMD — Painel Master (Orçamentos, Contratos e Banco Cloudflare D1)
   ========================================================================== */

(() => {
  'use strict';

  /* ---------- Modelos pré-configurados de Orçamento VibeTech ---------- */
  const TEMPLATES = {
    'site-institucional': {
      title: 'Criação de Site Institucional Profissional',
      summary:
        'Desenvolvimento de site institucional moderno, responsivo (celular, tablet e computador), com identidade visual exclusiva, SEO técnico para Google e integração direta com WhatsApp.',
      delivery_days: '10 a 15 dias úteis',
      payment_terms: '50% na aprovação da proposta (PIX/Transferência) e 50% na entrega e publicação final.',
      notes: 'Inclui até 2 rodadas de ajustes visuais antes da publicação. Domínio (.com.br) fica registrado em nome do cliente.',
      items: [
        { desc: 'Design exclusivo (UI/UX) adaptado à identidade visual da marca', price: 850 },
        { desc: 'Desenvolvimento completo responsivo (Mobile-First + Desktop)', price: 950 },
        { desc: 'SEO técnico inicial (Google, Open Graph WhatsApp, Sitemap) + Publicação', price: 400 }
      ]
    },
    'landing-page': {
      title: 'Criação de Landing Page de Alta Conversão',
      summary:
        'Página estratégica de página única focada em apresentar oferta/serviço com clareza, quebrar objeções e direcionar clientes qualificados direto para o WhatsApp.',
      delivery_days: '5 a 7 dias úteis',
      payment_terms: '50% na aprovação da proposta (PIX) e 50% na entrega final.',
      notes: 'Ideal para campanhas de anúncios (Instagram/Google) e link oficial da bio. Inclui 2 rodadas de ajustes.',
      items: [
        { desc: 'Estrutura persuasiva e design sob medida para conversão', price: 650 },
        { desc: 'Desenvolvimento ultrarrápido responsivo + integração WhatsApp', price: 650 },
        { desc: 'Configuração de SEO básico, Google Analytics e publicação no ar', price: 200 }
      ]
    },
    'aplicativo-web': {
      title: 'Desenvolvimento de Aplicativo / Sistema Web sob Medida',
      summary:
        'Construção de aplicativo web personalizado para centralizar cadastros, contratos, fluxos operacionais e painéis administrativos com acesso via celular e computador.',
      delivery_days: '20 a 30 dias úteis',
      payment_terms: '40% na aprovação, 30% na validação da versão intermediária e 30% na entrega final.',
      notes: 'Inclui banco de dados em nuvem, controle de acesso e treinamento rápido da equipe para uso do sistema.',
      items: [
        { desc: 'Arquitetura, modelagem de dados e protótipo das telas principais', price: 1400 },
        { desc: 'Desenvolvimento do aplicativo web + painel de gestão responsivo', price: 2600 },
        { desc: 'Publicação em nuvem, testes finais e orientação de uso', price: 800 }
      ]
    },
    'combo-site-app': {
      title: 'Ecossistema Digital Completo (Site Oficial + Aplicativo de Gestão)',
      summary:
        'Solução integrada combinando site institucional de alto padrão para captação de clientes + aplicativo web personalizado para gestão interna da operação.',
      delivery_days: '25 a 35 dias úteis',
      payment_terms: '40% na aprovação, 30% na entrega do site oficial e 30% na entrega do aplicativo.',
      notes: 'Pacote completo com identidade visual unificada entre site público e painel interno.',
      items: [
        { desc: 'Site institucional oficial responsivo + SEO + integração WhatsApp', price: 2000 },
        { desc: 'Aplicativo web de gestão sob medida com banco de dados em nuvem', price: 3700 },
        { desc: 'Publicação, configuração de domínio próprio e suporte inicial', price: 800 }
      ]
    },
    personalizado: {
      title: 'Projeto Digital sob Medida — VibeTech|CMD',
      summary: 'Escopo personalizado definido conforme as necessidades específicas do cliente.',
      delivery_days: 'A combinar',
      payment_terms: '50% na aprovação e 50% na entrega final.',
      notes: '',
      items: [{ desc: 'Desenvolvimento de solução digital personalizada', price: 1500 }]
    }
  };

  /* ---------- Estado ---------- */
  let providerProfile = {
    companyName: 'VibeTech|CMD',
    ownerName: '',
    document: '',
    city: 'Macaé',
    state: 'RJ',
    whatsapp: '(22) 99916-2793',
    email: 'cleisson.md@gmail.com',
    website: 'https://vibetechcmd.com.br'
  };

  let allProposals = [];
  let currentId = null;
  let currentCode = 'RASCUNHO';
  let currentTemplate = 'site-institucional';
  let items = [];
  let isSetupMode = false;

  /* ---------- Utilitários ---------- */
  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatBRL(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function formatDatePtBr(date = new Date()) {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  let toastTimer = 0;
  function showToast(msg) {
    const el = document.getElementById('admin-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  async function api(path, options = {}) {
    const res = await fetch(path, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Erro HTTP ${res.status}`);
    }
    return data;
  }

  /* ---------- Cláusulas base do contrato (editáveis — aguardando base jurídica definitiva) ---------- */
  function buildDefaultContractClauses(state) {
    const cityState = `${providerProfile.city || 'Macaé'}/${providerProfile.state || 'RJ'}`;
    const itemsBullets = (state.items || [])
      .map((it, i) => `   ${i + 1}. ${it.desc} (${formatBRL(it.price)})`)
      .join('\n');

    return `CLÁUSULA 1ª — DO OBJETO
O presente instrumento tem por objeto a prestação de serviços de desenvolvimento digital pela CONTRATADA em favor da CONTRATANTE, referente ao projeto "${state.project_title}", compreendendo as seguintes entregas:
${itemsBullets || '   1. Conforme escopo aprovado na proposta comercial.'}

CLÁUSULA 2ª — DO PRAZO E ENTREGA
O prazo estimado para conclusão e apresentação da versão final é de ${state.delivery_days || 'a combinar'}, contado a partir da confirmação do pagamento inicial e do envio completo, pela CONTRATANTE, de textos, imagens, logotipos e informações necessárias.

CLÁUSULA 3ª — DO VALOR E CONDIÇÕES DE PAGAMENTO
Pelos serviços descritos na Cláusula 1ª, a CONTRATANTE pagará à CONTRATADA o valor total de ${formatBRL(state.total_value)}, da seguinte forma:
${state.payment_terms || '50% na aprovação e 50% na entrega final.'}

CLÁUSULA 4ª — DAS REVISÕES E ALTERAÇÕES
Estão incluídas até 2 (duas) rodadas de ajustes dentro do escopo originalmente aprovado. Funcionalidades extras, novas páginas ou mudanças estruturais solicitadas após a aprovação do escopo serão orçadas à parte mediante aditivo.

CLÁUSULA 5ª — DA PROPRIEDADE E PUBLICAÇÃO
Após a quitação integral dos valores acordados, a CONTRATANTE adquire o direito de uso definitivo do projeto entregue. Custos recorrentes de terceiros (como registro/renovação de domínio próprio e eventuais serviços externos pagos) são de responsabilidade da CONTRATANTE, salvo estipulação expressa em contrário.

CLÁUSULA 6ª — DA CONFIDENCIALIDADE E PORTFÓLIO
As partes comprometem-se a manter sigilo sobre dados sensíveis e credenciais trocadas durante o projeto. A CONTRATADA poderá exibir o projeto concluído em seu portfólio institucional após o lançamento oficial, salvo solicitação expressa de confidencialidade pela CONTRATANTE.

CLÁUSULA 7ª — DO FORO
Fica eleito o foro da Comarca de ${cityState} para dirimir quaisquer dúvidas ou controvérsias oriundas deste contrato, renunciando as partes a qualquer outro, por mais privilegiado que seja.`;
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

  const fClientName = document.getElementById('f-client-name');
  const fClientCompany = document.getElementById('f-client-company');
  const fClientDoc = document.getElementById('f-client-doc');
  const fClientWa = document.getElementById('f-client-wa');
  const fClientEmail = document.getElementById('f-client-email');
  const fProjectTitle = document.getElementById('f-project-title');
  const fProjectSummary = document.getElementById('f-project-summary');
  const fDiscount = document.getElementById('f-discount');
  const fDelivery = document.getElementById('f-delivery');
  const fValidity = document.getElementById('f-validity');
  const fPayment = document.getElementById('f-payment');
  const fNotes = document.getElementById('f-notes');
  const fStatus = document.getElementById('f-status');
  const fContractClauses = document.getElementById('f-contract-clauses');

  const itemsListEl = document.getElementById('items-list');
  const editorCodeBadge = document.getElementById('editor-code-badge');
  const contractCodeBadge = document.getElementById('contract-code-badge');
  const quotePreviewDoc = document.getElementById('quote-preview-doc');
  const contractPreviewDoc = document.getElementById('contract-preview-doc');

  /* ---------- Leitura e Renderização do Formulário ---------- */
  function readFormState() {
    const discount = Math.max(0, Number(fDiscount.value || 0));
    const subtotal = items.reduce((acc, it) => acc + Math.max(0, Number(it.price || 0)), 0);
    const total_value = Math.max(0, subtotal - discount);
    return {
      id: currentId,
      code: currentCode,
      status: fStatus.value || 'rascunho',
      template_id: currentTemplate,
      client_name: fClientName.value.trim(),
      client_company: fClientCompany.value.trim(),
      client_document: fClientDoc.value.trim(),
      client_whatsapp: fClientWa.value.trim(),
      client_email: fClientEmail.value.trim(),
      project_title: fProjectTitle.value.trim() || 'Proposta Comercial VibeTech|CMD',
      project_summary: fProjectSummary.value.trim(),
      items: items.map((it) => ({ desc: String(it.desc || '').trim(), price: Number(it.price || 0) })),
      subtotal,
      discount,
      total_value,
      delivery_days: fDelivery.value.trim(),
      validity_days: Number(fValidity.value || 15),
      payment_terms: fPayment.value.trim(),
      notes: fNotes.value.trim(),
      contract_clauses: fContractClauses.value,
      provider: providerProfile
    };
  }

  function renderItemsEditor() {
    itemsListEl.innerHTML = '';
    items.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'item-row';

      const descInput = document.createElement('input');
      descInput.className = 'input';
      descInput.type = 'text';
      descInput.placeholder = 'Descrição do entregável';
      descInput.value = item.desc || '';
      descInput.addEventListener('input', () => {
        items[idx].desc = descInput.value;
        renderPreviews();
      });

      const priceInput = document.createElement('input');
      priceInput.className = 'input';
      priceInput.type = 'number';
      priceInput.min = '0';
      priceInput.step = '10';
      priceInput.placeholder = 'Valor R$';
      priceInput.value = item.price ?? 0;
      priceInput.addEventListener('input', () => {
        items[idx].price = Number(priceInput.value || 0);
        renderPreviews();
      });

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'item-remove';
      removeBtn.title = 'Remover item';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => {
        items.splice(idx, 1);
        renderItemsEditor();
        renderPreviews();
      });

      row.append(descInput, priceInput, removeBtn);
      itemsListEl.appendChild(row);
    });
  }

  function renderPreviews() {
    const s = readFormState();
    const today = formatDatePtBr();
    const cityUf = `${providerProfile.city || 'Macaé'}/${providerProfile.state || 'RJ'}`;

    editorCodeBadge.textContent = currentId ? currentCode : 'Novo Orçamento';
    contractCodeBadge.textContent = currentId ? currentCode : 'Modelo Base';

    // 1. Prévia A4 do Orçamento
    const rowsHtml = s.items
      .map(
        (it) =>
          `<tr><td>${escapeHtml(it.desc || 'Item sem descrição')}</td><td><strong>${escapeHtml(formatBRL(it.price))}</strong></td></tr>`
      )
      .join('');

    quotePreviewDoc.innerHTML = `
      <div class="doc-header">
        <div class="doc-brand">
          <img src="/assets/vibetech-logo.svg" alt="VibeTech|CMD">
          <div>
            <h3>${escapeHtml(providerProfile.companyName || 'VibeTech|CMD')}</h3>
            <small>Sites, Aplicativos e Soluções Digitais sob Medida</small>
          </div>
        </div>
        <div class="doc-meta-right">
          <strong>PROPOSTA COMERCIAL</strong>
          <div>Código: ${escapeHtml(s.code)}</div>
          <div>Data: ${escapeHtml(today)}</div>
          <div>Validade: ${escapeHtml(s.validity_days)} dias</div>
        </div>
      </div>

      <div class="doc-body">
        <div class="doc-title-bar">
          <div>
            <h4>${escapeHtml(s.project_title)}</h4>
            <p>${escapeHtml(s.project_summary || 'Proposta personalizada elaborada pela equipe VibeTech|CMD.')}</p>
          </div>
        </div>

        <div class="doc-parties">
          <div class="doc-box">
            <b>Prestador (VibeTech)</b>
            <div><strong>${escapeHtml(providerProfile.companyName)}</strong></div>
            <div>Resp.: ${escapeHtml(providerProfile.ownerName)}</div>
            ${providerProfile.document ? `<div>CPF/CNPJ: ${escapeHtml(providerProfile.document)}</div>` : ''}
            <div>${escapeHtml(cityUf)} · ${escapeHtml(providerProfile.whatsapp)}</div>
          </div>
          <div class="doc-box">
            <b>Cliente / Contratante</b>
            <div><strong>${escapeHtml(s.client_name || 'Nome do Cliente')}</strong></div>
            ${s.client_company ? `<div>Empresa: ${escapeHtml(s.client_company)}</div>` : ''}
            ${s.client_document ? `<div>CPF/CNPJ: ${escapeHtml(s.client_document)}</div>` : ''}
            <div>${escapeHtml([s.client_whatsapp, s.client_email].filter(Boolean).join(' · ') || 'Contato a informar')}</div>
          </div>
        </div>

        <table class="doc-table">
          <thead>
            <tr><th>Descrição dos Serviços / Entregáveis</th><th>Investimento</th></tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="2">Adicione itens ao orçamento.</td></tr>'}
          </tbody>
        </table>

        <div class="doc-totals">
          <div class="doc-totals-row"><span>Subtotal</span><span>${escapeHtml(formatBRL(s.subtotal))}</span></div>
          ${
            s.discount > 0
              ? `<div class="doc-totals-row"><span>Desconto comercial</span><span>- ${escapeHtml(formatBRL(s.discount))}</span></div>`
              : ''
          }
          <div class="doc-totals-row grand"><span>Valor Total</span><span>${escapeHtml(formatBRL(s.total_value))}</span></div>
        </div>

        <div class="doc-conditions">
          <div><strong>Prazo estimado de entrega:</strong> ${escapeHtml(s.delivery_days || 'A combinar')}</div>
          <div><strong>Condições de pagamento:</strong> ${escapeHtml(s.payment_terms || 'A combinar')}</div>
          ${s.notes ? `<div style="margin-top:6px;"><strong>Observações:</strong> ${escapeHtml(s.notes)}</div>` : ''}
        </div>
      </div>

      <div class="doc-footer">
        <span>${escapeHtml(providerProfile.companyName)} · ${escapeHtml(providerProfile.website)}</span>
        <span>${escapeHtml(cityUf)} · WhatsApp ${escapeHtml(providerProfile.whatsapp)}</span>
      </div>
    `;

    // 2. Prévia A4 do Contrato
    const clausesText = s.contract_clauses.trim() || buildDefaultContractClauses(s);
    contractPreviewDoc.innerHTML = `
      <div class="doc-header">
        <div class="doc-brand">
          <img src="/assets/vibetech-logo.svg" alt="VibeTech|CMD">
          <div>
            <h3>${escapeHtml(providerProfile.companyName || 'VibeTech|CMD')}</h3>
            <small>Instrumento Particular de Prestação de Serviços Digitais</small>
          </div>
        </div>
        <div class="doc-meta-right">
          <strong>CONTRATO DE SERVIÇOS</strong>
          <div>Ref.: ${escapeHtml(s.code)}</div>
          <div>${escapeHtml(cityUf)}, ${escapeHtml(today)}</div>
        </div>
      </div>

      <div class="doc-body">
        <div class="doc-parties">
          <div class="doc-box">
            <b>CONTRATADA</b>
            <div><strong>${escapeHtml(providerProfile.companyName)}</strong></div>
            <div>Titular: ${escapeHtml(providerProfile.ownerName)}</div>
            ${providerProfile.document ? `<div>CPF/CNPJ: ${escapeHtml(providerProfile.document)}</div>` : ''}
            <div>Sede: ${escapeHtml(cityUf)} · ${escapeHtml(providerProfile.email)}</div>
          </div>
          <div class="doc-box">
            <b>CONTRATANTE</b>
            <div><strong>${escapeHtml(s.client_name || 'Nome do Contratante')}</strong></div>
            ${s.client_company ? `<div>Empresa: ${escapeHtml(s.client_company)}</div>` : ''}
            ${s.client_document ? `<div>CPF/CNPJ: ${escapeHtml(s.client_document)}</div>` : ''}
            <div>${escapeHtml([s.client_whatsapp, s.client_email].filter(Boolean).join(' · ') || 'Contato a informar')}</div>
          </div>
        </div>

        <div class="doc-clauses">${escapeHtml(clausesText)}</div>

        <p style="margin-top:24px;font-size:.82rem;color:#334155;">
          E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em ${escapeHtml(cityUf)}, em ${escapeHtml(today)}.
        </p>

        <div class="doc-signatures">
          <div class="sig-line">
            <strong>${escapeHtml(providerProfile.ownerName || providerProfile.companyName)}</strong><br>
            CONTRATADA · ${escapeHtml(providerProfile.companyName)}<br>
            ${providerProfile.document ? `CPF/CNPJ: ${escapeHtml(providerProfile.document)}` : ''}
          </div>
          <div class="sig-line">
            <strong>${escapeHtml(s.client_name || 'CONTRATANTE')}</strong><br>
            CONTRATANTE ${s.client_company ? `· ${escapeHtml(s.client_company)}` : ''}<br>
            ${s.client_document ? `CPF/CNPJ: ${escapeHtml(s.client_document)}` : ''}
          </div>
        </div>
      </div>

      <div class="doc-footer">
        <span>${escapeHtml(providerProfile.companyName)} · Ref. ${escapeHtml(s.code)}</span>
        <span>${escapeHtml(providerProfile.website)}</span>
      </div>
    `;
  }

  function applyTemplate(tplId) {
    const tpl = TEMPLATES[tplId] || TEMPLATES['site-institucional'];
    currentTemplate = tplId;
    fProjectTitle.value = tpl.title;
    fProjectSummary.value = tpl.summary;
    fDelivery.value = tpl.delivery_days;
    fPayment.value = tpl.payment_terms;
    fNotes.value = tpl.notes;
    fDiscount.value = 0;
    items = tpl.items.map((it) => ({ ...it }));

    document.querySelectorAll('.tpl-pill').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.template === tplId);
    });

    renderItemsEditor();
    fContractClauses.value = buildDefaultContractClauses(readFormState());
    renderPreviews();
  }

  function resetNewProposal() {
    currentId = null;
    currentCode = 'NOVO';
    fClientName.value = '';
    fClientCompany.value = '';
    fClientDoc.value = '';
    fClientWa.value = '';
    fClientEmail.value = '';
    fValidity.value = 15;
    fStatus.value = 'rascunho';
    applyTemplate('site-institucional');
    switchTab('quote');
    showToast('Novo orçamento pronto para preenchimento.');
  }

  function loadProposalIntoEditor(p, targetTab = 'quote') {
    currentId = p.id;
    currentCode = p.code || 'VT';
    currentTemplate = p.template_id || 'personalizado';
    fClientName.value = p.client_name || '';
    fClientCompany.value = p.client_company || '';
    fClientDoc.value = p.client_document || '';
    fClientWa.value = p.client_whatsapp || '';
    fClientEmail.value = p.client_email || '';
    fProjectTitle.value = p.project_title || '';
    fProjectSummary.value = p.project_summary || '';
    fDiscount.value = Number(p.discount || 0);
    fDelivery.value = p.delivery_days || '';
    fValidity.value = Number(p.validity_days || 15);
    fPayment.value = p.payment_terms || '';
    fNotes.value = p.notes || '';
    fStatus.value = p.status || 'rascunho';
    items = Array.isArray(p.items) ? p.items.map((it) => ({ ...it })) : [];

    document.querySelectorAll('.tpl-pill').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.template === currentTemplate);
    });

    renderItemsEditor();
    fContractClauses.value = p.contract_clauses || buildDefaultContractClauses(readFormState());
    renderPreviews();
    switchTab(targetTab);
  }

  /* ---------- Salvar no Cloudflare D1 ---------- */
  async function saveCurrentProposal(overrideStatus) {
    const state = readFormState();
    if (!state.client_name) {
      showToast('Informe o nome do cliente antes de salvar.');
      fClientName.focus();
      return null;
    }
    if (overrideStatus) {
      state.status = overrideStatus;
      fStatus.value = overrideStatus;
    }
    if (!state.contract_clauses.trim()) {
      state.contract_clauses = buildDefaultContractClauses(state);
      fContractClauses.value = state.contract_clauses;
    }

    try {
      let res;
      if (currentId) {
        res = await api(`/api/proposals/${currentId}`, {
          method: 'PUT',
          body: JSON.stringify(state)
        });
      } else {
        res = await api('/api/proposals', {
          method: 'POST',
          body: JSON.stringify(state)
        });
      }
      if (res.proposal) {
        currentId = res.proposal.id;
        currentCode = res.proposal.code;
        renderPreviews();
        await loadHistory();
        showToast(`Salvo na nuvem Cloudflare D1 (${currentCode})!`);
        return res.proposal;
      }
    } catch (err) {
      showToast(err.message || 'Erro ao salvar no banco D1.');
    }
    return null;
  }

  /* ---------- Histórico D1 ---------- */
  const historyGrid = document.getElementById('history-grid');
  const historySummary = document.getElementById('history-summary');
  const historySearch = document.getElementById('history-search');
  const historyFilter = document.getElementById('history-filter');

  const STATUS_LABELS = {
    rascunho: 'Rascunho',
    enviado: 'Enviado',
    validado: 'Validado',
    contrato_gerado: 'Contrato Gerado'
  };

  function renderHistory() {
    const q = (historySearch.value || '').trim().toLowerCase();
    const filter = historyFilter.value || 'all';

    const list = allProposals.filter((p) => {
      if (filter !== 'all' && p.status !== filter) return false;
      if (!q) return true;
      const hay = `${p.code} ${p.client_name} ${p.client_company} ${p.project_title}`.toLowerCase();
      return hay.includes(q);
    });

    const totalSum = list.reduce((acc, p) => acc + Number(p.total_value || 0), 0);
    historySummary.textContent = `${list.length} registro(s) encontrado(s) · Soma exibida: ${formatBRL(totalSum)}`;

    historyGrid.innerHTML = '';
    if (!list.length) {
      historyGrid.innerHTML =
        '<p style="color:#9eb0c8;font-size:.9rem;">Nenhum orçamento salvo ainda. Crie o primeiro na aba <strong>1. Orçamento</strong>!</p>';
      return;
    }

    list.forEach((p) => {
      const card = document.createElement('article');
      card.className = 'history-card';
      card.innerHTML = `
        <div class="history-top">
          <span class="code-tag">${escapeHtml(p.code)}</span>
          <span class="status-badge st-${escapeHtml(p.status)}">${escapeHtml(STATUS_LABELS[p.status] || p.status)}</span>
        </div>
        <h3>${escapeHtml(p.client_name)}${p.client_company ? ` · ${escapeHtml(p.client_company)}` : ''}</h3>
        <div class="history-meta">${escapeHtml(p.project_title)}</div>
        <div class="history-price">${escapeHtml(formatBRL(p.total_value))}</div>
        <div class="history-actions"></div>
      `;

      const actions = card.querySelector('.history-actions');

      const btnEdit = document.createElement('button');
      btnEdit.className = 'btn btn-primary btn-sm';
      btnEdit.textContent = 'Abrir Orçamento';
      btnEdit.addEventListener('click', () => loadProposalIntoEditor(p, 'quote'));

      const btnContract = document.createElement('button');
      btnContract.className = 'btn btn-success btn-sm';
      btnContract.textContent = 'Contrato';
      btnContract.addEventListener('click', () => loadProposalIntoEditor(p, 'contract'));

      const btnDup = document.createElement('button');
      btnDup.className = 'btn btn-secondary btn-sm';
      btnDup.textContent = 'Duplicar';
      btnDup.addEventListener('click', () => {
        loadProposalIntoEditor({ ...p, id: null, code: 'NOVO', status: 'rascunho' }, 'quote');
        showToast('Orçamento duplicado — edite e clique em Salvar.');
      });

      const btnDel = document.createElement('button');
      btnDel.className = 'btn btn-danger btn-sm';
      btnDel.textContent = 'Excluir';
      btnDel.addEventListener('click', async () => {
        if (!confirm(`Excluir permanentemente o registro ${p.code}?`)) return;
        try {
          await api(`/api/proposals/${p.id}`, { method: 'DELETE' });
          if (currentId === p.id) currentId = null;
          await loadHistory();
          showToast(`Registro ${p.code} excluído.`);
        } catch (err) {
          showToast(err.message || 'Erro ao excluir.');
        }
      });

      actions.append(btnEdit, btnContract, btnDup, btnDel);
      historyGrid.appendChild(card);
    });
  }

  async function loadHistory() {
    const data = await api('/api/proposals');
    allProposals = data.proposals || [];
    renderHistory();
  }

  /* ---------- Perfil da VibeTech (D1) ---------- */
  const pCompany = document.getElementById('p-company');
  const pOwner = document.getElementById('p-owner');
  const pDoc = document.getElementById('p-doc');
  const pCity = document.getElementById('p-city');
  const pState = document.getElementById('p-state');
  const pWa = document.getElementById('p-wa');
  const pEmail = document.getElementById('p-email');
  const pWeb = document.getElementById('p-web');

  async function loadProfile() {
    const data = await api('/api/profile');
    if (data.profile) {
      providerProfile = { ...providerProfile, ...data.profile };
    }
    pCompany.value = providerProfile.companyName || '';
    pOwner.value = providerProfile.ownerName || '';
    pDoc.value = providerProfile.document || '';
    pCity.value = providerProfile.city || '';
    pState.value = providerProfile.state || '';
    pWa.value = providerProfile.whatsapp || '';
    pEmail.value = providerProfile.email || '';
    pWeb.value = providerProfile.website || '';
  }

  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const res = await api('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          companyName: pCompany.value,
          ownerName: pOwner.value,
          document: pDoc.value,
          city: pCity.value,
          state: pState.value,
          whatsapp: pWa.value,
          email: pEmail.value,
          website: pWeb.value
        })
      });
      providerProfile = res.profile;
      renderPreviews();
      showToast('Dados da VibeTech atualizados na nuvem (D1)!');
    } catch (err) {
      showToast(err.message || 'Erro ao salvar dados.');
    }
  });

  /* ---------- Abas ---------- */
  function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-view').forEach((sec) => {
      sec.classList.toggle('is-hidden', sec.id !== `tab-${tabName}`);
    });
    if (tabName === 'contract' && !fContractClauses.value.trim()) {
      fContractClauses.value = buildDefaultContractClauses(readFormState());
    }
    renderPreviews();
  }

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  /* ---------- Eventos do Editor ---------- */
  document.querySelectorAll('.tpl-pill').forEach((btn) => {
    btn.addEventListener('click', () => applyTemplate(btn.dataset.template));
  });

  document.getElementById('btn-add-item').addEventListener('click', () => {
    items.push({ desc: '', price: 0 });
    renderItemsEditor();
    renderPreviews();
  });

  [
    fClientName,
    fClientCompany,
    fClientDoc,
    fClientWa,
    fClientEmail,
    fProjectTitle,
    fProjectSummary,
    fDiscount,
    fDelivery,
    fValidity,
    fPayment,
    fNotes,
    fStatus,
    fContractClauses
  ].forEach((el) => el.addEventListener('input', renderPreviews));

  document.getElementById('btn-new-proposal').addEventListener('click', resetNewProposal);
  document.getElementById('btn-save-quote').addEventListener('click', () => saveCurrentProposal());
  document.getElementById('btn-save-contract').addEventListener('click', () => saveCurrentProposal('contrato_gerado'));

  document.getElementById('btn-validate-contract').addEventListener('click', async () => {
    const state = readFormState();
    fContractClauses.value = buildDefaultContractClauses(state);
    const saved = await saveCurrentProposal('validado');
    if (saved) {
      switchTab('contract');
      showToast('Orçamento validado! Contrato montado automaticamente.');
    }
  });

  document.getElementById('btn-reset-clauses').addEventListener('click', () => {
    fContractClauses.value = buildDefaultContractClauses(readFormState());
    renderPreviews();
    showToast('Cláusulas base restauradas com os dados atuais.');
  });

  function printActiveDocument(tabName) {
    switchTab(tabName);
    setTimeout(() => window.print(), 120);
  }
  document.getElementById('btn-print-quote').addEventListener('click', () => printActiveDocument('quote'));
  document.getElementById('btn-print-quote-top').addEventListener('click', () => printActiveDocument('quote'));
  document.getElementById('btn-print-contract').addEventListener('click', () => printActiveDocument('contract'));
  document.getElementById('btn-print-contract-top').addEventListener('click', () => printActiveDocument('contract'));

  document.getElementById('btn-send-wa').addEventListener('click', () => {
    const s = readFormState();
    const digits = (s.client_whatsapp || '').replace(/\D/g, '');
    const phone = digits.length >= 10 ? (digits.startsWith('55') ? digits : `55${digits}`) : '';
    const msg = [
      `Olá${s.client_name ? `, ${s.client_name}` : ''}! Tudo bem?`,
      `Segue o resumo da proposta comercial *${s.project_title}* preparada pela *${providerProfile.companyName}*:`,
      `• Investimento total: *${formatBRL(s.total_value)}*`,
      `• Prazo estimado: ${s.delivery_days || 'A combinar'}`,
      `• Pagamento: ${s.payment_terms || 'A combinar'}`,
      `Estou enviando também o arquivo PDF detalhado logo abaixo. Qualquer dúvida, fico à disposição!`
    ].join('\n');
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  });

  historySearch.addEventListener('input', renderHistory);
  historyFilter.addEventListener('change', renderHistory);

  /* ---------- Autenticação Master ---------- */
  async function enterAuthenticatedApp() {
    try {
      localStorage.setItem('vt_master_hint', '1');
    } catch {
      // ignora
    }
    authScreen.classList.add('is-hidden');
    appShell.classList.remove('is-hidden');
    await loadProfile();
    await loadHistory();
    applyTemplate('site-institucional');
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
      const endpoint = isSetupMode ? '/api/auth/setup' : '/api/auth/login';
      await api(endpoint, { method: 'POST', body: JSON.stringify({ email, password }) });
      await enterAuthenticatedApp();
      showToast(isSetupMode ? 'Acesso Master configurado e conectado ao D1!' : 'Bem-vindo ao Painel Master!');
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
        await enterAuthenticatedApp();
        return;
      }

      isSetupMode = Boolean(status.needsSetup);
      if (isSetupMode) {
        authTitle.textContent = 'Configurar Primeiro Acesso Master';
        authDesc.textContent =
          'Confirme o e-mail proprietário autorizado e defina sua senha pessoal para proteger seus orçamentos, contratos e banco na nuvem.';
        authPassLabel.textContent = 'Criar senha Master (mín. 6 caracteres)';
        authConfirmWrap.classList.remove('is-hidden');
        authPasswordConfirm.required = true;
        authSubmit.textContent = 'Ativar Acesso Master';
      }
      authEmail.focus();
    } catch (err) {
      authError.textContent = 'Não foi possível conectar à API Master. Tente recarregar a página.';
      authError.classList.remove('is-hidden');
    }
  }

  boot();
})();
