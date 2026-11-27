/* ==========================================================================
   VibeTech|CMD — Briefing Interativo (3 Trilhas Condicionais -> D1)
   ========================================================================== */

(() => {
  'use strict';

  const DEV_WHATSAPP = '5522999162793';

  const TRACK_FIELDS = {
    ideia: [
      { key: 'business_goal', label: '1. Sobre o negócio e objetivo principal', type: 'textarea', placeholder: 'O que sua empresa faz e o que espera alcançar com o site/app?' },
      { key: 'target_audience', label: '2. Quem é o seu público-alvo?', type: 'input', placeholder: 'Ex.: noivas, empresas locais, pacientes, clientes B2B...' },
      { key: 'format_pages', label: '3. Formato e seções/páginas desejadas', type: 'textarea', placeholder: 'Ex.: Landing Page, Site Institucional (Início, Sobre, Serviços, Portfólio, Contato), Aplicativo...' },
      { key: 'visual_identity', label: '4. Identidade visual atual (logo / manual da marca)', type: 'input', placeholder: 'Já possui logo em alta qualidade ou ainda vai criar?' },
      { key: 'colors_style', label: '5. Paleta de cores, o que NÃO gosta e estilo visual', type: 'textarea', placeholder: 'Cores preferidas, estilos que não gosta (ex.: muito colorido, muito formal)...' },
      { key: 'concept_tone', label: '6. Conceito, sensação e tom de voz', type: 'input', placeholder: 'Ex.: moderno, luxuoso, acolhedor, técnico, direto...' },
      { key: 'available_materials', label: '7. Materiais disponíveis hoje', type: 'textarea', placeholder: 'Já tem textos, fotos profissionais, depoimentos, links de redes sociais?' },
      { key: 'references', label: '8. 2 a 3 referências visuais (links ou nomes de marcas)', type: 'textarea', placeholder: 'Cole links de sites que você acha bonitos e diga o que gostou neles.' },
      { key: 'special_features', label: '9. Recursos especiais desejados', type: 'input', placeholder: 'Ex.: CMS/Blog, área de login, banco de dados, calculadora, formulários avançados...' },
      { key: 'domain_deadline', label: '10. Domínio, hospedagem e prazo/urgência', type: 'textarea', placeholder: 'Já possui domínio (.com.br)? Tem alguma data limite ou urgência?' }
    ],
    base: [
      { key: 'brand_base', label: '1. Marca existente e materiais já prontos', type: 'textarea', placeholder: 'Descreva o que você já tem pronto (logo, manual, fotos, textos, redes sociais)...' },
      { key: 'missing_style', label: '2. Cores, conceito ou estilo que ainda faltam definir', type: 'textarea', placeholder: 'O que gostaria que a VibeTech refinasse ou propusesse no visual?' },
      { key: 'format_pages', label: '3. Escopo técnico: páginas, seções ou telas desejadas', type: 'textarea', placeholder: 'Liste as páginas/seções do site ou telas do aplicativo.' },
      { key: 'special_features', label: '4. Recursos especiais e integrações', type: 'input', placeholder: 'Ex.: WhatsApp dinâmico, formulários, CMS, login, banco de dados, APIs...' },
      { key: 'references', label: '5. Referências visuais (opcional)', type: 'input', placeholder: 'Links ou marcas que inspiram o resultado esperado.' },
      { key: 'domain_deadline', label: '6. Domínio, hospedagem e prazo desejado', type: 'input', placeholder: 'Já tem domínio/hospedagem? Qual prazo ideal?' }
    ],
    redesign: [
      { key: 'current_url', label: '1. URL do site atual', type: 'url', placeholder: 'https://seusiteatual.com.br' },
      { key: 'current_problems', label: '2. Principais problemas percebidos hoje', type: 'textarea', placeholder: 'Ex.: lento, feio no celular, poucos contatos, visual antigo, difícil de atualizar...' },
      { key: 'keep_elements', label: '3. O que deve ser preservado do site atual?', type: 'textarea', placeholder: 'Logo, cores, textos específicos, domínio, fotos...' },
      {
        key: 'redesign_level',
        label: '4. Nível de redesign desejado',
        type: 'select',
        options: [
          'Nível 1 — Redesign Visual (modernizar aparência mantendo estrutura)',
          'Nível 2 — Redesign Estrutural (reorganizar layout, seções e conversão)',
          'Nível 3 — Redesign Completo / Reconstrução do zero'
        ]
      },
      { key: 'new_goals', label: '5. Novas metas e recursos desejados', type: 'textarea', placeholder: 'O que o novo site precisa entregar de resultado?' },
      { key: 'domain_deadline', label: '6. Prazo desejado / urgência', type: 'input', placeholder: 'Tem alguma campanha ou data prevista para relançar?' }
    ]
  };

  let activeTrack = 'ideia';
  const container = document.getElementById('dynamic-questions');
  const form = document.getElementById('briefing-form');
  const successBox = document.getElementById('briefing-success');
  const summaryOutput = document.getElementById('summary-output');
  const btnSubmit = document.getElementById('btn-submit-briefing');

  function renderTrackFields() {
    const fields = TRACK_FIELDS[activeTrack] || TRACK_FIELDS.ideia;
    const trackNames = {
      ideia: 'Trilha 1 — Só tenho a ideia (10 perguntas)',
      base: 'Trilha 2 — Já tenho uma base',
      redesign: 'Trilha 3 — Redesign / Restart'
    };

    container.innerHTML = `<div class="group-title">${trackNames[activeTrack]}</div>`;

    fields.forEach((f) => {
      const wrap = document.createElement('div');
      wrap.className = 'field';

      const label = document.createElement('label');
      label.setAttribute('for', `q-${f.key}`);
      label.textContent = f.label;
      wrap.appendChild(label);

      let input;
      if (f.type === 'textarea') {
        input = document.createElement('textarea');
        input.className = 'textarea';
      } else if (f.type === 'select') {
        input = document.createElement('select');
        input.className = 'select';
        (f.options || []).forEach((opt) => {
          const o = document.createElement('option');
          o.value = opt;
          o.textContent = opt;
          input.appendChild(o);
        });
      } else {
        input = document.createElement('input');
        input.className = 'input';
        input.type = f.type || 'text';
      }
      input.id = `q-${f.key}`;
      input.name = f.key;
      if (f.placeholder) input.placeholder = f.placeholder;
      wrap.appendChild(input);
      container.appendChild(wrap);
    });
  }

  document.querySelectorAll('.track-card').forEach((card) => {
    card.addEventListener('click', () => {
      activeTrack = card.dataset.track || 'ideia';
      document.querySelectorAll('.track-card').forEach((c) => c.classList.toggle('active', c === card));
      renderTrackFields();
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const client_name = document.getElementById('b-name').value.trim();
    const client_company = document.getElementById('b-company').value.trim();
    const client_whatsapp = document.getElementById('b-wa').value.trim();
    const client_email = document.getElementById('b-email').value.trim();

    if (!client_name || !client_whatsapp) return;

    const fields = TRACK_FIELDS[activeTrack] || [];
    const answers = {};
    const summaryLines = [
      `BRIEFING VIBETECH|CMD — TRILHA: ${activeTrack.toUpperCase()}`,
      `Cliente: ${client_name}${client_company ? ` (${client_company})` : ''}`,
      `WhatsApp: ${client_whatsapp}${client_email ? ` | E-mail: ${client_email}` : ''}`,
      '----------------------------------------'
    ];

    fields.forEach((f) => {
      const el = document.getElementById(`q-${f.key}`);
      const val = el ? el.value.trim() : '';
      answers[f.key] = val;
      if (val) summaryLines.push(`${f.label}\n→ ${val}\n`);
    });

    const brainstorm_summary = summaryLines.join('\n');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Enviando briefing...';

    try {
      const res = await fetch('/api/public/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track: activeTrack,
          client_name,
          client_company,
          client_whatsapp,
          client_email,
          answers,
          brainstorm_summary
        })
      });
      if (!res.ok) throw new Error('Falha ao gravar briefing.');

      summaryOutput.textContent = brainstorm_summary;
      const waMsg = `Olá! Acabei de preencher o Briefing Interativo da VibeTech|CMD (${client_company || client_name}). Já podemos agendar o Brainstorm!`;
      document.getElementById('btn-wa-notify').href = `https://wa.me/${DEV_WHATSAPP}?text=${encodeURIComponent(waMsg)}`;

      form.classList.add('is-hidden');
      document.getElementById('tracks-grid').classList.add('is-hidden');
      successBox.classList.remove('is-hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      alert('Não foi possível enviar agora. Tente novamente ou chame direto no WhatsApp (22) 99916-2793.');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Enviar Briefing para a VibeTech ↗';
    }
  });

  document.getElementById('btn-copy-summary').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(summaryOutput.textContent || '');
      document.getElementById('btn-copy-summary').textContent = 'Resumo copiado ✓';
    } catch {
      // ignora
    }
  });

  renderTrackFields();
})();
