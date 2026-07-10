# Ranking de complexidade — jornadas analisadas (migração SFMC → AJO)

Consolidação das **40 jornadas** com spec de mapeamento gerada. Complexidade = dificuldade de **tradução
para o AJO** (não volume de conteúdo só), pesando: padrão de entrada, roteamento/decisão, nº de mensagens,
canais, engajamento/reação e **bloqueadores estruturais**.

## Ranking

| # | Jornada | BU | Entrada | Msgs | Roteamento | Nível | Driver / bloqueador |
|---|---|---|---|---|---|---|---|
| 1 | **PF - Visualizou propostas - EJ** | Cobrança Portal | Read Audience (batch) | 6 (2+SMS+3 controle) | 4 splits + engajamento | 🔴🔴 **Crítica** | **Join DE→DE (EXISTS) não expressável em Condition AJO** → materializar `Portal_SAP_Integracao` no perfil. 12 erros de publicação. |
| 2 | **PF - Proposta sem confirmacao - EJ** | Cobrança Portal | Read Audience (batch) | 6 | 4 splits + engajamento | 🔴🔴 **Crítica** | Idem #1 (Status=`ESCOLHEU_PROPOSTA`) |
| 3 | **PF - Entrou no portal - EJ** | Cobrança Portal | Read Audience (batch) | 6 | 4 splits + engajamento | 🔴🔴 **Crítica** | Idem #1 (Status=`EXIBIU_PROPOSTAS`) |
| 4 | **JB_Wedo_Email** | Cobrança Portal | DCS (`dcsExternal`) | 12 e-mails | **router 12-vias** (`ID_Mensagem_Email`) | 🔴 **Alta** | Publicável direto, mas **blocos C#** (`installmentDetailsBlock`/`contractDebtBlock`) + 12 assets + assunto AMPscript |
| 5 | **Jornada Síndico** | Assist. Técnica | FTP | 11 (8 tópicos) | 3 engajamento (reação) | 🔴 **Alta** | Reação (abriu?) + reenvios + sequência longa; 8 assets |
| 6 | **Jornada Whats - Auto-agendamento EC** | Assist. Técnica | FTP | 9 (6 WA + 3 email) | **router 6-vias** (`Momento`) | 🔴 **Alta** | Multicanal + 6 templates WhatsApp |
| 7 | **Jornada VA 01 - Liberação do Bloco + Agendamento** | Assist. Técnica | **API Event** | 3 e-mails + 3 WA | router 3-vias + 9 splits de status | 🔴 **Alta** | **8 dos 10 splits fazem lookup vivo na DE externa `Controle_Status_VA`** — sem equivalente no AJO. Evento **A CRIAR** |
| 8 | **AT - Reagendamento pelo cliente ou backoffice** | Assist. Técnica | **API Event** | 3 e-mails + 1 SMS | 7 splits (supersede + lookup 2 DEs) | 🔴 **Alta** | **Supersede** compara evento com estado vivo em 2 DEs + wait-by-attribute. Envelope C# real (`portalClienteReagendamento`), evento **A CRIAR** |
| 9 | **Boas vindas - Nova Jornada Sensia_FTP** | Sensia | FTP | 22 e-mails (13 assets) + 1 WA | gate `Empreendimento` + 8 splits | 🔴 **Alta** | Roteamento por `Tipo_Contrato` e `Empreendimento` — **ambos SEM DESTINO no schema** (leaves 🆕 + mapper C#) |
| 10 | **Assinatura de Contrato (Gestão Vendas H)** | Gestão Vendas H | **DCS** (Salesforce trigger) | 3 e-mails | 2 splits "Assinou contrato?" (re-consulta Salesforce) | 🔴 **Alta** | Decisões re-consultam o Salesforce ao vivo (`UltimoBoleto__c IS NULL`), dado ausente do payload → atributo de Profile por feed. Evento **A CRIAR** |
| 11 | **Jrn pag arm - Pagamento nao processado** | Marketplace | Read Audience (batch) | 4 e-mails + 2 SMS | router 1-via (`StatusPagamento__c=PAID`) + 2 Reactions + 2ª trilha | 🔴 **Alta** | Fluxo denso + re-teste de status que abre 2ª trilha; sem de-para/mapper/evento (tudo **A CRIAR**); materializar status de cartão do Salesforce |
| 12 | **Jornada VA 03 - Revistoria** | Assist. Técnica | **API Event** | 1 WA (+ botão) | — | 🟡 **Média** | **Novo padrão de entrada** (API→AEP) + evento `Vistoria_Antecipada` novo + 3 leaves novos |
| 13 | **Jornada WhatsApp Agendamento VA** | Assist. Técnica | FTP | 2 WA | router 2-vias (`Marca`) | 🟡 **Média** | Split MRV×Sensia sobre evento — publicável direto |
| 14 | **Jornada e-mail Agendamento VA** | Assist. Técnica | FTP | 2 e-mails | router 2-vias (`status_unidade`) | 🟡 **Média** | Split sobre evento — publicável direto |
| 15 | **JB_Wedo_Email (Sensia)** | Sensia | DCS (`dcsExternal`) | 7 e-mails | **router 7-vias** (`ID_Mensagem_Email` 56–62) | 🟡 **Média** | Publicável direto; campo `Residencial` sem destino (🆕); dormente desde dez/2023 |
| 16 | **Regua Transacional Armarios OPPORTUNITY** | Marketplace | Read Audience (batch) | 4 e-mails + 2 SMS | router 3-vias (`StageName`) + 2 reações + STO | 🟡 **Média** | **Materializar a Opportunity Salesforce no AEP** (3 regras SQL D-1) + CPF fora da DE. Sem evento (**A CRIAR**) |
| 17 | **Regua_Transacional_KIT_OPPORTUNITY** | Marketplace | Read Audience (batch) | 6 e-mails + 2 SMS | 2 routers + 3 engajamento | 🟡 **Média** | Idem Armários + wait por atributo (`CreatedDate+5d`). **A CRIAR** |
| 18 | **JB_Renegociacao (Marketplace)** | Marketplace | **API Event** | 2 e-mails | 4 splits de elegibilidade + engajamento | 🟡 **Média** | CDC Salesforce via query 15-min → **evento unitário A CRIAR** + 4 leaves 🆕 + CPF fora da DE |
| 19 | **Implantação cond. Jornada (Copy)** | Sensia | FTP | 6 e-mails | — (4 waits por atributo) | 🟡 **Média** | Mapper C# (4 col) **diverge do de-para** (18 col) a reconciliar |
| 20 | **Jornada Implantação Condominio** | Assist. Técnica | FTP | 6 e-mails + 1 SMS | — (linear; 4 waits por atributo + 4 por duração) | 🟡 **Média** | Régua multicanal longa; esforço nos 7 assets e waits dinâmicos, não em decisão |
| 21 | **Jornada VA 04 - Bloqueio ou Cancelamento de VA** | Assist. Técnica | **API Event** | 10 e-mails (4 criativos) | 5 splits (routers Motivo 6+4 vias) | 🟡 **Média** | Roteamento largo por motivo, mas **todas as decisões leem o próprio evento** (sem lookup externo). Evento **A CRIAR** |
| 22 | **Disparo relancamento - wpp** | Marketplace | FTP | 1 WA | — | 🟡 **Média** | `Empreendimento` (`{{1}}`) sem destino no evento/mapper → criar leaf ou decisioning |
| 23 | **Jrn pag arm - Pre processamento cartao** | Marketplace | Read Audience (batch) | 2 e-mails + 1 SMS | — (linear; 2 STO + 1 Reação) | 🟡 **Média** | Entrada Read Audience exige materializar a DE do Salesforce; evento/sourceEventType/de-para **A CRIAR** |
| 24 | **Cobranca - Wedo - SMS** | Cobrança Portal | DCS (`dcsExternal`) | 1 SMS | — | 🟢 **Baixa** | Texto pronto no campo `Mensagem` → `@event{…messageBody}` |
| 25 | **Jornada de E-mail - Comunicado Renegociação** | Cobrança Portal | FTP | 1 e-mail | — | 🟢 **Baixa** | E-mail estático (sem variável) |
| 26 | **Whats - Agendamento Entrega Chaves** | Assist. Técnica | FTP | 1 WA (+ botão) | — | 🟢 **Baixa** | 1 template + botão |
| 27 | **Jornada WhatsApp VA Indisponível** | Assist. Técnica | FTP | 1 WA (+ botão) | — | 🟢 **Baixa** | 1 template + botão |
| 28 | **Jornada WhatsApp VA Não Aptos** | Assist. Técnica | FTP | 1 WA | — | 🟢 **Baixa** | 1 template |
| 29 | **Whats - Assembleia** | Assist. Técnica | FTP | 1 WA | — | 🟢 **Baixa** | 1 template |
| 30 | **Jornada WhatsApp Pesquisa Implantação - Chave** | Assist. Técnica | FTP | 1 WA | — | 🟢 **Baixa** | 1 template |
| 31 | **Jornada WhatsApp Pesquisa Implantação - Chave Pesquisa** | Assist. Técnica | FTP | 1 WA | — | 🟢 **Baixa** | 1 template |
| 32 | **Jornada Início de Obra PRD** | Urba | FTP | 1 e-mail | — | 🟢 **Baixa** | Linear; só o `Empreendimento` sem destino XDM se o asset usar |
| 33 | **Jornada Patrimonio - Comissão afetação** | Relacionamento | FTP | 1 e-mail | — | 🟢 **Baixa** | Linear; campo `Obra` (`@Obra`) sem destino XDM |
| 34 | **Jornada Convocação Eleição PA** | Sensia | FTP | 1 e-mail | — | 🟢 **Baixa** | Só AMPscript→`@event{}`/Profile; sazonal; ⚠️ nomes invertidos com a irmã de Relacionamento |
| 35 | **Mia - Agendamento vistoria por e-mail** | Sensia | FTP | 2 e-mails | split 2-vias (`status_unidade`) | 🟢 **Baixa** | Publicável direto; jornada dormente |
| 36 | **Disparo Divulgacao Armários - WPP** | Marketplace | FTP | 1 WA | — | 🟢 **Baixa** | Disparo único estático; `empreendimento` (`{{2}}`) sem destino no mapper (leaf 🆕) |
| 37 | **Disparo Ofertas em parceiros - WPP** | Marketplace | FTP | 1 WA | — | 🟢 **Baixa** | Leaves já mapeadas; `Primeiro_nome` (`{{1}}`) via Profile (cpfHash), não vem no evento |
| 38 | **AT_orientacoes_para_Sindico_Vistoria_ASC** | Assist. Técnica | FTP · E-mail | 1 e-mail | — | 🟢 **Baixa** | E-mail único; assunto via `concat(...)`; migrar 1 asset |
| 39 | **Agendamento_para_VA_do_Sindico** | Assist. Técnica | FTP · E-mail | 2 e-mails | — (linear; Wait by Attribute em `Data_visita`) | 🟢 **Baixa** | Converter Wait by Attribute em Wait until sobre `scheduledDate` |
| 40 | **Jrn pag arm - Pagamento processado** | Marketplace | Read Audience (batch) | 2 e-mails + 1 SMS | engagement split (abertura) | 🟢 **Baixa** | Trilha linear de confirmação; complexidade só operacional (materializar audiência + CPF na DE). Evento **A CRIAR** |

## Leitura por padrão de entrada
- **Read Audience (batch)** — 7 jornadas (`PF - *` ×3 + Réguas OPPORTUNITY Armários/KIT + Jrn pag arm ×3): o
  gargalo é **estrutural** — decision splits com **join a outra DE (EXISTS)** ou dados só presentes no JOIN das
  queries (CPF, status Salesforce), exigindo **materializar a origem no perfil** ANTES de publicar.
- **API Event / evento unitário** — VA 03, VA 01, VA 04, AT-Reagendamento, JB_Renegociacao Marketplace: entrada
  não-FTP. Quando há **lookup de estado vivo** (VA 01, Reagendamento) sobe para 🔴; quando as decisões leem só o
  próprio evento (VA 04, JB_Renegociacao), fica 🟡 e o esforço vira **criar o evento**.
- **DCS / Salesforce trigger** — Wedo (Cobrança/Sensia), Cobranca-Wedo-SMS, Assinatura de Contrato GV-H. A GV-H é
  🔴 porque re-consulta o Salesforce ao vivo; as Wedo são publicáveis direto.
- **FTP com router sobre campo do evento** — Auto EC, Agendamento VA, Wedo: **publicáveis direto**.
- **Engajamento (reação)** — Síndico, Auto EC, Réguas OPPORTUNITY e as Jrn pag arm têm "abriu e-mail?" → **Reaction**.
- **1 mensagem linear** — Disparos WPP (Marketplace), Início de Obra, Patrimônio, Convocação Eleição, Comunicado
  Reneg, Orientações/Agendamento Síndico: trabalho quase só de wiring + migração do 1 asset.

## Onde está o esforço real
1. **Desbloquear as Read Audience** (3 `PF - *` + 2 Réguas OPPORTUNITY + 3 Jrn pag arm) — materializar a origem
   (Portal_SAP / Opportunity / status de pagamento Salesforce) no perfil e resolver o CPF. Pré-requisito de plataforma.
2. **Lookups de estado vivo** (VA 01 `Controle_Status_VA`, Reagendamento 2 DEs, Assinatura GV-H `UltimoBoleto__c`)
   — sem equivalente 1:1 no AJO; decidir modelagem antes de traduzir os splits.
3. **Blocos C# do Wedo** (`installmentDetailsBlock`/`contractDebtBlock`) — pendência de ingestão.
4. **Campos sem destino** — Empreendimento (Urba, Início Obra, Boas Vindas Sensia, Disparos Armários/Relançamento),
   Obra (Patrimônio), Residencial (Wedo Sensia), Tipo_Contrato (Boas Vindas Sensia), 4 leaves da Renegociação.
5. **Reconciliar mappers C# × de-para** — Implantação Cond (Copy) (4 vs 18 col), Boas Vindas Sensia.
6. O restante (jornadas 🟢) é rápido — publicável direto.

## Eventos a CRIAR (não estão no export dos 66)
`Vistoria_Antecipada` (VA 03) · VA 01 (`assistenciaTecnicaVa01LiberacaoBlocoAgendamento`) · VA 04
(`Bloqueio_Cancelamento_VA`) · Reagendamento (`portalClienteReagendamento`, envelope C# já real) · Réguas
OPPORTUNITY Armários/KIT (`MRV_CRM_Regua_Armarios_Opp` / `_KIT_Opp`) · JB_Renegociacao Marketplace
(`marketplaceJbRenegociacao`) · Assinatura de Contrato GV-H (`MRV_FTP_Assinatura_Contrato_GVH`) · Jrn pag arm
×3 (`marketplacePagamentoArmario{NaoProcessado,Processado,PreProcessamento}`). Todos propostos — confirmar ao criar.

---
_Análises mais leves (sem spec dedicada): `Wpp - Renegociação`/`reneg_expirado_prd` (ajuste de payload),
`Whats - Antecipação`/`reneg_antecipar_13_prd` (conferência de templateName) e `Jornada Wpp Aditivo` (revisão de config)._
