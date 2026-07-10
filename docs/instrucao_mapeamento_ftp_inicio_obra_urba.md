# Instrução de mapeamento — Jornada Início de Obra PRD · evento **MRV_FTP_Jor_Inicio_Obra** (FTP)

> Padrão **FTP clássico** da Urba, irmã (mais simples) da Jornada Financiamento Bancário: automation
> file-triggered importa o CSV na DE (Overwrite) e dispara a jornada. Régua **linear com 1 e-mail único** —
> sem SMS, sem waits, sem splits. No AJO vira jornada event-triggered de 1 nó Email.

## Identificação
| | |
|---|---|
| Jornada (SFMC) | **Jornada Início de Obra PRD** |
| journeyId | `760cfdd9-3d58-4044-8688-ebbf2fa23ad1` (BU `urba`, status Published v1) |
| Tipo de entrada | `AutomationAudience` → automation **`AU_Jornada Início de Obra`** (`0599dec1-21b1-4cd0-bce1-b870289085a5`, file-trigger `import\import\jornada início de obra - prd\`, `queueFiles=true`) |
| Event Definition | `AutomationAud-75084ab0-0579-c9bc-097f-a65b8a5c6b46` (`dd35e98c-f46b-4e25-9fc9-be07487b6be9`) |
| Data Extension | `Jornada_Inicio_de_Obra_PRD` (`e55bf6da-d0ce-f011-a5ab-d4f5ef66f377`) — import **Overwrite**, CPF = Subscriber Key |
| Template/asset | E-mail **"PEÇA Início de Obras"** (emailId **77197**), assunto "Comunicado Urba \| Início das Obras" |
| `sourceEventType` | `urbaInicioDeObra` · `eventType = urba.ftpFileImport` |
| Evento AJO alvo | **`MRV_FTP_Jor_Inicio_Obra`** (existe no export dos 66) |
| Canal | **só e-mail** (1 envio) |
| Identidade | CPF/CNPJ → `cpfHash` (namespace `cpf_hash`) + `phoneEmail` (namespace `telefone_email`) |

## Envelope do evento
| Campo | Valor |
|---|---|
| Evento AJO | `MRV_FTP_Jor_Inicio_Obra` — registrado no AJO como **`eventType = dcsExternal`** (padrão dos 65 do `ajo_event_map.json`) |
| `eventType` (payload XDM) | `urba.ftpFileImport` |
| `_mrv.sourceContext.sourceEventType` | `urbaInicioDeObra` |
| `_mrv.sourceContext.sourceSystem` | `FTPFileImport` (fixo) |
| `_mrv.ftpFileImport.sourceFileName` | nome do arquivo recebido (ex.: `6-19-2026-Jornada_Inicio_de_Obra_PRD.csv`) |

## Fluxo AS-IS (SFMC)
```
File Drop (import\import\jornada início de obra - prd\)
  → Step 1: Import "Import Jornada Início de Obra" → DE Jornada_Inicio_de_Obra_PRD (Overwrite)
  → Step 2: entrada na jornada (AutomationAudience)
       → EMAILV2-1 "PEÇA Início de Obras" (emailId 77197,
          assunto "Comunicado Urba | Início das Obras",
          preheader "Começamos a construção do nosso empreendimento! Veja como preparamos tudo nesta etapa!")
       → Fim
```
- **Sem waits, sem decision splits, sem SMS/WhatsApp** — jornada 100% linear (Email → Exit).
- Endereço do canal no SFMC vinha do **evento**: `defaults.email = {{Event.AutomationAud-75084ab0…."Email"}}` e
  `defaults.mobileNumber = {{Event…."Celular"}}` (celular só como reserva; a régua não envia SMS).
- Google Analytics tracking habilitado (`analyticsType: google`).
- CSV: delimitador `;`, colunas `Nome_Cliente`, `CPF` (PK), `CNPJ`, `Email`, `Celular`, `Empreendimento`.

## Fluxo AJO equivalente
```
Evento MRV_FTP_Jor_Inicio_Obra
  └─ nó Email (conteúdo migrado do emailId 77197, assunto "Comunicado Urba | Início das Obras") → Fim
```
Jornada 1-evento/1-mensagem — **sem splits, sem router, publicável direto**. Endereço do canal e-mail =
`personalEmail.address` do perfil (populado pela ingestão) — ou o campo do evento
`@event{MRV_FTP_Jor_Inicio_Obra._mrv.identityEvents.email}` se a régua tiver que respeitar o e-mail do
arquivo do dia (no SFMC era o do evento; decidir e documentar).

## Mapeamento dos campos → XDM
| # | Campo CSV/DE | XDM path | Grupo | 🆕 | Uso no AJO |
|---|---|---|---|:--:|---|
| 0 | `Nome_Cliente` | *(não vai no evento)* — resolvido no **Profile** via `cpfHash`: `person.name.firstName` / `person.name.fullName` | Profile | | personalização do e-mail (se o asset usar) |
| 1 | `CPF` | `_mrv.identityEvents.cpfHash` | Identity | | identidade primária (namespace `cpf_hash`; a Function gera o hash) |
| 2 | `CNPJ` | `_mrv.identityEvents.cpfHash` | Identity | | fallback PJ → mesmo leaf `cpfHash` quando CPF ausente |
| 3 | `Email` | `_mrv.identityEvents.email` | Identity | | **endereço do canal e-mail** |
| 4 | `Celular` | `_mrv.identityEvents.phone` | Identity | | reserva (jornada não envia SMS/WA); regra global telefone→`phone` |
| 5 | `Empreendimento` | ⚠️ **SEM DESTINO** (sem Lookup; candidatos: `serviceCase.nomeEmpreendimento` / `earlyInspectionDetails.property`) | — | | hoje **não é carregado** — ver Gaps |
| — | *(derivado)* `Celular`+`Email` | `_mrv.identityEvents.phoneEmail` | Identity | | identidade `telefone_email` (regra: ambos = `'+'+telefone+email`; só telefone = `'+'+telefone`; só email = email) |

Conferido contra o mapper C# (`InicioDeObraAepMapper.cs` — `com_aep_message_processor`): envelope idêntico
(`urba.ftpFileImport` / `FTPFileImport` / `urbaInicioDeObra`), `Nome_Cliente` vai só em `person.name.fullName`
(Field Group Identity, não no evento de personalização), e o parser **não lê `Empreendimento`** (header esperado:
`Nome_Cliente,CPF,CNPJ,Email,Celular`). Nenhum leaf 🆕 necessário para o fluxo atual.

## Fórmulas prontas (AJO)
| Uso | Fórmula |
|---|---|
| Endereço do canal e-mail (se for respeitar o arquivo) | `@event{MRV_FTP_Jor_Inicio_Obra._mrv.identityEvents.email}` |
| Telefone (reserva; regra global) | `@event{MRV_FTP_Jor_Inicio_Obra._mrv.identityEvents.phone}` |
| Nome no corpo do e-mail | via **Profile** (resolvido por `cpfHash`): `person.name.firstName` / `person.name.fullName` — **não** existe no evento |
| Nome do arquivo (rastreio/debug) | `@event{MRV_FTP_Jor_Inicio_Obra._mrv.ftpFileImport.sourceFileName}` |

> **Lembrete concat:** sempre que combinar texto fixo + variável numa expressão do AJO, use `concat`, ex.:
> `concat("Olá, seu cadastro está no e-mail ", @event{MRV_FTP_Jor_Inicio_Obra._mrv.identityEvents.email})`.
> Nunca interpole texto e `@event{}` sem `concat`, e nunca abrevie o caminho do evento.

## Gaps / pendências
- ⚠️ **`Empreendimento` sem destino XDM** e **fora do parser C#** (o CSV chega com a coluna, mas
  `InicioDeObraPayload` não a lê). Se o HTML do e-mail usar `%%Empreendimento%%`, será preciso: definir o
  leaf (ex.: `serviceCase.nomeEmpreendimento` ou `earlyInspectionDetails.property`), adicionar ao payload C#
  e reingerir — **conferir o asset antes de decidir**.
- ⚠️ **Jornada possivelmente piloto**: automation executou **1 única vez** (12/2025) e a DE tem só
  **3 registros de teste**. Confirmar com o dono (Leandro Pimentel) se a régua terá uso real antes de investir.
- ⚠️ **Overwrite → eventos unitários**: no SFMC cada arquivo substitui a DE inteira; no AEP cada linha vira
  1 evento — atenção a duplicatas se o mesmo arquivo for reprocessado (dedup por `cpf_telefone_guid`).
- [ ] Migrar o conteúdo do e-mail (emailId **77197**) e conferir AMPscript interno (o JSON da jornada não
  versiona o HTML) — assunto e preheader já capturados acima.
- [ ] Replicar tracking GA/UTM (`analyticsTracking: google`) no AJO, se o negócio usa.
- [ ] Definir remetente/send classification equivalente no AJO (perfil de envio **Urba**, não MRV).
- [ ] Decidir endereço do canal: perfil (`personalEmail.address`) × evento
  (`@event{MRV_FTP_Jor_Inicio_Obra._mrv.identityEvents.email}`) — diferença aparece quando o cliente troca de e-mail entre arquivos.
- [ ] Ingestão C#: jornada já contemplada no mold FTP (blob prefix `urba/inicio_de_obra`) — nenhum campo novo.
- ⚠️ Não confundir com as irmãs da mesma BU: **Jornada Financiamento Bancário** (`9eec5f22…`, Email + SMS,
  DE com 9 campos) e **Jornada Valorização do Lote** — automations file-trigger de estrutura parecida.

## Complexidade
🟢 **Baixa** — régua linear de 1 e-mail estático (sem waits, sem splits, sem SMS), entrada FTP padrão já
coberta pelo mold C#; único ponto aberto é o destino do campo `Empreendimento` caso o asset o utilize.
