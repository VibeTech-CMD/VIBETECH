/* ==========================================================================
   VibeTech|CMD — Catálogo Oficial, Regras Financeiras e Templates (Seções 2, 4 e 5)
   ========================================================================== */

window.VT_PRD = (() => {
  'use strict';

  const CATALOG = [
    { id: 'lp-basic', category: 'Landing Page', name: 'Landing Page — Basic', scope: '4–6 seções, responsivo, WhatsApp direto, animações discretas', price: 950, deadline: 'Até 15 dias', revisions: 2 },
    { id: 'lp-medium', category: 'Landing Page', name: 'Landing Page — Medium', scope: '7–10 seções, design elaborado, microinterações, narrativa trabalhada', price: 1650, deadline: 'Até 15 dias', revisions: 2 },
    { id: 'lp-advanced', category: 'Landing Page', name: 'Landing Page — Advanced', scope: '10–15 seções, altamente personalizado, animações sofisticadas', price: 2500, deadline: 'Sob escopo', revisions: 3 },
    { id: 'port-one', category: 'Portfólio', name: 'Portfólio — One-Page', scope: 'Página única com galeria estática delimitada', price: 950, deadline: 'Até 15 dias', revisions: 2 },
    { id: 'port-multi', category: 'Portfólio', name: 'Portfólio — Multipáginas', scope: 'Home, Sobre, Projetos (galeria estática) e Contato (até 5 páginas)', price: 1600, deadline: '15 a 20 dias', revisions: 2 },
    { id: 'inst-essencial', category: 'Institucional', name: 'Institucional — Essencial', scope: '1 página corporativa objetiva', price: 1100, deadline: 'Até 15 dias', revisions: 2 },
    { id: 'inst-profissional', category: 'Institucional', name: 'Institucional — Profissional', scope: 'Até 5 páginas corporativas completas', price: 2200, deadline: '15 a 20 dias', revisions: 3 },
    { id: 'inst-premium', category: 'Institucional', name: 'Institucional — Premium', scope: 'Até 8 páginas, personalização e recursos ampliados', price: 3400, deadline: '20 a 30 dias', revisions: 3 },
    { id: 'auditoria-express', category: 'Auditoria', name: 'Auditoria — Express', scope: 'Diagnóstico técnico/visual rápido + relatório de recomendações', price: 300, deadline: '3 a 5 dias úteis', revisions: 1 },
    { id: 'auditoria-completa', category: 'Auditoria', name: 'Auditoria — Completa', scope: 'Diagnóstico técnico/visual aprofundado + plano de ação detalhado', price: 550, deadline: '5 a 7 dias úteis', revisions: 1 },
    { id: 'redesign-n1', category: 'Redesign', name: 'Redesign — Nível 1 (Visual)', scope: 'Modernização visual mantendo estrutura atual', price: 750, deadline: '10 a 15 dias', revisions: 2 },
    { id: 'redesign-n2', category: 'Redesign', name: 'Redesign — Nível 2 (Estrutural)', scope: 'Reorganização estrutural, seções, conversão e visual', price: 1400, deadline: '15 a 20 dias', revisions: 2 },
    { id: 'redesign-n3', category: 'Redesign', name: 'Redesign — Nível 3 (Completo)', scope: 'Reconstrução completa do zero sob nova arquitetura', price: 2200, deadline: '20 a 30 dias', revisions: 3 },
    { id: 'app-frontend', category: 'Aplicações Web', name: 'Aplicação Web — Front-end / Calculadora', scope: 'Calculadoras interativas e ferramentas web sob medida', price: 950, deadline: '10 a 15 dias', revisions: 2 },
    { id: 'app-crud', category: 'Aplicações Web', name: 'Aplicação Web — Sistema CRUD (BD + Login)', scope: 'Sistema web com autenticação e banco de dados na nuvem', price: 2200, deadline: '15 a 25 dias', revisions: 3 },
    { id: 'app-mvp', category: 'Aplicações Web', name: 'Aplicação Web — Dashboard / MVP', scope: 'Painel gerencial completo, métricas e MVP sob medida', price: 3500, deadline: '25 a 35 dias', revisions: 3 }
  ];

  const ADDONS = [
    { id: 'pagina-extra', label: 'Página extra', price: 300 },
    { id: 'secao-extra', label: 'Seção extra', price: 150 },
    { id: 'copy-lp', label: 'Organização / Copywriting básico (LP)', price: 250 },
    { id: 'copy-inst', label: 'Organização / Copywriting básico (Institucional)', price: 450 },
    { id: 'curadoria-img', label: 'Curadoria / Tratamento básico de imagens', price: 150 },
    { id: 'cms-blog', label: 'Blog ou Painel Administrativo (CMS)', price: 600 },
    { id: 'api-wa', label: 'Integração API / Formulário avançado / WhatsApp dinâmico', price: 300 },
    { id: 'revisao-extra', label: 'Rodada extra de revisão / Atendimento avulso', price: 150 }
  ];

  const MAINTENANCE_PLANS = {
    nenhum: { label: 'Sem plano', quota: 0, price: 0, promo: '' },
    basico: { label: 'Básico (1 a 2 atend./mês)', quota: 2, price: 80, promo: 'Valor promocional de entrada (base: R$ 40,00/atendimento)' },
    medio: { label: 'Médio (2 a 4 atend./mês)', quota: 4, price: 150, promo: 'Economia de R$ 10,00/mês frente a 2 planos básicos' },
    avancado: { label: 'Avançado (até 10 atend./mês)', quota: 10, price: 300, promo: 'Super Economia de R$ 100,00/mês (25% OFF)' }
  };

  const KANBAN_STAGES = [
    { id: 'lead_briefing', label: 'Lead / Briefing' },
    { id: 'proposta_enviada', label: 'Proposta Enviada' },
    { id: 'em_desenvolvimento', label: 'Em Desenvolvimento' },
    { id: 'revisao_aprovacao', label: 'Revisão / Aprovação' },
    { id: 'publicado_manutencao', label: 'Publicado / Manutenção' }
  ];

  function formatMoney(v) {
    return Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatBRL(v) {
    return `R$ ${formatMoney(v)}`;
  }

  /* Conversão de valor numérico para extenso em português (Reais e centavos) */
  function numberToWordsPt(num) {
    const n = Math.round(Number(num || 0) * 100);
    const reais = Math.floor(n / 100);
    const centavos = n % 100;

    const u = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const d10 = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const d = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const c = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

    function triple(x) {
      if (x === 0) return '';
      if (x === 100) return 'cem';
      const parts = [];
      const h = Math.floor(x / 100);
      const rest = x % 100;
      if (h) parts.push(c[h]);
      if (rest >= 10 && rest < 20) {
        parts.push(d10[rest - 10]);
      } else {
        const tens = Math.floor(rest / 10);
        const units = rest % 10;
        if (tens) parts.push(d[tens]);
        if (units) parts.push(u[units]);
      }
      return parts.join(' e ');
    }

    function intToPt(x) {
      if (x === 0) return 'zero';
      const mil = Math.floor(x / 1000);
      const rem = x % 1000;
      const out = [];
      if (mil > 0) {
        out.push(mil === 1 ? 'mil' : `${triple(mil)} mil`);
      }
      if (rem > 0) {
        if (mil > 0 && (rem < 100 || rem % 100 === 0)) out.push('e');
        out.push(triple(rem));
      }
      return out.join(' ');
    }

    const parts = [];
    if (reais > 0 || centavos === 0) {
      parts.push(`${intToPt(reais)} ${reais === 1 ? 'real' : 'reais'}`);
    }
    if (centavos > 0) {
      parts.push(`${intToPt(centavos)} ${centavos === 1 ? 'centavo' : 'centavos'}`);
    }
    return parts.join(' e ');
  }

  function computeInstallments(total) {
    const t = Math.max(0, Number(total || 0));
    if (t <= 600) {
      const p1 = Math.round(t * 50) / 100;
      const p2 = Math.round((t - p1) * 100) / 100;
      return {
        rule: '50% entrada + 50% na entrega final',
        isThree: false,
        p1,
        p2,
        p3: 0,
        proposalText: `• 50% na assinatura: ${formatBRL(p1)}\n• 50% na entrega final: ${formatBRL(p2)}`,
        contractText: `a) 50% (cinquenta por cento) — ${formatBRL(p1)} — na assinatura deste contrato (entrada);\nb) 50% (cinquenta por cento) — ${formatBRL(p2)} — na aprovação final, antes da publicação.`
      };
    }
    const p1 = Math.round(t * 40) / 100;
    const p2 = Math.round(t * 30) / 100;
    const p3 = Math.round((t - p1 - p2) * 100) / 100;
    return {
      rule: '40% entrada + 30% na 1ª prévia + 30% na entrega final',
      isThree: true,
      p1,
      p2,
      p3,
      proposalText: `• 40% na assinatura: ${formatBRL(p1)}\n• 30% na 1ª prévia: ${formatBRL(p2)}\n• 30% na entrega final: ${formatBRL(p3)}`,
      contractText: `a) 40% (quarenta por cento) — ${formatBRL(p1)} — na assinatura deste contrato (entrada);\nb) 30% (trinta por cento) — ${formatBRL(p2)} — na entrega da 1ª prévia/etapa do projeto;\nc) 30% (trinta por cento) — ${formatBRL(p3)} — na aprovação final, antes da publicação.`
    };
  }

  function buildFullContractText(s, provider) {
    const inst = computeInstallments(s.total_value);
    const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const cityUf = `${provider.city || 'Macaé'} – ${provider.state || 'RJ'}`;
    const contratadaNome = provider.ownerName || 'Cleisson Martins Diogo';
    const contratadaCpf = provider.document || '[CPF]';
    const contratadaEnd = provider.address || cityUf;
    const pixKey = provider.pixKey || provider.document || provider.email || '(informar chave Pix)';
    const clientAddr = s.meta?.client_address || '[Endereço do Contratante]';
    const packageName = s.meta?.package_name || s.project_title;
    const revisions = s.meta?.revisions_count || 2;
    const footerWaiver = Boolean(s.meta?.footer_waiver);

    const scopeList = (s.items || [])
      .map((it, idx) => `   ${idx + 1}. ${it.desc} (${formatBRL(it.price)})`)
      .join('\n');

    const footerClause = footerWaiver
      ? 'Mediante pagamento da taxa adicional específica inclusa no orçamento, fica dispensada a exibição do crédito da CONTRATADA no rodapé do projeto.'
      : 'A CONTRATANTE autoriza expressamente a CONTRATADA a manter, no rodapé do projeto entregue, assinatura discreta contendo crédito de desenvolvimento com link clicável direcionado ao domínio oficial https://vibetechcmd.com.br, comprometendo-se a não removê-lo sem prévio acordo. A eventual remoção do crédito poderá ser contratada mediante taxa adicional de 20% (vinte por cento) sobre o valor do projeto ou mínimo de R$ 250,00 (duzentos e cinquenta reais).';

    return `Pelo presente instrumento de prestação de serviços, de um lado:

CONTRATADA: ${contratadaNome}, pessoa física, inscrita no CPF sob o nº ${contratadaCpf}, residente e domiciliada em ${contratadaEnd}, operando sob a marca comercial VibeTech|CMD (https://vibetechcmd.com.br), doravante denominada simplesmente CONTRATADA;

E, de outro lado:

CONTRATANTE: ${s.client_name || '[Nome ou Razão Social]'}${s.client_company ? ` (${s.client_company})` : ''}, inscrito(a) no CPF/CNPJ sob o nº ${s.client_document || '[CPF/CNPJ]'}, com endereço em ${clientAddr}, telefone/WhatsApp ${s.client_whatsapp || '[WhatsApp]'} e e-mail ${s.client_email || '[E-mail]'}, doravante denominado(a) simplesmente CONTRATANTE;

Têm entre si, justas e acordadas, as seguintes cláusulas e condições que regerão a presente relação contratual:

CLÁUSULA 1ª — DO OBJETO E DO ESCOPO FECHADO
1.1. O presente contrato tem por objeto a prestação de serviços técnicos especializados de webdesign e desenvolvimento web pela CONTRATADA em favor da CONTRATANTE, consistentes na criação de ${packageName}, conforme especificações técnicas detalhadas no Orçamento / Proposta Comercial nº ${s.code}, que passa a integrar este instrumento como parte indissociável.
1.2. Compreendem o escopo contratado:
${scopeList || '   1. Conforme escopo aprovado na proposta comercial.'}
1.3. Ficam expressamente EXCLUÍDOS do presente contrato, salvo contratação formal de aditivo apartado:
a) Aquisição, registro ou renovação de domínio próprio, bem como custos de planos pagos de hospedagem, servidores, bancos de dados, APIs ou licenças de terceiros;
b) Produção fotográfica, filmagem, criação de identidade visual completa ou redação integral de textos (copywriting), salvo se expressamente incluídos no item 1.2;
c) Desenvolvimento de chatbots, integrações complexas, WhatsApp API, sistemas de CRM, painéis administrativos, e-commerce ou quaisquer páginas, seções e funcionalidades não descritas no item 1.2.

CLÁUSULA 2ª — DAS OBRIGAÇÕES DA CONTRATANTE
2.1. Compete à CONTRATANTE fornecer, de forma clara e organizada, todos os materiais indispensáveis à execução do projeto — incluindo textos, descrições, imagens, logomarca, dados de contato, informações comerciais e eventuais acessos técnicos — responsabilizando-se integralmente pela veracidade, legalidade e direitos autorais/de imagem de todo o conteúdo fornecido.
2.2. A CONTRATANTE é a única e exclusiva titular do domínio, da conta de hospedagem (quando aplicável) e de eventuais serviços externos contratados, arcando diretamente com seus respectivos custos e renovações, cabendo-lhe conceder acesso técnico temporário e autorizado à CONTRATADA para fins de configuração e publicação.
2.3. A CONTRATANTE compromete-se a participar das etapas de alinhamento e validação (Brainstorm e Revisões) e a efetuar os pagamentos rigorosamente nas datas e condições estabelecidas na Cláusula 6ª.

CLÁUSULA 3ª — DAS OBRIGAÇÕES DA CONTRATADA E DO BÔNUS DE PUBLICAÇÃO
3.1. Compete à CONTRATADA executar o projeto com zelo técnico, código limpo, design responsivo (adaptado a dispositivos móveis e computadores) e fidelidade ao escopo aprovado.
3.2. A título de BÔNUS EXCLUSIVO incluso no presente contrato, a CONTRATADA realizará a publicação inicial do projeto no ambiente de hospedagem previsto, configuração de SEO técnico básico (meta tags, títulos e estrutura amigável a buscadores) e configuração inicial de métricas básicas, desde que compatíveis com a infraestrutura sob titularidade da CONTRATANTE.

CLÁUSULA 4ª — DOS PRAZOS, GATILHO DE INÍCIO E JANELA DE ESTABILIZAÇÃO
4.1. O prazo estimado para desenvolvimento do projeto é de ${s.delivery_days || 'Até 15 dias'}.
4.2. O prazo estipulado no item 4.1 SOMENTE terá início após o cumprimento cumulativo de 3 (três) condições essenciais:
a) Confirmação bancária do pagamento da parcela inicial (entrada);
b) Envio das informações e materiais obrigatórios pela CONTRATANTE; e
c) Realização da etapa unificada de Onboarding e Brainstorm com validação da direção conceitual e visual do projeto.
4.3. Concluído o desenvolvimento, aprovada a versão final pela CONTRATANTE e confirmada a quitação da última parcela, a CONTRATADA disporá de uma janela operacional adicional de até 5 (cinco) dias corridos para executar a publicação definitiva, configurações de SEO/métricas (Bônus) e validação integral da operacionalidade no ar.

CLÁUSULA 5ª — DO FLUXO DE VALIDAÇÃO, REVISÕES E ADITIVOS
5.1. O desenvolvimento seguirá fluxo estruturado de 3 (três) etapas: (i) Alinhamento/Onboarding e Brainstorm; (ii) Entrega de 1ª Prévia em ambiente temporário de homologação; e (iii) Ajustes e Validação Final.
5.2. Estão incluídas no valor contratado ${revisions} rodadas de revisão estruturada dentro do escopo original. Todas as aprovações de etapas, pedidos de revisão e solicitações extras deverão ser registrados por escrito via WhatsApp ou e-mail oficial das partes, possuindo plena validade comprobatória.
5.3. Solicitações de rodadas extras de revisão acima do limite previsto no item 5.2, bem como inclusão de novas páginas, seções, funcionalidades ou alterações estruturais após etapa já aprovada, dependerão de aditivo por escrito (com redefinição de valor e prazo), observada a taxa mínima de R$ 150,00 (cento e cinquenta reais) por demanda avulsa.

CLÁUSULA 6ª — DO PREÇO, PAGAMENTO E TRAVA DE ENTREGA
6.1. Pelos serviços contratados, a CONTRATANTE pagará à CONTRATADA o valor total de ${formatBRL(s.total_value)} (${numberToWordsPt(s.total_value)}), exclusivamente via transferência Pix para a chave ${pixKey}, conforme a seguinte divisão:
${inst.contractText}
6.2. A CONTRATADA atua como prestadora de serviços Pessoa Física, não havendo emissão de Nota Fiscal de Serviços; a quitação de cada parcela será comprovada pelo comprovante bancário de transferência Pix e respectivo recibo emitido pela CONTRATADA.
6.3. TRAVA DE ENTREGA: A publicação definitiva no domínio oficial da CONTRATANTE e/ou a entrega definitiva do código-fonte e documentação técnica ocorrerão EXCLUSIVAMENTE após a confirmação do pagamento integral (100%) do valor contratado.

CLÁUSULA 7ª — DOS ATRASOS, TOLERÂNCIA E PENALIDADES
7.1. Fica estabelecida tolerância recíproca de até 5 (cinco) dias corridos após a data originalmente estimada para cumprimento de obrigações financeiras ou de entrega.
7.2. Atraso de Materiais ou Aprovações pela CONTRATANTE: O atraso no envio de materiais, acessos ou retornos de aprovação suspenderá automaticamente a contagem do prazo de entrega, acrescendo-se ao cronograma período equivalente ao atraso, sujeito à disponibilidade de agenda da CONTRATADA.
7.3. Atraso de Pagamento pela CONTRATANTE: Ultrapassada a tolerância de 5 (cinco) dias corridos, os trabalhos serão imediatamente pausados e incidirá sobre a parcela em aberto multa moratória fixa de 2% (dois por cento) acrescida de juros de mora de 1% (um por cento) ao mês, calculados proporcionalmente por dia de atraso (pro rata die), dentro dos limites legais vigentes.
7.4. Atraso Injustificado pela CONTRATADA: Ultrapassada a tolerância de 5 (cinco) dias corridos sem culpa da CONTRATANTE e sem justificativa técnica prévia, as partes renegociarão nova data de entrega e será concedido à CONTRATANTE desconto fixo de 2% (dois por cento) sobre o valor total do projeto.

CLÁUSULA 8ª — DO CRÉDITO DE AUTORIA NO RODAPÉ E DIREITO DE PORTFÓLIO
8.1. ${footerClause}
8.2. A CONTRATANTE autoriza expressamente a CONTRATADA a exibir imagens, vídeos, prints, link e descrição do projeto concluído em seu portfólio oficial (https://vibetechcmd.com.br), redes sociais e materiais comerciais, para fins de demonstração técnica a potenciais clientes.

CLÁUSULA 9ª — DA PROPRIEDADE INTELECTUAL, CÓPIA DE SEGURANÇA E LGPD
9.1. Os direitos patrimoniais de uso do projeto e a entrega do código-fonte à CONTRATANTE somente serão transferidos após a quitação integral do valor previsto na Cláusula 6ª.
9.2. Nos termos da Lei de Software (Lei nº 9.609/1998) e da Lei de Direitos Autorais (Lei nº 9.610/1998), a CONTRATADA conserva os direitos morais de autoria sobre sua criação, bem como o direito de reutilizar conhecimentos técnicos, estruturas genéricas, componentes não exclusivos e bibliotecas em outros projetos.
9.3. CÓPIA DE SEGURANÇA INTERNA: A CONTRATADA permanecerá com uma cópia privada do código-fonte em ambiente interno seguro, exclusivamente para fins de futuras manutenções, restauração em caso de falha ou corrupção de arquivos, controle de qualidade e proteção de histórico técnico da obra criada.
9.4. PROTEÇÃO DE DADOS (LGPD): O tratamento e armazenamento da cópia de segurança e de eventuais dados estritamente necessários à execução deste contrato observarão boas práticas de sigilo e segurança da informação, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), limitados à execução contratual, suporte técnico e exercício regular de direitos.

CLÁUSULA 10ª — DA GARANTIA TÉCNICA PÓS-ENTREGA (30 DIAS)
10.1. A CONTRATADA concede garantia técnica gratuita pelo prazo de 30 (trinta) dias corridos, contados a partir da data de publicação oficial ou entrega definitiva do projeto.
10.2. Estão EXCLUSIVAMENTE cobertos pela garantia:
a) Correção de bugs visuais e falhas de responsividade em telas padrão;
b) Reparo de falhas funcionais no escopo entregue (botões, links, menus ou formulários contratados que deixem de operar corretamente);
c) Correção de erros pontuais de digitação cometidos durante a implementação;
d) Pequenos reparos no código-fonte original desenvolvido pela CONTRATADA.
10.3. NÃO estão cobertos pela garantia (sendo atendidos somente mediante taxa mínima de R$ 150,00 ou contratação de Plano de Manutenção Mensal):
a) Alterações de layout, design, reposicionamento de elementos, troca de cores ou fontes já aprovadas;
b) Substituição ou inclusão de fotografias, banners, vídeos, ícones ou logomarca;
c) Alteração de redação, reescrita de frases/parágrafos inteiros, mudança de preços, serviços ou inclusão de novos textos;
d) Criação de novas páginas, seções ou funcionalidades não contratadas.
10.4. PERDA DA GARANTIA: A garantia será automaticamente extinta caso a CONTRATANTE ou terceiros modifiquem o código-fonte, alterem configurações de hospedagem/DNS sem orientação da CONTRATADA ou instalem scripts externos que causem instabilidade ou falhas.

CLÁUSULA 11ª — DA SEGURANÇA DA INFORMAÇÃO E LIMITAÇÃO DE RESPONSABILIDADE
11.1. O projeto será desenvolvido segundo boas práticas de desenvolvimento web e publicado em provedores de infraestrutura reconhecidos no mercado, contando com as camadas nativas de segurança fornecidas pelo plano contratado — incluindo criptografia SSL/HTTPS, proteção básica contra acessos indevidos e mitigação automatizada de tráfego malicioso (como ataques DDoS básicos) oferecida pela própria plataforma de hospedagem, além da recomendação expressa de ativação de autenticação em dois fatores (2FA) nas contas administrativas da CONTRATANTE.
11.2. Considerando que nenhum ambiente conectado à internet é absolutamente inviolável, a CONTRATADA não se responsabiliza por indisponibilidades, invasões sofisticadas, ataques cibernéticos direcionados, falhas exclusivas dos provedores de hospedagem/domínio ou incidentes decorrentes de vazamento ou uso inadequado de senhas pela CONTRATANTE ou terceiros.
11.3. Em caso de incidente ou corrupção de arquivos após a entrega, a CONTRATADA poderá atuar na restauração da cópia de segurança (backup) mediante contratação de atendimento avulso ou dentro de plano de manutenção vigente.

CLÁUSULA 12ª — DA MANUTENÇÃO MENSAL (QUANDO CONTRATADA)
12.1. Caso a CONTRATANTE opte por aderir a um dos Planos de Manutenção Mensal da VibeTech|CMD (Básico: 1–2 atendimentos | Médio: 2–4 atendimentos | Avançado: até 10 atendimentos/mês), considera-se 1 (um) atendimento uma solicitação agrupada de ajustes simples de conteúdo/mídia com tempo operacional de 30 (trinta) a 45 (quarenta e cinco) minutos.
12.2. Demandas que excedam o tempo operacional de 45 (quarenta e cinco) minutos consumirão automaticamente um segundo atendimento (ou múltiplo proporcional) da cota mensal. Implementações de novas seções, comandos ou funcionalidades inéditas não compõem o plano de manutenção e serão orçadas em separado. Atendimentos não utilizados no mês não acumulam para meses subsequentes.

CLÁUSULA 13ª — DO CANCELAMENTO, RESCISÃO E ABANDONO DO PROJETO
13.1. Desistência pela CONTRATANTE: Em caso de cancelamento solicitado pela CONTRATANTE após o início dos trabalhos, a parcela de entrada não será reembolsada, por remunerar a reserva de agenda, o planejamento inicial e as horas técnicas já empenhadas, sendo devido eventual saldo proporcional ao estágio de desenvolvimento já alcançado.
13.2. Abandono do Projeto: Caso a CONTRATANTE permaneça por mais de 30 (trinta) dias corridos sem fornecer materiais obrigatórios, sem aprovar etapas ou sem responder às comunicações da CONTRATADA, o contrato poderá ser rescindido automaticamente por abandono, retendo-se os valores já pagos a título de remuneração pelo trabalho e disponibilidade reservados. A retomada posterior dependerá de novo orçamento.
13.3. Rescisão pela CONTRATADA: Caso a CONTRATADA necessite rescindir o contrato sem culpa da CONTRATANTE antes da entrega final, devolverá exclusivamente o valor proporcional à parcela do serviço ainda não executada ou entregará os arquivos correspondentes ao montante já quitado.

CLÁUSULA 14ª — DO FORO
14.1. Para dirimir quaisquer controvérsias oriundas do presente contrato, as partes elegem o Foro da Comarca de ${cityUf}, com renúncia expressa a qualquer outro, por mais privilegiado que seja.

E, por estarem assim justas e contratadas, as partes assinam o presente instrumento (física ou eletronicamente) na data abaixo indicada.

${cityUf}, ${today}.`;
  }

  return {
    CATALOG,
    ADDONS,
    MAINTENANCE_PLANS,
    KANBAN_STAGES,
    formatMoney,
    formatBRL,
    numberToWordsPt,
    computeInstallments,
    buildFullContractText
  };
})();
