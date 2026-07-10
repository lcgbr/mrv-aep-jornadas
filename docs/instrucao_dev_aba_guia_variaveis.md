# Instrução de desenvolvimento — Nova aba **"Guia de Variáveis"** no `mrv-aep-jornadas`

> Solicitação: adicionar uma **terceira aba** ao site MRV AEP Jornadas que renderiza em HTML as
> **instruções de mapeamento das jornadas complexas** (specs SFMC→AJO), mostrando **todas as fórmulas
> AJO necessárias e como usá-las**, com **busca por nome da jornada, nome de atividade ou variável**.
> **Sem alterar nenhuma funcionalidade existente** (DE-PARA, WhatsApp/Infobip, PRD/QAS, testes de CA).

---

## 1. Fontes de dados (onde estão os arquivos de instrução)

Diretório: **`D:\Projetos\clientes\MRV\AJO\mrv-sfmc-ajo-migration\`**

Padrão de nome: `instrucao_mapeamento_{padrao}_{slug}.md` — **1 arquivo por jornada** (o build deve usar
glob, para specs futuras entrarem automaticamente).

| Arquivo | Jornada | Padrão de entrada | Evento AJO |
|---|---|---|---|
| `instrucao_mapeamento_readaudience_entrou_portal.md` | PF - Entrou no portal - EJ | Read Audience | — (segmento) |
| `instrucao_mapeamento_readaudience_proposta_sem_confirmacao.md` | PF - Proposta sem confirmacao - EJ | Read Audience | — (segmento) |
| `instrucao_mapeamento_readaudience_visualizou_propostas.md` | PF - Visualizou propostas - EJ | Read Audience | — (segmento) |
| `instrucao_mapeamento_api_vistoria_antecipada.md` | Jornada VA 03 - Revistoria | API Event | `Vistoria_Antecipada` |
| `instrucao_mapeamento_dcs_cobranca_wedo_sms.md` | Cobranca - Wedo - SMS | DCS | `MRV_FTP_Cobranca_Wedo` |
| `instrucao_mapeamento_ftp_jb_wedo_email.md` | JB_Wedo_Email | DCS* | `MRV_FTP_JB_Wedo_Email` |
| `instrucao_mapeamento_ftp_comunicado_renegociacao.md` | Jornada de E-mail - Comunicado Renegociação | FTP | `MRV_FTP_Comunic_Reneg` |
| `instrucao_mapeamento_ftp_email_agendamento_va.md` | Jornada e-mail Agendamento VA | FTP | `MRV_FTP_Email_Agend_VA` |
| `instrucao_mapeamento_ftp_email_sindico.md` | Jornada Síndico | FTP | `MRV_FTP_Jor_Sindico` |
| `instrucao_mapeamento_ftp_wa_agendamento_va.md` | Jornada WhatsApp Agendamento VA | FTP | `MRV_FTP_Agendamento_VA` |
| `instrucao_mapeamento_ftp_wa_auto_agendamento_ec.md` | Jornada Whats - Auto-agendamento EC | FTP | `MRV_FTP_Auto_Agend` |
| `instrucao_mapeamento_ftp_wa_agendamento_entrega_chaves.md` | Whats - Agendamento Entrega Chaves | FTP | `MRV_FTP_Agend_Entreg_Chaves` |
| `instrucao_mapeamento_ftp_wa_va_indisponivel.md` | Jornada WhatsApp VA Indisponível | FTP | `MRV_FTP_Whats_VA_Indisponivel` |
| `instrucao_mapeamento_ftp_wa_va_nao_aptos.md` | Jornada WhatsApp VA Não Aptos | FTP | `MRV_FTP_VA_Nao_Aptos` |
| `instrucao_mapeamento_ftp_wa_assembleia.md` | Whats - Assembleia | FTP | `MRV_FTP_Assembleia` |
| `instrucao_mapeamento_ftp_wa_pesquisa_implantacao_chave.md` | Jornada WhatsApp Pesquisa Implantação - Chave | FTP | `MRV_FTP_Pesquisa_Imp_Chave` |
| `instrucao_mapeamento_ftp_wa_pesquisa_implantacao_chave_pesquisa.md` | … - Chave Pesquisa | FTP | `MRV_FTP_Pesq_Implant` |
| `ranking_complexidade_jornadas.md` | *(não é jornada)* | — | fonte do **badge de complexidade** |

\* O arquivo do JB_Wedo_Email tem prefixo `ftp_` mas o eventType correto é `dcsExternal` (nota de correção
dentro do próprio arquivo e na spec do Wedo SMS) — o parser deve usar o campo "Entrada" da tabela de
identificação, não o nome do arquivo.

**Excluir do escopo:** `instrucao_mapeamento_csharp.md` (instrução global de C#/ingestão, 78 jornadas — não
é spec por jornada; pode virar link de referência estático no rodapé da aba).

### Estrutura interna comum dos arquivos (contrato do parser)
Todos seguem o mesmo esqueleto markdown (subset restrito — sem HTML embutido):
1. `# Instrução de mapeamento — "NOME DA JORNADA" · AJO **PADRÃO** (…)` — título com nome + padrão.
2. Blockquote `>` inicial — resumo/contexto.
3. `## Identificação` — **tabela chave-valor** (Jornada SFMC + id, Entrada, sourceEventType/eventType, Evento AJO, Template(s), Identidade…).
4. Seções `##` variáveis por jornada: fluxo (com blocos de código ```), tabelas de router/splits, `## Fluxo AJO equivalente` (bloco de código com as fórmulas), `## De-para (CSV → XDM)` (tabela), `## Payload WhatsApp (Orquestrador)` (bloco JSON, quando WhatsApp), `## Pendências` (checklist `- [ ]`).
5. Elementos md usados: h1/h2, tabelas `|…|`, fenced code blocks, listas, blockquote, **bold**, `inline code`.

---

## 2. Arquitetura atual do site (fatos verificados — NÃO alterar)

Repo local: `D:\Projetos\clientes\MRV\AEP\mrv-aep-jornadas\` (público em `lcgbr/mrv-aep-jornadas`, GitHub Pages).
Espelho extensão: `D:\Projetos\clientes\MRV\AEP\mrv-aep-jornadas-ext\` (MV3 side panel).

- **Dados**: `build_site.py` gera `data.js` com 4 globais — `window.DEPARA_DATA`, `window.WPP_DATA`,
  `window.INFOBIP_DATA`, `window.SITE_CONFIG` (`build_site.py:670-673`, emissão no `main()` `:647`).
- **Abas**: 2 botões no `index.html:50-53` (`#tab-depara`, `#tab-whatsapp`) chamando `setView('depara'|'whatsapp')`.
  Estado em `currentView` (`app.js:16`); `setView()` (`app.js:480`) atualiza tabs (`updateViewTabs`
  `app.js:501` — **hardcoded para 2 abas**), label (`#view-label`), esconde/mostra `#env-toggle` (PRD/QAS,
  só WhatsApp), limpa `#searchInput`, chama `buildSidebar('')` + `resetMain()`.
- **Sidebar/busca**: `buildSidebar(term)` (`app.js:239`) ramifica por `currentView`; busca por tokens AND
  via `matchesQuery(haystack, q)` (`app.js:232`) — todos os termos devem aparecer no haystack.
- **Extensão** (diferenças obrigatórias, verificadas):
  - CSP `script-src 'self'` → **sem `onclick` inline**; navegação por `data-action="view" data-arg="…"`
    (ext `index.html:26-27`) com delegation central em `wireEvents()` (ext `app.js:676-700`). O
    `case 'view'` roteia **qualquer** `data-arg` → o novo botão **não precisa de novo case** no switch;
    só do branch nas funções de view.
  - **Layout master-detail** (≠ site, que é sidebar+main lado a lado): `#list-view` OU `#detail-view`
    (ext `index.html:80-95`, `showListView()`/`showDetailView()` ext `app.js:594-603`). A nova função de
    render da extensão deve chamar `showDetailView()` ao selecionar (como `selectDePara` ext `app.js:465`)
    e o botão "voltar" (`data-action="back"`) já retorna à lista.
  - Tailwind **vendorizado** (`vendor/tailwind.css`): os globs do `build/tailwind.config.js:3-6` já
    escaneiam `extension/index.html` + `extension/app.js` → **basta rodar `npm run build:css`** após a
    mudança (sem alterar config); no site o CDN JIT resolve sozinho.
  - `#env-toggle`/painel QAS já são gated em `currentView === 'whatsapp'` (`app.js:485-486`, `:541-542`)
    → ficam ocultos automaticamente na nova view, **nada a mudar** neles. O `#view-label` é um ternário
    (`app.js:483`) — estender nas duas metades.

---

## 3. O que construir

### 3.1 `build_site.py` — parser + novo global `window.GUIDE_DATA`
1. Nova constante `GUIDE_DIR = Path(r"d:\Projetos\clientes\MRV\AJO\mrv-sfmc-ajo-migration")`.
2. Nova função `build_guide(guide_dir)` que faz glob de `instrucao_mapeamento_*.md` (**excluindo**
   `instrucao_mapeamento_csharp.md`) e, para cada arquivo, produz:
   ```json
   {
     "id": "slug-do-arquivo",
     "file": "instrucao_mapeamento_….md",
     "title": "PF - Entrou no portal - EJ",        // extraído do H1 (entre aspas)
     "pattern": "Read Audience|FTP|API Event|DCS",  // do H1/tabela Identificação
     "bu": "…", "ajoEvent": "…", "sourceEventType": "…",  // da tabela Identificação
     "complexity": "critica|alta|media|baixa",      // casado por nome no ranking_complexidade_jornadas.md
     "formulas": [                                   // TODAS as fórmulas p/ copiar
       { "expr": "@event{MRV_FTP_X._mrv.identityEvents.phone}", "context": "userNumber do payload WhatsApp" },
       { "expr": "concat([…])", "context": "jsonValue do Custom Action" }
     ],
     "activities": ["EMAILV2-1", "SMSSYNC-2", "MULTICRITERIADECISIONV2-1", "REST-1",
                     "chaves_momento_prd", "Entrou portal - Email 1 EJ", "…"],
     "variables": ["Telefone", "CPF", "Marca", "_mrv.identityEvents.phone", "…"],
     "searchIndex": "string única concatenando title+activities+variables+formulas+bu+evento",
     "sectionsHtml": "<h2>…</h2><table>…</table>…"   // md → HTML no BUILD (Python), não no browser
   }
   ```
   Extração:
   - **Fórmulas**: regex `@event\{[^}]+\}`, `concat\(\[`, blocos de código com `@event`/`concat`/expressões
     de condição; o `context` vem da linha/célula/section onde a fórmula aparece.
   - **Atividades**: regex `(EMAILV2|SMSSYNC|REST|WAITBYDURATION|MULTICRITERIADECISION\w*|ENGAGEMENTSPLIT\w*)-\d+`
     \+ templates (`[a-z0-9_]+_prd|_qas`) + nomes entre aspas nas tabelas de mensagens.
   - **Variáveis**: 1ª coluna das tabelas `De-para`/`Mapeamento` (coluna CSV) + paths `_mrv\.[\w.]+` +
     `person\.[\w.]+`.
   - **md→HTML**: conversor Python próprio para o subset (h2, tabela, code fence, lista, checklist,
     blockquote, bold/inline-code). **Sem lib externa nova; sem parse de md no browser.** Escapar HTML
     do conteúdo antes de aplicar as marcas.
3. Emitir no `main()` (junto dos outros): `window.GUIDE_DATA = {…};` — **não tocar** nos 4 globais existentes.
4. Se `GUIDE_DIR` não existir no ambiente do build → emitir `GUIDE_DATA = []` com warning (o site continua
   funcionando; a aba mostra vazio). Encoding UTF-8 em toda leitura.

### 3.2 `index.html` — terceiro botão de aba
- Site: `<button id="tab-guia" onclick="setView('guia')">… Guia de Variáveis</button>` ao lado dos 2 atuais
  (`index.html:50-53`), mesmo estilo.
- Extensão: `<button id="tab-guia" data-action="view" data-arg="guia">` (padrão delegation da ext).

### 3.3 `app.js` — nova view `'guia'` (aditiva, zero mudança nas outras)
- `currentView` aceita `'guia'`; `updateViewTabs()` ganha a 3ª entrada; `setView()` ganha o label
  ("Guia de Variáveis") e **mantém `#env-toggle` escondido** nessa view.
- `buildSidebar()`: novo ramo `currentView === 'guia'` — lista `GUIDE_DATA` agrupado por BU, item =
  título da jornada + badge de complexidade (🔴🔴/🔴/🟡/🟢) + subtítulo com o padrão de entrada.
  **Busca**: `matchesQuery(j.searchIndex, q)` → cobre **nome da jornada, atividades e variáveis** com a
  mesma UX de tokens da busca atual. Bônus: no item, mostrar *por que* casou (ex.: "casa em: EMAILV2-3,
  Telefone") quando o match não for no título.
- `renderGuide(id)` no `#main-content`:
  1. **Header**: título, BU, padrão de entrada (chip), evento AJO (chip `@event{…}` clicável p/ copiar),
     badge de complexidade, link "abrir .md original" (nome do arquivo).
  2. **Bloco "Fórmulas para usar no AJO"** (o coração da aba): um card por fórmula com a expressão em
     `<code>`, o contexto de uso e **botão copiar** (reusar `copyToClipboard` existente). Ex.:
     `@event{MRV_FTP_Agendamento_VA._mrv.identityEvents.phone}` → "userNumber do payload WhatsApp".
  3. **Guia fixo "Como usar no AJO"** (colapsável, igual p/ todas as jornadas): sintaxe `@event{<Evento>.<path>}`
     (+ `defaultValue: ""` em concat), `{{profile.<path>}}` p/ atributos de perfil, `concat([listString])`
     no `jsonValue` do Custom Action (cada `@event` = entrada sem aspas), Condition (campo do evento) vs
     **Reaction** (abriu e-mail) vs limitação de join/EXISTS (Read Audience — ver spec).
  4. **Corpo**: `sectionsHtml` renderizado (fluxos, tabelas de router, de-para, pendências) com estilos
     do site (tabelas zebra, code em bloco escuro — reusar classes existentes tipo `json-viewer`).
  5. Termo buscado **destacado** (`<mark>`) no corpo ao chegar via busca.
- Delegation: botões de copiar via `data-action` (padrão já existente `app.js:495+`) — funciona nos dois alvos.

### 3.4 Extensão (metade B — obrigatória, regra do projeto)
Replicar `index.html` + `app.js` + `build/build_site.py` (os dois `build_site.py` são idênticos exceto
`OUT_DATA` na linha 369 — manter assim), adaptando: botão com `data-action="view" data-arg="guia"`
(sem novo case no delegation), render chamando `showDetailView()` (layout master-detail). Depois rodar
`python build/build_site.py` + **`npm run build:css`** (capta as classes novas automaticamente), bump de
versão no `manifest.json` e reempacotar o zip. Publicação = commit+push do site em `main` (**GitHub
Pages**). Usar o pipeline **`/deploy-jornadas`** que já automatiza as duas metades.

---

## 4. Requisitos de busca (aceite)
Digitar no `#searchInput` (na aba Guia) deve encontrar a jornada por QUALQUER um:
- **Nome da jornada**: "entrou no portal", "sindico", "wedo" …
- **Nome de atividade/nó/template**: "EMAILV2-3", "SMSSYNC-2", "MULTICRITERIADECISIONV2-1",
  "chaves_momento_prd", "Entrou portal - Email 1" …
- **Variável**: "Telefone", "Marca", "status_unidade", "ID_Mensagem_Email",
  "_mrv.identityEvents.phone", "messageBody" …
Tokens combinam em AND (padrão atual): "sindico telhado" → Jornada Síndico.

## 5. Restrições
- **Não alterar** o comportamento das views `depara`/`whatsapp` (funções `selectDePara`, `selectWpp`,
  `renderInfobip`, toggle PRD/QAS, overrides QAS, test-ca) — mudanças só **aditivas** (`setView`,
  `updateViewTabs`, `buildSidebar` ganham o 3º ramo).
- **Repo público**: as specs não contêm segredos (verificado), mas o parser não deve importar nada fora de
  `instrucao_mapeamento_*.md` + `ranking_complexidade_jornadas.md`. Nunca incluir arquivos de `NEW_RAW/`
  ou payloads com credenciais.
- **Sem libs novas** (CSP da extensão): nada de CDN de markdown; conversão md→HTML acontece no build Python.
- data.js hoje tem ~272 KB; estimar +100–150 KB com o guia — aceitável, mas manter `sectionsHtml` enxuto
  (sem estilos inline repetidos; usar classes).

## 6. Critérios de aceite
- [ ] Aba "Guia de Variáveis" visível ao lado de DE-PARA e WhatsApp, nas **duas metades** (site + extensão).
- [ ] 17 jornadas listadas, agrupadas por BU, com badge de complexidade do ranking.
- [ ] Busca funciona pelos 3 eixos (jornada/atividade/variável) — casos de teste da seção 4.
- [ ] Cada jornada mostra o bloco de fórmulas com botão copiar (e a fórmula copiada é colável no AJO sem edição).
- [ ] Guia fixo "Como usar no AJO" presente e colapsável.
- [ ] Views DE-PARA e WhatsApp intactas (regressão zero: seleção, PRD/QAS, copiar concat/JSON, Infobip, test-ca).
- [ ] Novo arquivo `instrucao_mapeamento_*.md` criado no diretório → aparece na aba após rebuild, sem código novo.
- [ ] Deploy: rebuild dos 2 `data.js` + `build:css` da ext + zip versionado + commit/push do site (via `/deploy-jornadas`).
