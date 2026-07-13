# Instrução de mapeamento — Prazo Encerrando 7 dias · evento **MRV_FTP_Prazo_Encerrando_7d** (FTP batch · decision split por `Classificação`)

> Régua de **7 dias antes do prazo encerrar** do Marketplace. Entra por arquivo (File Drop na pasta
> `import\prazo encerrado\`, DE **`Prazo Encerramento`**), classifica o contato em **Alto / Médio / Baixo**
> e dispara Email + SMS por trilha. No AJO o disparo é o evento FTP **`MRV_FTP_Prazo_Encerrando_7d`**
> (`dcsExternal`) e o "MultiCriteria Decision" do SFMC vira uma atividade **Condition** de 3 caminhos.
> ⚠️ **Jornada DORMENTE** — última execução out/2025, DE travada desde jul/2024 (decidir migrar × descontinuar, Q1).
> ⚠️ **Bug herdado no ramo Médio** (condição impossível) — ver seção do decision split.

## Identificação
| | |
|---|---|
| Jornada SFMC | **Jornada Prazo Encerrando_7dIas** (`6fea77c7-9e0b-4106-92b3-0d5c0635e0ac`, BU `mrv-marketplace`) — Published v6, 19 atividades, duração 10 dias |
| Entrada SFMC | `AutomationAudience` (event `1b0dd6d6-54d6-4e53-99c8-d53503c99f1e`, key `AutomationAud-bab5f6d0-6e03-ad7f-5892-eefb02e8c246`), acionada pela automation **`Prazo`** (File Drop, Queue Files On) |
| DE de entrada | **`Prazo Encerramento`** (`562C7D9A-BFE3-4DB4-A016-8F47DD66C21C`) — 9 colunas, 731 registros, **Overwrite** (full), Subscriber Key = `CPF` |
| Canais | 3 e-mails (`Kit_prazo_encerrando_7_dias_{A,M,B}`, assets 73499/73500/73501) + 3 SMS (`Kit_prazoencerrando_{alto,medio,baixo}`, short code `29520`) |
| Identidade AJO | `cpfHash` (namespace `cpf_hash`) — a Function gera o hash a partir de `CPF` |
| **Evento AJO** | **`MRV_FTP_Prazo_Encerrando_7d`** (`eventType` de origem `dcsExternal`) — **já existe** no `ajo_event_map.json` |
| De-para | `AEP/docs_markdown/de_para_jornadas/marketplacePrazoEncerrando7dias.md` (reconciliado ao mapper C# `PrazoEncerrando7diasAepMapper`) |
| Ficha | `AEP/fichas/Marketplace/marketplace_prazo_encerrando_7dias.md` |

## Envelope do evento (ingestão FTP → XDM)
| Campo | Valor |
|---|---|
| Evento AJO | `MRV_FTP_Prazo_Encerrando_7d` |
| `eventType` (XDM) | `marketplace.ftpFileImport` |
| `_mrv.sourceContext.sourceEventType` | `marketplacePrazoEncerrando7dias` |
| `_mrv.sourceContext.sourceSystem` | `FTPFileImport` (fixo) |
| `_mrv.ftpFileImport.sourceFileName` | nome do arquivo recebido |
| Arquivo de origem | `prazo_encerramento.csv` (9 colunas) |

## Fluxo AS-IS (SFMC) — verificado no raw
```
Entrada (DE Prazo Encerramento, File Drop → batch)
└─ MULTICRITERIADECISIONV2-1  (decision split por Classificação)
   ├─ Alto   (Classificação = "Alto")                    → WAITBYATTRIBUTE-9
   ├─ Médio  (Classificação = "Médio" AND is null ⚠️)    → WAITBYATTRIBUTE-10   ← condição IMPOSSÍVEL
   └─ Baixo  (remainder / demais)                        → WAITBYATTRIBUTE-11
```
Os **3 ramos têm a MESMA estrutura** — só muda o valor da classificação e o criativo:
```
WAITBYATTRIBUTE "7 days before Prazo_encerrando"   (espera até Prazo_encerrando − 7 dias)
  → STOWAIT "Einstein STO - 24 Hours"              (otimização de horário, janela 24h)
    → EMAILV2 "Kit_prazo_encerrando_7_dias_{A|M|B}"
      → WAIT "1 day"
        → SMSSYNC "Kit_prazoencerrando_{alto|medio|baixo}"  (short code 29520)
          → WAIT "1 day" → Fim
```
- Personalização atual: `%%primeiro_nome%%` (sistema) na saudação e `@empreendimento` (AMPscript) no corpo.
- Split lê um **atributo efêmero do evento** (`IsEphemeralAttribute="true"`, `Key=Event.…Classificação`) — ou seja, é **campo do evento de entrada**, não atributo persistente de perfil. Isso favorece a rota por evento no AJO.

## 🎯 Como criar o Decision Split no AJO
No AJO **não existe "Decision Split"** com esse nome — o equivalente do `MULTICRITERIADECISION` do SFMC é a
atividade **Condition** (Condição), que cria **N caminhos**, cada um com uma expressão booleana, avaliados
**de cima para baixo** (o perfil segue o **primeiro** caminho verdadeiro — mutuamente exclusivos, igual ao
"remainder" do SFMC).

**Passo a passo:**
1. Depois da atividade de entrada, adicione **1 atividade `Condition`**.
2. Ela nasce com 2 caminhos; **adicione um 3º** e rotule-os **Alto**, **Médio**, **Baixo**.
3. **Ordene** os caminhos: `Alto` → `Médio` → `Baixo`. O `Baixo` deve ser o **último** e marcado como
   **"Todos os outros caminhos" (else/remainder)** — captura quem não casou com Alto/Médio (paridade com o
   `remainder_path` do SFMC).
4. Em cada caminho, abra o editor de expressão e escreva a condição sobre o **campo do evento**
   `_mrv.customerClassification` (é onde `Classificação` cai no XDM — ver de-para):

   | Caminho | Expressão (editor de condição do AJO) |
   |---|---|
   | **Alto** | `@event{MRV_FTP_Prazo_Encerrando_7d._mrv.customerClassification} == "Alto"` |
   | **Médio** | `@event{MRV_FTP_Prazo_Encerrando_7d._mrv.customerClassification} == "Médio"` *(+ tratar nulo — ver ⚠️)* |
   | **Baixo** | *(else)* — marcar "todos os outros caminhos"; **não** escrever expressão |

5. Ligue **cada saída** ao seu subfluxo (Wait 7d → STO → Email → Wait 1d → SMS → Wait 1d). Como os 3
   subfluxos são idênticos exceto pelo **asset**, o que muda em cada ramo é só o e-mail/SMS selecionado.

### ⚠️ Corrigir o bug herdado do ramo Médio
No SFMC o ramo Médio está configurado como `Classificação Equal "Médio" **AND** Classificação **IsNull**`
(operador `AND`). Isso é **logicamente impossível** — um valor não pode ser "Médio" **e** nulo ao mesmo
tempo — então **o ramo Médio nunca recebe ninguém** e todo contato que não é "Alto" cai no **remainder
(Baixo)**. Ao reconstruir no AJO, **não replique o `AND`**. Alinhar a intenção real com a MRV (provável:
tratar nulo como Médio):
- **Se nulo deve ir para Médio:**
  `@event{MRV_FTP_Prazo_Encerrando_7d._mrv.customerClassification} == "Médio"` **OR**
  `@event{MRV_FTP_Prazo_Encerrando_7d._mrv.customerClassification}` *is null / vazio*.
- **Se nulo deve ir para Baixo:** deixe o Médio só com `== "Médio"` e o nulo cai naturalmente no else (Baixo).

### Rota por evento (recomendada) × Read Audience
- **Recomendada — evento `MRV_FTP_Prazo_Encerrando_7d`:** o split e o wait usam **campos do evento**
  (`customerClassification`, `deadlineApproaching`), então a Condition referencia `@event{…}` direto, como
  acima. O evento **já existe** no mapa — é o caminho de menor atrito.
- **Alternativa — Read Audience (preliminar da ficha):** a Condition do AJO em jornada de audiência só lê
  **atributos de perfil/audiência**, não campos crus do evento. Exigiria promover `customerClassification`
  e `deadlineApproaching` a **atributos de perfil** (ou pré-segmentar 3 audiências Alto/Médio/Baixo e rotear
  por **pertencimento de audiência**). Mais trabalho; só faz sentido se a MRV padronizar tudo como batch.

## Mapeamento dos campos → XDM
Colunas da DE `Prazo Encerramento` (de-para reconciliado ao mapper C# `PrazoEncerrando7diasAepMapper`):

| # | Campo CSV | XDM (evento) | Uso no AJO |
|---|---|---|---|
| 0 | `Nome` | — (resolvido no profile via `cpfHash`) | `person.name.fullName` no perfil |
| 1 | `Primeiro_nome` | — (resolvido no profile via `cpfHash`) | **saudação** `%%primeiro_nome%%` → `person.name.firstName` (perfil) |
| 2 | `Empreendimento` | `_mrv.propertyContext.property` | corpo `@empreendimento` → `@event{MRV_FTP_Prazo_Encerrando_7d._mrv.propertyContext.property}` |
| 3 | `CPF` | `_mrv.identityEvents.cpfHash` | **identidade PK** (namespace `cpf_hash`; hash gerado pela Function) |
| 4 | `Celular` | `_mrv.identityEvents.phone` (perfil `mobilePhone.number`) | número do canal **SMS** |
| 5 | `Email` | `_mrv.identityEvents.email` (perfil `personalEmail.address`) | endereço do canal **e-mail** |
| 6 | `Classificação` | `_mrv.customerClassification` | **discriminador do decision split** (Alto/Médio/Baixo) |
| 7 | `Locale` | `_mrv.ftpFileImport.locale` | `pt-BR` |
| 8 | `Prazo_encerrando` | `_mrv.deadlineApproaching` | **âncora do Wait** (data ISO-8601 `yyyy-MM-dd`); disparar em `deadlineApproaching − 7 dias` |

## Fórmulas prontas para o AJO
**Decision split (Condition):**
- Alto: `@event{MRV_FTP_Prazo_Encerrando_7d._mrv.customerClassification} == "Alto"`
- Médio: `@event{MRV_FTP_Prazo_Encerrando_7d._mrv.customerClassification} == "Médio"` *(+ OR nulo, se for a intenção)*
- Baixo: caminho **else** (todos os outros)

**Wait "7 dias antes do prazo" (WAITBYATTRIBUTE):** Wait do AJO com **data-alvo calculada de atributo** =
`@event{MRV_FTP_Prazo_Encerrando_7d._mrv.deadlineApproaching}` **− 7 dias** (TZ America/Sao_Paulo).
`deadlineApproaching` chega como string ISO `yyyy-MM-dd` (DateFormatter no C#) — garantir parse de data ao
subtrair os 7 dias.

**Personalização de conteúdo:**
- Saudação (substitui `%%primeiro_nome%%`): `person.name.firstName` do **perfil** (via `cpfHash`).
- Empreendimento (substitui `@empreendimento`): `@event{MRV_FTP_Prazo_Encerrando_7d._mrv.propertyContext.property}`.

> **Lembrete `concat`:** ao combinar texto fixo + variável numa mesma expressão, use
> `concat("texto ", @event{...})` — nunca justaposição. Ex. (assunto do e-mail):
> `concat(person.name.firstName, ", faltam 7 dias!")`.

## Gaps / pendências
- [ ] ⚠️ **Q1 — migrar × descontinuar:** jornada parada desde out/2025 e DE travada desde jul/2024. Confirmar
  com a MRV (Barbara) antes de investir na reconstrução.
- [ ] ⚠️ **Corrigir a intenção do ramo Médio** (bug `Equal Médio AND IsNull` = impossível): definir para onde
  vai o nulo (Médio ou Baixo) — ver seção do decision split.
- [ ] ⚠️ **Wait por atributo de data** (`deadlineApproaching − 7 dias`): validar suporte do AJO a data-alvo
  calculada de atributo do evento; se `deadlineApproaching` já for a data do prazo, o disparo é 7 dias antes.
- [ ] **Einstein STO (24h) ×3** → habilitar **Send-Time Optimization** nativo do AJO por canal e validar
  comportamento equivalente.
- [ ] **SMS** via short code `29520` — configurar canal SMS no AJO (ou Custom Action) para os 3 assets
  `Kit_prazoencerrando_{alto,medio,baixo}`.
- [ ] **Migrar assets:** 3 e-mails (73499 `_A`, 73500 `_M`, 73501 `_B`) + 3 SMS; converter AMPscript
  (`@empreendimento`, `%%primeiro_nome%%`) para as expressões da seção Fórmulas.
- [ ] **Re-entrada:** confirmar regra (SFMC batch Overwrite → 1 entrada por carga); refletir na config da jornada.
- [ ] **Consentimento/LGPD:** aplicar supressão padrão email+SMS (a DE não carrega consent hoje).

## Complexidade
🟢 **Baixa** — origem FTP direta (Overwrite, sem transformação SQL), evento AJO **já existe**, e o decision
split é um `Condition` de 3 caminhos sobre 1 campo (`customerClassification`), com 3 subfluxos idênticos
exceto pelo criativo. Os únicos pontos de atenção são o **wait por atributo de data** e o **bug do ramo
Médio** a corrigir. Esforço ~2 pessoa-dia **se** a MRV decidir manter (hoje dormente).
