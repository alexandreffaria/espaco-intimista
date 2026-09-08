# Intimista

Site de uma página só, em arquivos estáticos: sem framework, sem dependências.
Tudo se escreve em `src/`; o `build.mjs` costura aquilo em `dist/`, que é o
site como o servidor o vê. `dist/` não vai para o Git e não se edita.

## Como mexer

```sh
npm run dev     # monta, refaz a cada save e serve em http://localhost:4321
npm run build   # só monta, em dist/
```

## Onde está cada coisa

```
src/
  index.html            <head>, o esqueleto da página e a ordem das seções
  sections/             uma seção da home por arquivo, na ordem em que aparecem
    header.html         cabeçalho fixo e menu
    hero.html           o painel iluminado, a primeira tela
    reveal-shot.html    a foto que abre a porta
    espaco.html         o manifesto
    ambientes.html      os três ambientes e suas fichas
    formatos.html       os formatos de encontro
    um-dia.html         "um dia aqui" — o casco da seção
    um-dia-cenas.html     as cinco cenas (08h → 19h)
    um-dia-sol.html       o arco e o sol
    um-dia-horas.html     os botões das horas
    passeio.html        o vídeo no celular
    reserva.html        os convites para agendar
    contato.html        mapa, endereço e redes
    footer.html         rodapé
  styles/
    index.css           a ordem da cascata — a lista que vira css/site.css
    tokens.css          paleta, tipos e ritmos
    base.css            reset, foco, preferência de movimento
    layout.css          .wrap e .band
    …                   um arquivo por seção, com o mesmo nome do partial
  scripts/
    main.js             liga os módulos abaixo
    header.js           o cabeçalho fica sólido depois da hero
    menu.js             a gaveta do menu no celular
    reveal.js           o fade-up de quem entra na tela
    walkthrough.js      o vídeo que só baixa quando aparece
    um-dia.js           o sol atravessando as horas

media/  font/  favicon.svg      as fotos, o vídeo e a fonte da marca
build.mjs                       costura src/ + os assets acima em dist/
```

Regras do jogo:

- **Nova seção?** crie `src/sections/nome.html` e `src/styles/nome.css`, some
  o `<!-- include: sections/nome.html -->` em `src/index.html` e o
  `@import 'nome.css';` em `src/styles/index.css`.
- **Um `<!-- include: … -->`** é substituído pelo arquivo, na mesma indentação.
  Funciona em qualquer nível (as cenas do "um dia aqui" fazem isso).
- **`src/styles/index.css` é a cascata.** A ordem da lista é a ordem do CSS.
- **Os scripts saem como estão**, um módulo ES por comportamento.
- **Para ver o site use `npm run dev`.** Abrir `dist/index.html` direto do
  disco (`file://`) não carrega os módulos de JS.

## Publicação

Todo push na `main` roda o build no GitHub Actions e envia **só o `dist/`** por
FTPS (`.github/workflows/deploy.yml`).
