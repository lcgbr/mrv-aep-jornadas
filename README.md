# MRV AEP — Jornadas

Site estático (LCG) com duas visões:

- **DE-PARA (XDM)** — mapeamento campo→XDM de cada jornada (fonte: `de_para_jornadas/*.md`).
- **WhatsApp (SFMC → AJO)** — comparativo do payload SFMC e do payload AJO mapeado, com toggle PRD/QAS.

Publicado no GitHub Pages: https://lcgbr.github.io/mrv-aep-jornadas/

## Estrutura

```
mrv-aep-jornadas/
├── docs/                ← GitHub Pages serve esta pasta
│   ├── index.html       shell LCG (Tailwind CDN + tokens lima)
│   ├── styles.css       estilos da marca
│   ├── app.js           lógica das 2 visões
│   ├── data.js          GERADO por build_site.py — não editar à mão
│   └── .nojekyll
├── build_site.py        gerador de dados (dev local)
└── README.md
```

## Regerar os dados

`build_site.py` lê as fontes locais (de-para `.md` + payloads WhatsApp) e reescreve `docs/data.js`.

```bash
python build_site.py
```

> Antes, preencha **`AJO_EVENT_PREFIX`** no topo de `build_site.py` (enquanto contiver `__PREENCHER__`, o site exibe um aviso). A variável final fica `{{<AJO_EVENT_PREFIX><pathXDM>}}`.

## Publicar no GitHub Pages

1. Crie o repositório `mrv-aep-jornadas` na org `lcgbr`.
2. Faça commit destes arquivos (incluindo `docs/`).
3. **Settings → Pages → Source:** branch `main`, pasta `/docs`.
4. Acesse https://lcgbr.github.io/mrv-aep-jornadas/

Tudo é estático (Tailwind/fonts/ícones/logo via CDN). Caminhos são relativos (`./…`), compatíveis com o base path `/mrv-aep-jornadas/`.
