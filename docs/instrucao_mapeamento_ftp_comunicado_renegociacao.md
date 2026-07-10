# Instrução de mapeamento — "Jornada de E-mail - Comunicado Renegociação" · AJO **evento FTP** (simples)

> Padrão **FTP clássico** (diferente das Read Audience "PF - *"): automation **file-triggered** no SFMC
> importa CSV numa DE e dispara a jornada. No AJO vira **jornada event-triggered** pelo evento unitário
> FTP — o lado de dados (CSV→XDM→evento) já está coberto pela `instrucao_mapeamento_csharp.md`;
> esta spec registra o **fluxo** e o wiring AJO.

## Identificação
| | |
|---|---|
| Jornada SFMC | **Jornada de E-mail - Comunicado Renegociação** (`abdf5f77-9a7f-430a-9ffd-6543264b589a`, BU `mrv-cobranca-portal`) |
| Entrada SFMC | `AutomationAudience` → automation **`au_comunicação_renegociação`** (file-trigger, `queueFiles=true`) → DE **`DE_Jornada_Comunicado_Renegociacao`** (DEAudience `45fb34f8…`) |
| `sourceEventType` | `cobrancaDeEMailComunicadoRenegociacao` · `eventType = cobranca.ftpFileImport` |
| Evento AJO | **`MRV_FTP_Comunic_Reneg`** (existe — está nos 66 do export) |
| Blob prefix (ingestão C#) | `cobranca/de_email_comunicado_renegociacao` |
| Identidade | CPF → `cpfHash` (PK) |

## Fluxo SFMC (2 atividades — réguas mínimas)
```
Entrada (CSV importado) → EMAILV2-1 "Atualização sobre sua renegociação contratual" → WAIT 5min → Fim
```
- **E-mail** `EMAILV2-1` — emailId **79077**, assunto "Atualização sobre sua renegociação contratual",
  **sem variáveis `{{Event…}}` no corpo** (conteúdo estático; personalização apenas se houver AMPscript
  interno ao asset — conferir o HTML do e-mail no SFMC ao migrar o conteúdo).
- **Wait 5 min** final: só segura o contato antes do Fim — no AJO é dispensável (ou manter por paridade).

## Fluxo AJO equivalente
```
Evento MRV_FTP_Comunic_Reneg → nó Email (conteúdo migrado do emailId 79077) → Fim
```
Jornada 1-evento/1-mensagem — sem decision splits, sem engajamento, sem semáforos.

## Mapeamento de campos (CSV → XDM — já aplicado no de-para/C#)
| Coluna CSV | XDM | Uso no AJO |
|---|---|---|
| `CPF` | `_mrv.identityEvents.cpfHash` | identidade (PK) |
| `e-mail` | `_mrv.identityEvents.email` | **endereço do canal Email** (SFMC usava `{{Event…"e-mail"}}` como default) |
| `celular` | `_mrv.identityEvents.phone` | reserva (jornada não envia SMS) |
| `Nome` | `person.name.fullName` | personalização de perfil (se o asset usar) |
| `locale` | `_mrv.ftpFileImport.locale` | metadado |

Endereço do canal: no SFMC o destinatário vinha do **campo do evento** (`"e-mail"` da DE); no AJO,
usar `personalEmail.address` do perfil (populado pela ingestão) — ou o campo do evento
(`@event{MRV_FTP_Comunic_Reneg._mrv.identityEvents.email}`) se a régua tiver que respeitar o e-mail
do arquivo do dia, não o do perfil. **Decidir e documentar** (diferença aparece quando o cliente
troca de e-mail entre arquivos).

## Observações / pendências
- [ ] Google Analytics tracking estava habilitado no SFMC (`analyticsTracking: google`) — replicar UTM/tracking no AJO se o negócio usa.
- [ ] Migrar o conteúdo do e-mail (emailId 79077) e conferir AMPscript interno (o JSON da jornada não versiona o HTML).
- [ ] Ingestão C#: jornada já contemplada no mold FTP (blob prefix acima) — nenhum campo novo.
- ⚠️ Não confundir com **`Cobranca - Wedo - SMS`** (`99cff43c`, automation irmã com 1 SMS) nem com **`JB_Wedo_Email`** (spec própria) — são jornadas distintas da mesma BU.
