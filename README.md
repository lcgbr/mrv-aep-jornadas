# MRV AEP — Jornadas

Site estático (LCG) com duas visões:

- **DE-PARA (XDM)** — mapeamento campo→XDM de cada jornada (fonte: `de_para_jornadas/*.md`).
- **WhatsApp (SFMC → AJO)** — comparativo do payload SFMC e do payload AJO mapeado, com toggle PRD/QAS.

Publicado no GitHub Pages: https://lcgbr.github.io/mrv-aep-jornadas/

## Estrutura

```
mrv-aep-jornadas/   ← GitHub Pages serve a raiz
├── index.html      shell LCG (Tailwind CDN + tokens lima)
├── styles.css      estilos da marca
├── app.js          lógica das 2 visões
├── data.js         GERADO por build_site.py — não editar à mão
├── .nojekyll
├── build_site.py   gerador de dados (dev local)
├── LICENSE
└── README.md
```

## Regerar os dados

`build_site.py` lê as fontes locais e reescreve `data.js`:
- de-para `de_para_jornadas/*.md`
- payloads WhatsApp (`whatsapp_payloads/`)
- eventos unitários AJO (`unitary_events_AJO_*.json`) → mapa `sourceEventType → nome do evento`

```bash
python build_site.py
```

As variáveis do payload AJO saem como **`@event{<NomeDoEvento>._mrv...}`** por jornada (resolvido pelo mapa). Jornadas **sem** evento unitário no AJO mantêm a variável SFMC original (`{{Event...}}`) e são sinalizadas com ⚠️ no site para revisão manual.

## Publicar no GitHub Pages

1. Faça commit/push destes arquivos para `lcgbr/mrv-aep-jornadas` (branch `main`).
2. **Settings → Pages → Source:** branch `main`, pasta `/ (root)`.
3. Acesse https://lcgbr.github.io/mrv-aep-jornadas/

Tudo é estático (Tailwind/fonts/ícones/logo via CDN). Caminhos são relativos (`./…`), compatíveis com o base path `/mrv-aep-jornadas/`.
