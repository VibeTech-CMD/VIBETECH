# VibeTech|CMD — Site Oficial

Site institucional e vitrine oficial da **VibeTech|CMD**, desenvolvido em HTML, CSS e JavaScript puros, 100% compatível com **GitHub Pages** sem necessidade de servidor ou etapa de build.

🌐 **Site publicado:** https://vibetech-cmd.github.io/VIBETECH/

## Estrutura do projeto

- `index.html` — Estrutura semântica, SEO completo (Open Graph, Twitter Card e JSON-LD) e seções oficiais.
- `preview.html` — Sala de Demonstração Interativa (modelo híbrido: prévia ao vivo em Desktop/Tablet/Celular + página de apresentação visual com opção de marca d’água suave).
- `styles/main.css` e `styles/preview.css` — Identidade visual dark futurista, responsividade, animações e sala de demonstração.
- `scripts/main.js` e `scripts/preview.js` — Navegação acessível, partículas otimizadas, vitrine dinâmica sincronizada com GitHub, controlador da sala de demonstração e mini-briefing interativo para WhatsApp.
- `assets/vibetech-logo.svg` — Símbolo oficial vetorial da VibeTech|CMD (também usado como favicon).
- `assets/vibetech-watermark.svg` — Padrão vetorial da marca d’água oficial aplicado nas prévias e vitrine.
- `assets/VibeTech-banner.png` — Imagem oficial de pré-visualização ao compartilhar o link no WhatsApp, LinkedIn e redes sociais.
- `robots.txt` e `sitemap.xml` — Arquivos de indexação para mecanismos de busca.

## Como atualizar contatos e configurações

Abra `scripts/main.js` e edite o bloco `CONFIG` no topo do arquivo:
- `whatsappNumber`: número comercial com DDI e DDD (atual: `5522999162793`).
- `email`: quando tiver o e-mail comercial definitivo, basta preencher nesse campo.
- `hiddenRepos`: lista de repositórios que não devem aparecer na vitrine dinâmica.
- `projectCatalog`: títulos comerciais, categorias e descrições exibidos na vitrine protegida.

## Publicação

O site é publicado automaticamente pelo **GitHub Pages** a partir da branch `main` (`/(root)`). Toda atualização enviada via `git push` entra no ar em poucos instantes.
