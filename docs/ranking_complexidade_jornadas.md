# Ranking de complexidade — jornadas analisadas (migração SFMC → AJO)

Consolidação das **17 jornadas** com spec de mapeamento gerada nesta rodada. Complexidade = dificuldade
de **tradução para o AJO** (não volume de conteúdo só), pesando: padrão de entrada, roteamento/decisão,
nº de mensagens, canais, engajamento/reação e **bloqueadores estruturais**.

## Ranking

| # | Jornada | BU | Entrada | Msgs | Roteamento | Nível | Driver / bloqueador |
|---|---|---|---|---|---|---|---|
| 1 | **PF - Visualizou propostas - EJ** | Cobrança Portal | Read Audience (batch) | 6 (2+SMS+3 controle) | 4 splits + engajamento | 🔴🔴 **Crítica** | **Join DE→DE (EXISTS) não expressável em Condition AJO** → precisa materializar `Portal_SAP_Integracao` no perfil. 12 erros de publicação. |
| 2 | **PF - Proposta sem confirmacao - EJ** | Cobrança Portal | Read Audience (batch) | 6 | 4 splits + engajamento | 🔴🔴 **Crítica** | Idem #1 (Status=`ESCOLHEU_PROPOSTA`) |
| 3 | **PF - Entrou no portal - EJ** | Cobrança Portal | Read Audience (batch) | 6 | 4 splits + engajamento | 🔴🔴 **Crítica** | Idem #1 (Status=`EXIBIU_PROPOSTAS`) |
| 4 | **JB_Wedo_Email** | Cobrança Portal | DCS (`dcsExternal`) | 12 e-mails | **router 12-vias** (`ID_Mensagem_Email`) | 🔴 **Alta** | Publicável direto (condição no evento), mas **blocos C#** (`installmentDetailsBlock`/`contractDebtBlock`) + 12 assets + assunto AMPscript |
| 5 | **Jornada Síndico** | Assist. Técnica | FTP | 11 (8 tópicos) | 3 engajamento (reação) | 🔴 **Alta** | Reação (abriu?) + reenvios + sequência longa; 8 assets |
| 6 | **Jornada Whats - Auto-agendamento EC** | Assist. Técnica | FTP | 9 (6 WA + 3 email) | **router 6-vias** (`Momento`) | 🔴 **Alta** | Multicanal + 6 templates WhatsApp |
| 7 | **Jornada VA 03 - Revistoria** | Assist. Técnica | **API Event** | 1 WA (+ botão) | — | 🟡 **Média** | **Novo padrão de entrada** (API→AEP) + evento `Vistoria_Antecipada` novo + 3 leaves novos no schema |
| 8 | **Jornada WhatsApp Agendamento VA** | Assist. Técnica | FTP | 2 WA | router 2-vias (`Marca`) | 🟡 **Média** | Split MRV×Sensia sobre evento — publicável direto |
| 9 | **Jornada e-mail Agendamento VA** | Assist. Técnica | FTP | 2 e-mails | router 2-vias (`status_unidade`) | 🟡 **Média** | Split sobre evento — publicável direto |
| 10 | **Cobranca - Wedo - SMS** | Cobrança Portal | DCS (`dcsExternal`) | 1 SMS | — | 🟢 **Baixa** | Texto pronto no campo `Mensagem` → `@event{…messageBody}` |
| 11 | **Jornada de E-mail - Comunicado Renegociação** | Cobrança Portal | FTP | 1 e-mail | — | 🟢 **Baixa** | E-mail estático (sem variável) |
| 12 | **Whats - Agendamento Entrega Chaves** | Assist. Técnica | FTP | 1 WA (+ botão) | — | 🟢 **Baixa** | 1 template + botão |
| 13 | **Jornada WhatsApp VA Indisponível** | Assist. Técnica | FTP | 1 WA (+ botão) | — | 🟢 **Baixa** | 1 template + botão |
| 14 | **Jornada WhatsApp VA Não Aptos** | Assist. Técnica | FTP | 1 WA | — | 🟢 **Baixa** | 1 template |
| 15 | **Whats - Assembleia** | Assist. Técnica | FTP | 1 WA | — | 🟢 **Baixa** | 1 template |
| 16 | **Jornada WhatsApp Pesquisa Implantação - Chave** | Assist. Técnica | FTP | 1 WA | — | 🟢 **Baixa** | 1 template |
| 17 | **Jornada WhatsApp Pesquisa Implantação - Chave Pesquisa** | Assist. Técnica | FTP | 1 WA | — | 🟢 **Baixa** | 1 template |

## Leitura por padrão de entrada
- **Read Audience (batch)** — 3 jornadas (`PF - *`): as **mais complexas**. O gargalo NÃO é volume, é
  estrutural: os decision splits fazem **join a outra DE (semântica EXISTS)** e usam atributos efêmeros,
  que a Condition do AJO não resolve → exigem materializar a integração no perfil (relationship/computed)
  ANTES de publicar. Todas as 3 têm estrutura idêntica.
- **FTP / DCS com router sobre campo do evento** — JB_Wedo_Email, Auto EC, Agendamento VA, e-mail Agend VA:
  **publicáveis direto** (Condition sobre `@event{}`), sem bloqueador de lógica. Complexidade = volume de
  conteúdo/assets, não tradução.
- **Engajamento (reação)** — Síndico e Auto EC têm nós de "abriu e-mail?" → viram **Reaction** no AJO
  (construto próprio, não Optimize de atributo).
- **API Event** — VA 03 Revistoria: complexidade vem do **novo caminho de ingestão** (API→AEP) e do evento
  novo, não da lógica da mensagem.
- **1 mensagem** — 8 jornadas 🟢: trabalho quase só de wiring + migração do 1 asset.

## Onde está o esforço real
1. **Desbloquear as 3 `PF - *`** (materializar `Portal_SAP_Integracao` no perfil) — pré-requisito de plataforma.
2. **Blocos C# do Wedo** (`installmentDetailsBlock`/`contractDebtBlock`) — pendência de ingestão.
3. **Migração de conteúdo** dos routers grandes (12 assets Wedo, 8 Síndico, 6 templates Auto EC).
4. O restante (10 jornadas 🟡/🟢) é rápido — publicável direto.

---
_Análises mais leves (sem spec dedicada): `Wpp - Renegociação`/`reneg_expirado_prd` (ajuste de payload) e
`Whats - Antecipação`/`reneg_antecipar_13_prd` (conferência de templateName)._
