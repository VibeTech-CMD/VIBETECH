/* ==========================================================================
   VibeTech|CMD — Controlador da Sala de Demonstração (Modelo Híbrido)
   ========================================================================== */

(() => {
  'use strict';

  const WHATSAPP_NUMBER = '5522999162793';

  /* Catálogo oficial da Sala de Demonstração.
     Para ativar a prévia ao vivo do 4Ever Cerimonial no futuro, basta colar a URL
     publicada no campo liveUrl abaixo. */
  const PROJECTS = {
    vibetech: {
      id: 'vibetech',
      name: 'VibeTech|CMD — Site Oficial',
      shortName: 'VibeTech Oficial',
      kicker: 'Case próprio · Em produção',
      status: 'Em produção',
      isDev: false,
      defaultMode: 'live',
      defaultWatermark: false,
      liveUrl: 'index.html?preview=1',
      addressLabel: 'vibetech.cmd · site oficial',
      headline: 'Nossa própria plataforma digital, construída do zero pela VibeTech.',
      description:
        'Criamos o site oficial da VibeTech|CMD como vitrine viva do nosso padrão de qualidade: identidade dark futurista, carregamento ultraleve, animações sutis, portfólio integrado e conversão direta no WhatsApp.',
      tags: ['Site Oficial', 'Design Exclusivo', 'Mobile-First', 'Alta Conversão'],
      mockTheme: 'vibetech',
      pillars: [
        {
          num: '01 / OBJETIVO',
          title: 'Autoridade imediata',
          text: 'Mostrar na prática, logo nos primeiros segundos de navegação, o acabamento estético e técnico que entregamos para cada cliente.'
        },
        {
          num: '02 / SOLUÇÃO',
          title: 'Arquitetura leve e responsiva',
          text: 'Interface desenhada sob medida com identidade visual própria, SEO técnico completo e carregamento ágil em qualquer celular.'
        },
        {
          num: '03 / CONVERSÃO',
          title: 'Do interesse ao WhatsApp',
          text: 'Mini-briefing inteligente, perguntas frequentes e sala de demonstração interativa que facilitam a decisão do cliente.'
        }
      ],
      waMessage: 'Olá, VibeTech! Vi o site oficial na Sala de Demonstração e quero um projeto nesse padrão para o meu negócio.'
    },

    '4ever-cerimonial': {
      id: '4ever-cerimonial',
      name: '4Ever Cerimonial — Site Oficial',
      shortName: '4Ever Cerimonial',
      kicker: 'Site Institucional · Em produção',
      status: 'Em produção',
      isDev: false,
      defaultMode: 'live',
      defaultWatermark: false,
      liveUrl: 'https://vibetech-cmd.github.io/4EVER_CERIMONIAL_OFICIAL/',
      addressLabel: '4ever-cerimonial · site oficial',
      headline: 'Elegância editorial e narrativa visual para um cerimonial memorável.',
      description:
        'Site oficial no ar desenvolvido para o 4Ever Cerimonial, combinando paleta sofisticada, curadoria de momentos reais (casamentos, 15 anos e eventos) e jornada pensada para transformar visitantes em pedidos de orçamento.',
      tags: ['Site Institucional', 'Eventos & Cerimonial', 'Identidade Editorial', 'No Ar'],
      mockTheme: '4ever',
      pillars: [
        {
          num: '01 / DESAFIO',
          title: 'Transmitir confiança e emoção',
          text: 'Casais e anfitriões decidem pelo visual e pela credibilidade. O site precisava refletir o cuidado real da equipe em cada detalhe.'
        },
        {
          num: '02 / SOLUÇÃO VIBETECH',
          title: 'Estética sofisticada e clara',
          text: 'Estrutura editorial pensada para valorizar fotografia, história da equipe e serviços de forma leve tanto no celular quanto no desktop.'
        },
        {
          num: '03 / RESULTADO',
          title: 'Publicado e pronto para converter',
          text: 'Site oficial no ar com navegação fluida em qualquer dispositivo e canais diretos para solicitação de orçamento.'
        }
      ],
      waMessage: 'Olá, VibeTech! Vi o site oficial do 4Ever Cerimonial na Sala de Demonstração e gostaria de conversar sobre um site para minha marca.'
    },

    '4ever-management': {
      id: '4ever-management',
      name: '4Ever Management — Aplicativo',
      shortName: '4Ever Management',
      kicker: 'Aplicativo Web · Em desenvolvimento',
      status: 'Em desenvolvimento',
      isDev: true,
      defaultMode: 'live',
      defaultWatermark: true,
      liveUrl: 'https://vibetech-cmd.github.io/4EVER-Management/',
      addressLabel: '4ever-management · aplicativo web',
      headline: 'Gestão centralizada de contratos, eventos e operação sob medida.',
      description:
        'Aplicativo web desenvolvido pela VibeTech|CMD para a operação interna do 4Ever Cerimonial, substituindo planilhas dispersas por um painel prático, seguro e acessível de qualquer dispositivo.',
      tags: ['Aplicativo Web', 'Gestão de Contratos', 'Painel Operacional', 'Sob Medida'],
      mockTheme: 'app',
      pillars: [
        {
          num: '01 / DESAFIO',
          title: 'Organizar múltiplos eventos',
          text: 'Centralizar contratos, checklists, serviços contratados e cronogramas em um único ambiente prático para toda a equipe.'
        },
        {
          num: '02 / SOLUÇÃO VIBETECH',
          title: 'Sistema moldado à rotina real',
          text: 'Interface intuitiva com indicadores rápidos, cadastro estruturado e visualização limpa tanto no computador quanto no celular.'
        },
        {
          num: '03 / RESULTADO',
          title: 'Mais agilidade no dia a dia',
          text: 'Redução de retrabalho operacional e base tecnológica preparada para receber novos módulos conforme a empresa cresce.'
        }
      ],
      waMessage: 'Olá, VibeTech! Vi o aplicativo 4Ever Management na Sala de Demonstração e quero saber como criar um aplicativo/sistema para minha empresa.'
    }
  };

  /* ---------- Elementos da interface ---------- */
  const projectButtons = Array.from(document.querySelectorAll('[data-project-id]'));
  const viewportButtons = Array.from(document.querySelectorAll('[data-viewport]'));
  const modeButtons = Array.from(document.querySelectorAll('[data-view-mode]'));
  const modeSwitcher = document.getElementById('mode-switcher');
  const vpSwitcher = document.getElementById('vp-switcher');

  const titleEl = document.getElementById('active-project-title');
  const statusEl = document.getElementById('active-project-status');
  const wmBadge = document.getElementById('watermark-badge');
  const waCtaTop = document.getElementById('studio-wa-cta');
  const waCtaCase = document.getElementById('case-wa-cta');
  const waCtaBanner = document.getElementById('case-banner-wa');

  const liveWrapper = document.getElementById('live-wrapper');
  const deviceFrame = document.getElementById('device-frame');
  const previewIframe = document.getElementById('preview-iframe');
  const chromeAddress = document.getElementById('chrome-address-text');
  const chromeVpLabel = document.getElementById('chrome-vp-label');
  const liveWatermark = document.getElementById('live-watermark');

  const caseView = document.getElementById('case-view');
  const caseKicker = document.getElementById('case-kicker');
  const caseHeadline = document.getElementById('case-headline');
  const caseDescription = document.getElementById('case-description');
  const caseTags = document.getElementById('case-tags');
  const casePillars = document.getElementById('case-pillars');
  const caseSwitchLiveBtn = document.getElementById('case-switch-live');
  const caseStageWm = document.getElementById('case-stage-wm');
  const mock4Ever = document.getElementById('mock-case-4ever');
  const mockApp = document.getElementById('mock-case-app');
  const mockVt = document.getElementById('mock-case-vibetech');

  let currentProject = PROJECTS.vibetech;
  let currentMode = 'live';
  let currentViewport = 'desktop';
  let watermarkEnabled = false;

  function buildWaLink(msg) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  }

  function updateWatermarkUi() {
    // Projetos em desenvolvimento mantêm marca d'água permanente e obrigatória;
    // projetos já finalizados e no ar ficam 100% limpos, sem marca d'água.
    const mustProtect = Boolean(currentProject.isDev);
    if (liveWatermark) liveWatermark.classList.toggle('is-active', mustProtect);
    if (caseStageWm) caseStageWm.classList.toggle('is-active', mustProtect);
    if (wmBadge) wmBadge.classList.toggle('is-hidden', !mustProtect);
  }

  function setViewport(vp) {
    currentViewport = vp;
    if (deviceFrame) {
      deviceFrame.classList.remove('vp-tablet', 'vp-mobile');
      if (vp === 'tablet') deviceFrame.classList.add('vp-tablet');
      if (vp === 'mobile') deviceFrame.classList.add('vp-mobile');
    }
    const labels = {
      desktop: 'Desktop · 100%',
      tablet: 'Tablet · 820px',
      mobile: 'Celular · 405px'
    };
    if (chromeVpLabel) chromeVpLabel.textContent = labels[vp] || labels.desktop;

    viewportButtons.forEach((btn) => {
      const isActive = btn.dataset.viewport === vp;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  function setViewMode(mode) {
    const canLive = Boolean(currentProject.liveUrl);
    currentMode = mode === 'live' && canLive ? 'live' : 'case';

    if (liveWrapper) liveWrapper.classList.toggle('is-hidden', currentMode !== 'live');
    if (caseView) caseView.classList.toggle('is-hidden', currentMode !== 'case');
    if (vpSwitcher) vpSwitcher.classList.toggle('is-hidden', currentMode !== 'live');

    modeButtons.forEach((btn) => {
      const isActive = btn.dataset.viewMode === currentMode;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });

    if (currentMode === 'live' && previewIframe && previewIframe.dataset.loadedUrl !== currentProject.liveUrl) {
      previewIframe.src = currentProject.liveUrl;
      previewIframe.dataset.loadedUrl = currentProject.liveUrl;
      previewIframe.title = `Prévia interativa: ${currentProject.name}`;
    }
  }

  function renderCaseContent(project) {
    if (caseKicker) caseKicker.textContent = project.kicker;
    if (caseHeadline) caseHeadline.textContent = project.headline;
    if (caseDescription) caseDescription.textContent = project.description;

    if (caseTags) {
      caseTags.innerHTML = '';
      project.tags.forEach((tag) => {
        const span = document.createElement('span');
        span.textContent = tag;
        caseTags.appendChild(span);
      });
    }

    if (casePillars) {
      casePillars.innerHTML = '';
      project.pillars.forEach((pillar) => {
        const card = document.createElement('article');
        card.className = 'case-card';

        const num = document.createElement('span');
        num.className = 'case-card-num';
        num.textContent = pillar.num;

        const h3 = document.createElement('h3');
        h3.textContent = pillar.title;

        const p = document.createElement('p');
        p.textContent = pillar.text;

        card.append(num, h3, p);
        casePillars.appendChild(card);
      });
    }

    if (mock4Ever) mock4Ever.classList.toggle('is-hidden', project.mockTheme !== '4ever');
    if (mockApp) mockApp.classList.toggle('is-hidden', project.mockTheme !== 'app');
    if (mockVt) mockVt.classList.toggle('is-hidden', project.mockTheme !== 'vibetech');

    if (caseSwitchLiveBtn) {
      caseSwitchLiveBtn.classList.toggle('is-hidden', !project.liveUrl);
    }
  }

  function loadProject(projectId, updateUrl = true) {
    const project = PROJECTS[projectId] || PROJECTS.vibetech;
    currentProject = project;
    watermarkEnabled = Boolean(project.defaultWatermark);

    document.title = `${project.name} — Sala de Demonstração VibeTech|CMD`;
    if (titleEl) titleEl.textContent = project.name;
    if (statusEl) {
      statusEl.textContent = project.status;
      statusEl.classList.toggle('is-dev', project.isDev);
    }
    if (chromeAddress) chromeAddress.textContent = project.addressLabel;

    const waHref = buildWaLink(project.waMessage);
    [waCtaTop, waCtaCase, waCtaBanner].forEach((el) => {
      if (el) el.href = waHref;
    });

    projectButtons.forEach((btn) => {
      const isActive = btn.dataset.projectId === project.id;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });

    const hasLive = Boolean(project.liveUrl);
    if (modeSwitcher) modeSwitcher.classList.toggle('is-hidden', !hasLive);

    renderCaseContent(project);
    setViewMode(project.defaultMode);
    updateWatermarkUi();

    if (updateUrl && window.history && typeof window.history.replaceState === 'function') {
      const url = new URL(window.location.href);
      url.searchParams.set('projeto', project.id);
      window.history.replaceState({}, '', url.toString());
    }
  }

  /* ---------- Eventos ---------- */
  projectButtons.forEach((btn) => {
    btn.addEventListener('click', () => loadProject(btn.dataset.projectId, true));
  });

  viewportButtons.forEach((btn) => {
    btn.addEventListener('click', () => setViewport(btn.dataset.viewport || 'desktop'));
  });

  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => setViewMode(btn.dataset.viewMode || 'case'));
  });

  if (caseSwitchLiveBtn) {
    caseSwitchLiveBtn.addEventListener('click', () => setViewMode('live'));
  }

  /* ---------- Inicialização a partir da URL ---------- */
  const params = new URLSearchParams(window.location.search);
  const initialProject = params.get('projeto') || 'vibetech';
  const initialMode = params.get('modo');
  setViewport('desktop');
  loadProject(initialProject, false);
  if (initialMode === 'case' || initialMode === 'live') {
    setViewMode(initialMode);
  }
})();
