# Vibetech — site institucional

Landing page estática em HTML, CSS e JavaScript, pronta para GitHub Pages.

## Arquivos
- `index.html`: site completo. Não precisa instalar dependências nem compilar.

## Antes de publicar
1. Abra `index.html` e localize `https://wa.me/5500000000000`.
2. Troque `5500000000000` pelo número comercial real, com código do país e DDD, somente números.
3. Localize `contato@seudominio.com` e substitua pelo e-mail real.
4. Confira o texto dos serviços e ajuste para refletir exatamente o que a Vibetech oferece.

## Publicar pelo celular no GitHub
1. Entre em https://github.com e abra seu repositório (ou crie um novo).
2. Na página principal do repositório, toque em **Add file** → **Create new file**.
3. No nome do arquivo, digite exatamente `index.html` (na raiz, sem pasta antes).
4. Cole todo o conteúdo do arquivo `index.html` e toque em **Commit changes**.
5. Abra **Settings** → **Pages**.
6. Em **Build and deployment**, selecione **Deploy from a branch**.
7. Em **Branch**, escolha `main` e pasta `/(root)`; toque em **Save**.
8. Aguarde a publicação. Volte a **Settings → Pages** para ver o endereço do site.

## Se o site já está em um repositório
- Se já houver um `index.html` na raiz, edite/substitua esse arquivo em vez de criar outro.
- O arquivo precisa se chamar `index.html`, com letras minúsculas.
- Não coloque o `index.html` dentro de uma pasta como `site/` se o Pages estiver configurado para `/(root)`.

## Checklist de teste
- Abra o endereço publicado em uma janela anônima.
- Teste no celular e no computador, se possível.
- Toque nos links do menu e nos botões de contato.
- Confirme que WhatsApp e e-mail apontam para seus contatos reais.
- Se não atualizar, aguarde alguns minutos e recarregue a página; confira se o Pages usa `main` e `/(root)`.

## Observações
Este projeto é estático e não precisa de Node.js, npm ou build. O formulário de contato não foi incluído porque um site estático, sozinho, não envia formulários para um servidor. Os botões de contato usam links externos.
