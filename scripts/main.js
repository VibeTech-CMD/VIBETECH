/* ==========================================================================
   VibeTech|CMD — Script Oficial
   Partículas · Navegação · Vitrine Protegida GitHub · Mini-Briefing WhatsApp
   ========================================================================== */

(() => {
  'use strict';

  /* ---------- Configuração centralizada (fácil de atualizar no futuro) ---------- */
  const CONFIG = {
    brandName: 'VibeTech|CMD',
    whatsappNumber: '5522999162793',
    whatsappDisplay: '(22) 99916-2793',
    // Quando tiver o e-mail comercial da VibeTech, basta preencher abaixo:
    email: '',
    githubUser: 'VibeTech-CMD',
    // Repositórios ocultos da vitrine "Em desenvolvimento" (obsoletos ou já publicados no Portfólio Oficial)
    hiddenRepos: ['4ever-Cerimonial-obsoleto', 'VIBETECH'],
    // Catálogo curado para exibição comercial segura (sem expor código ou detalhes internos)
    projectCatalog: {
      VIBETECH: {
        previewId: 'vibetech',
        title: 'VibeTech|CMD — Site Oficial',
        category: 'Site Oficial',
        status: 'Em produção',
        isDev: false,
        briefType: 'Site Institucional',
        summary: 'Nossa própria plataforma institucional, projetada e evoluída internamente como vitrine do nosso padrão visual e técnico.'
      },
      '4EVER_CERIMONIAL_OFICIAL': {
        previewId: '4ever-cerimonial',
        title: '4Ever Cerimonial — Site Oficial',
        category: 'Site Institucional',
        status: 'Em desenvolvimento',
        isDev: true,
        briefType: 'Site Institucional',
        summary: 'Site oficial desenvolvido para assessoria e cerimonial de eventos, unindo sofisticação editorial e foco em conversão.'
      },
      '4EVER-Management': {
        previewId: '4ever-management',
        title: '4Ever Management — Aplicativo',
        category: 'Aplicativo de Gestão',
        status: 'Em desenvolvimento',
        isDev: true,
        briefType: 'Aplicativo / Sistema Web',
        summary: 'Aplicativo web sob medida para gestão de contratos, cronogramas e serviços da operação do 4Ever Cerimonial.'
      }
    }
  };

  /* ---------- Detecção de modo embutido (Sala de Demonstração) ---------- */
  const isEmbedded = new URLSearchParams(window.location.search).get('preview') === '1' || window.self !== window.top;
  if (isEmbedded) {
    document.body.classList.add('is-embedded');
    document.querySelectorAll('.preview-link').forEach((link) => {
      link.setAttribute('target', '_top');
    });
  }

  /* ---------- Utilitários ---------- */
  function buildWhatsAppUrl(message) {
    return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  }

  function formatRelativeDatePtBr(isoString) {
    if (!isoString) return 'Atualizado recentemente';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return 'Atualizado recentemente';

    const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Atualizado hoje';
    if (diffDays === 1) return 'Atualizado ontem';
    if (diffDays < 30) return `Atualizado há ${diffDays} dias`;

    return 'Atualizado em ' + date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  let toastTimer = 0;
  function showToast(message) {
    const toast = document.getElementById('vt-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  /* ---------- Ano dinâmico no rodapé ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Menu Mobile acessível ---------- */
  const menuButton = document.getElementById('menu-toggle');
  const nav = document.getElementById('nav-links');

  function setMenuState(open) {
    if (!menuButton || !nav) return;
    nav.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menuButton.textContent = open ? '✕' : '☰';
  }

  if (menuButton && nav) {
    menuButton.addEventListener('click', (event) => {
      event.stopPropagation();
      setMenuState(!nav.classList.contains('open'));
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenuState(false));
    });

    document.addEventListener('click', (event) => {
      if (nav.classList.contains('open') && !nav.contains(event.target) && !menuButton.contains(event.target)) {
        setMenuState(false);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('open')) {
        setMenuState(false);
        menuButton.focus();
      }
    });
  }

  /* ---------- Barra de progresso de leitura + Scroll-spy ---------- */
  const progressBar = document.getElementById('scroll-progress');
  const navAnchors = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  const watchedSections = navAnchors
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  function updateScrollUi() {
    if (progressBar) {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0;
      progressBar.style.width = `${pct.toFixed(2)}%`;
    }

    const offset = window.scrollY + 140;
    let currentId = '';
    for (const sec of watchedSections) {
      if (sec.offsetTop <= offset) currentId = sec.id;
    }
    navAnchors.forEach((a) => {
      const isActive = currentId && a.getAttribute('href') === `#${currentId}`;
      a.classList.toggle('active', Boolean(isActive));
    });
  }

  window.addEventListener('scroll', updateScrollUi, { passive: true });
  window.addEventListener('resize', updateScrollUi, { passive: true });
  updateScrollUi();

  /* ---------- Scroll Reveal suave (progressive enhancement seguro) ---------- */
  const revealItems = Array.from(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('js-reveal');

    const revealIfInView = () => {
      const limit = window.innerHeight * 1.08;
      revealItems.forEach((el) => {
        if (!el.classList.contains('is-visible') && el.getBoundingClientRect().top <= limit) {
          el.classList.add('is-visible');
        }
      });
    };

    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.04, rootMargin: '0px 0px 40px 0px' }
    );

    revealItems.forEach((el) => revealObserver.observe(el));
    revealIfInView();
    window.addEventListener('scroll', revealIfInView, { passive: true });
  } else {
    revealItems.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Efeito Spotlight nos cards (desktop) ---------- */
  if (window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.card-surface').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
        card.style.setProperty('--my', `${event.clientY - rect.top}px`);
      });
    });
  }

  /* ---------- Proteção visual anti-cópia nas prévias e vitrine ---------- */
  document.querySelectorAll('[data-protected="true"]').forEach((zone) => {
    zone.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      showToast('Prévia protegida pela VibeTech|CMD. Solicite uma demonstração guiada pelo WhatsApp.');
    });
    zone.addEventListener('dragstart', (event) => event.preventDefault());
    zone.addEventListener('copy', (event) => {
      event.preventDefault();
      showToast('Conteúdo protegido por direitos autorais da VibeTech|CMD.');
    });
  });

  /* ---------- Pré-preenchimento do Mini-Briefing (botões de portfólio e vitrine) ---------- */
  const typeButtons = Array.from(document.querySelectorAll('.type-pill'));
  const briefTypeInput = document.getElementById('brief-type');
  const briefGoalInput = document.getElementById('brief-goal');
  const briefNameInput = document.getElementById('brief-name');
  const briefCompanyInput = document.getElementById('brief-company');
  const briefingForm = document.getElementById('briefing-form');

  function selectProjectType(typeLabel) {
    if (!briefTypeInput) return;
    briefTypeInput.value = typeLabel;
    typeButtons.forEach((btn) => {
      const match = btn.dataset.type === typeLabel;
      btn.classList.toggle('active', match);
      btn.setAttribute('aria-pressed', String(match));
    });
  }

  typeButtons.forEach((btn) => {
    btn.addEventListener('click', () => selectProjectType(btn.dataset.type || 'Site Institucional'));
  });

  function triggerDemoRequest(projectTitle, briefType) {
    selectProjectType(briefType || 'Site Institucional');
    if (briefGoalInput) {
      briefGoalInput.value = `Gostaria de conhecer melhor o projeto "${projectTitle}" e conversar sobre uma solução parecida para o meu negócio.`;
    }
    const contactSection = document.getElementById('contato');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (briefNameInput) {
      setTimeout(() => briefNameInput.focus({ preventScroll: true }), 450);
    }
    showToast(`Projeto "${projectTitle}" selecionado no briefing!`);
  }

  document.querySelectorAll('[data-demo-project]').forEach((btn) => {
    btn.addEventListener('click', () => {
      triggerDemoRequest(btn.dataset.demoProject, btn.dataset.demoType);
    });
  });

  if (briefingForm) {
    briefingForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const type = (briefTypeInput && briefTypeInput.value) || 'Site Institucional';
      const name = briefNameInput ? briefNameInput.value.trim() : '';
      const company = briefCompanyInput ? briefCompanyInput.value.trim() : '';
      const goal = briefGoalInput ? briefGoalInput.value.trim() : '';

      const lines = ['Olá, VibeTech! Quero conversar sobre um projeto.'];
      lines.push(`• Tipo de solução: ${type}`);
      if (name) lines.push(`• Nome: ${name}`);
      if (company) lines.push(`• Empresa / Projeto: ${company}`);
      if (goal) lines.push(`• Ideia / Objetivo: ${goal}`);

      const url = buildWhatsAppUrl(lines.join('\n'));
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  }

  /* ---------- FAQ: comportamento limpo de acordeão ---------- */
  const faqItems = Array.from(document.querySelectorAll('.faq-item'));
  faqItems.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        faqItems.forEach((other) => {
          if (other !== item && other.open) other.open = false;
        });
      }
    });
  });

  /* ---------- Vitrine Dinâmica Sincronizada com o GitHub (Protegida) ---------- */
  const ghGrid = document.getElementById('github-showcase-grid');
  const ghSyncLabel = document.getElementById('github-sync-label');

  function createLockSvg() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');

    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', '5');
    rect.setAttribute('y', '11');
    rect.setAttribute('width', '14');
    rect.setAttribute('height', '10');
    rect.setAttribute('rx', '2');

    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', 'M8 11V7a4 4 0 0 1 8 0v4');

    svg.append(rect, path);
    return svg;
  }

  function createShieldSvg() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');

    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', 'M12 3l7 4v5c0 5-3.2 8.2-7 9-3.8-.8-7-4-7-9V7l7-4z');

    const check = document.createElementNS(ns, 'path');
    check.setAttribute('d', 'M9.5 12.2l1.8 1.8 3.4-3.6');

    svg.append(path, check);
    return svg;
  }

  function sanitizeRepoToShowcaseItem(repo) {
    const mapped = CONFIG.projectCatalog[repo.name];
    if (mapped) {
      return {
        previewId: mapped.previewId || '',
        title: mapped.title,
        category: mapped.category,
        status: mapped.status,
        isDev: mapped.isDev,
        briefType: mapped.briefType,
        summary: mapped.summary,
        updatedLabel: formatRelativeDatePtBr(repo.pushed_at || repo.updated_at)
      };
    }

    // Fallback seguro caso um novo projeto seja criado no GitHub no futuro
    const cleanTitle = String(repo.name || 'Projeto VibeTech')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      previewId: '',
      title: cleanTitle,
      category: 'Projeto Digital',
      status: 'Em desenvolvimento',
      isDev: true,
      briefType: 'Site Institucional',
      summary: 'Projeto digital desenvolvido pela VibeTech|CMD. Código-fonte e detalhes técnicos mantidos sob acesso restrito.',
      updatedLabel: formatRelativeDatePtBr(repo.pushed_at || repo.updated_at)
    };
  }

  function renderShowcaseCards(items) {
    if (!ghGrid) return;
    ghGrid.innerHTML = '';

    items.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'gh-card';

      const top = document.createElement('div');
      top.className = 'gh-card-top';

      const lockBadge = document.createElement('span');
      lockBadge.className = 'gh-lock-badge';
      lockBadge.append(createLockSvg(), document.createTextNode(item.status));

      const updated = document.createElement('span');
      updated.className = 'gh-updated';
      updated.textContent = item.updatedLabel;

      top.append(lockBadge, updated);

      const title = document.createElement('h4');
      title.textContent = item.title;

      const summary = document.createElement('p');
      summary.textContent = item.summary;

      const protectedBar = document.createElement('div');
      protectedBar.className = 'gh-protected-bar';
      protectedBar.append(
        createShieldSvg(),
        document.createTextNode('Código-fonte restrito · Marca d’água VibeTech|CMD')
      );

      const foot = document.createElement('div');
      foot.className = 'gh-card-foot';

      const category = document.createElement('span');
      category.className = 'gh-category';
      category.textContent = item.category;

      let cta;
      if (item.previewId) {
        cta = document.createElement('a');
        cta.className = 'button button-secondary button-sm preview-link';
        cta.href = `preview.html?projeto=${encodeURIComponent(item.previewId)}`;
        if (isEmbedded) cta.target = '_top';
        cta.textContent = 'Abrir demonstração ↗';
      } else {
        cta = document.createElement('button');
        cta.type = 'button';
        cta.className = 'button button-secondary button-sm';
        cta.textContent = 'Ver com a equipe ↗';
        cta.addEventListener('click', () => triggerDemoRequest(item.title, item.briefType));
      }

      foot.append(category, cta);

      card.append(top, title, summary, protectedBar, foot);
      ghGrid.appendChild(card);
    });
  }

  function getFallbackShowcaseItems() {
    return Object.values(CONFIG.projectCatalog)
      .filter((entry) => entry.isDev)
      .map((entry) => ({
        ...entry,
        updatedLabel: 'Atualizado · VibeTech'
      }));
  }

  function formatShowcaseCountLabel(count) {
    return count === 1
      ? 'Vitrine ao vivo · 1 projeto em andamento'
      : `Vitrine ao vivo · ${count} projetos em andamento`;
  }

  async function loadGitHubShowcase() {
    if (!ghGrid) return;

    const cacheKey = `vt_live_showcase_v2_${CONFIG.githubUser}`;
    const cacheTtlMs = 5 * 60 * 1000;

    try {
      const cachedRaw = sessionStorage.getItem(cacheKey);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (cached && Date.now() - cached.ts < cacheTtlMs && Array.isArray(cached.items) && cached.items.length) {
          renderShowcaseCards(cached.items);
          if (ghSyncLabel) ghSyncLabel.textContent = formatShowcaseCountLabel(cached.items.length);
          return;
        }
      }
    } catch {
      // Ignora indisponibilidade de sessionStorage
    }

    try {
      const response = await fetch(
        `https://api.github.com/users/${CONFIG.githubUser}/repos?sort=pushed&per_page=10`,
        { headers: { Accept: 'application/vnd.github+json' } }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const repos = await response.json();
      const hidden = new Set(CONFIG.hiddenRepos.map((n) => n.toLowerCase()));

      // Ordena priorizando os projetos oficiais em desenvolvimento, depois os mais recentes
      const priorityOrder = ['4EVER_CERIMONIAL_OFICIAL', '4EVER-Management'];
      const filtered = repos
        .filter((repo) => repo && !repo.fork && !repo.archived && !hidden.has(String(repo.name).toLowerCase()))
        .sort((a, b) => {
          const ia = priorityOrder.indexOf(a.name);
          const ib = priorityOrder.indexOf(b.name);
          if (ia !== -1 && ib !== -1) return ia - ib;
          if (ia !== -1) return -1;
          if (ib !== -1) return 1;
          return new Date(b.pushed_at) - new Date(a.pushed_at);
        })
        .slice(0, 6)
        .map(sanitizeRepoToShowcaseItem);

      const finalItems = filtered.length ? filtered : getFallbackShowcaseItems();
      renderShowcaseCards(finalItems);
      if (ghSyncLabel) ghSyncLabel.textContent = formatShowcaseCountLabel(finalItems.length);

      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), items: finalItems }));
      } catch {
        // Ignora erro de quota
      }
    } catch {
      const fallback = getFallbackShowcaseItems();
      renderShowcaseCards(fallback);
      if (ghSyncLabel) ghSyncLabel.textContent = formatShowcaseCountLabel(fallback.length);
    }
  }

  loadGitHubShowcase();

  /* ---------- Fundo espacial global: constelações e estrelas piscando ---------- */
  (() => {
    const canvas = document.getElementById('particles');
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let nodes = [];
    let stars = [];
    let raf = 0;
    let lastScrollY = window.scrollY || 0;
    const LINK = 128;

    const STAR_COLORS = [
      [248, 250, 252], // branco estelar
      [0, 217, 245],   // ciano VibeTech
      [143, 241, 255], // azul gelo
      [0, 214, 160]    // turquesa sutil
    ];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const areaFactor = (w * h) / (1440 * 900);
      const nodeCount = Math.round(Math.min(62, Math.max(22, 46 * Math.sqrt(areaFactor))));
      const starCount = Math.round(Math.min(115, Math.max(42, 85 * Math.sqrt(areaFactor))));

      nodes = Array.from({ length: nodeCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.24,
        vy: (Math.random() - 0.5) * 0.24,
        r: Math.random() * 1.35 + 0.6,
        phase: Math.random() * Math.PI * 2,
        speed: 0.012 + Math.random() * 0.018
      }));

      stars = Array.from({ length: starCount }, () => {
        const rgb = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.15 + 0.35,
          minA: 0.06 + Math.random() * 0.14,
          maxA: 0.42 + Math.random() * 0.48,
          phase: Math.random() * Math.PI * 2,
          speed: 0.008 + Math.random() * 0.026,
          depth: 0.08 + Math.random() * 0.24,
          rgb,
          sparkle: Math.random() < 0.22
        };
      });
    }

    function wrap(val, max) {
      if (val < -8) return max + 8;
      if (val > max + 8) return -8;
      return val;
    }

    function frame() {
      const scrollY = window.scrollY || 0;
      const scrollDelta = scrollY - lastScrollY;
      lastScrollY = scrollY;

      ctx.clearRect(0, 0, w, h);

      // 1. Estrelas espaciais piscando suavemente
      for (const s of stars) {
        s.phase += s.speed;
        if (scrollDelta !== 0) {
          s.y = wrap(s.y - scrollDelta * s.depth, h);
        }
        const wave = (Math.sin(s.phase) + 1) * 0.5;
        const alpha = s.minA + (s.maxA - s.minA) * wave;
        const [r, g, b] = s.rgb;

        ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();

        // Brilho cruzado sutil nas estrelas mais brilhantes no pico do piscar
        if (s.sparkle && wave > 0.78) {
          const glowAlpha = ((wave - 0.78) / 0.22) * 0.45;
          const arm = s.r * 3.6;
          ctx.strokeStyle = `rgba(${r},${g},${b},${glowAlpha.toFixed(3)})`;
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.moveTo(s.x - arm, s.y);
          ctx.lineTo(s.x + arm, s.y);
          ctx.moveTo(s.x, s.y - arm);
          ctx.lineTo(s.x, s.y + arm);
          ctx.stroke();
        }
      }

      // 2. Nós de constelação e linhas conectivas
      for (const p of nodes) {
        p.x = wrap(p.x + p.vx, w);
        p.y = wrap(p.y + p.vy - scrollDelta * 0.14, h);
        p.phase += p.speed;
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.hypot(dx, dy);
          if (d < LINK) {
            const lineAlpha = (1 - d / LINK) * 0.24;
            ctx.strokeStyle = `rgba(8,123,255,${lineAlpha.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      for (const p of nodes) {
        const pulse = 0.45 + ((Math.sin(p.phase) + 1) * 0.5) * 0.4;
        ctx.fillStyle = `rgba(0,217,245,${pulse.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    const start = () => {
      if (!raf && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    resize();
    let resizeTimer = 0;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    start();
  })();
})();
