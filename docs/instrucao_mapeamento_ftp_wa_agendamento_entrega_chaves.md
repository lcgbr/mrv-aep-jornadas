# Instrução de mapeamento — "Whats - Agendamento Entrega Chaves" · AJO **evento FTP** (WhatsApp, template único)

> Jornada FTP WhatsApp **simples**: importa CSV → dispara **1 template WhatsApp** (custom activity MIA →
> Orquestrador) → wait → fim. Corpo do template **estático** (sem variável), botão quick_reply **"Agendar entrega"**. A única variável da
> mensagem é o **telefone** (`userNumber`). Padrão de dados idêntico às demais FTP (`instrucao_mapeamento_csharp.md`).

## Identificação
| | |
|---|---|
| Jornada SFMC | **Whats - Agendamento Entrega Chaves** (`dfb1d929-b7e8-4605-a6fc-2a5af60c1fd5`, BU `mrv-assistencia-tecnica`) |
| Entrada | `AutomationAudience` (file-triggered) → **FTP file import** |
| `sourceEventType` | `assistenciaTecnicaWhatsAgendamentoEntregaChaves` · `eventType = assistenciaTecnica.ftpFileImport` |
| Evento AJO | **`MRV_FTP_Agend_Entreg_Chaves`** |
| Template WhatsApp | `chaves_entrega_chaves_prd` |
| Identidade | `CPF` → `cpfHash` (PK) · canal = telefone |

## Fluxo
```
CSV → evento MRV_FTP_Agend_Entreg_Chaves → nó WhatsApp (template chaves_entrega_chaves_prd) → Fim
```
Sem decision split, sem router.

## Payload WhatsApp (Orquestrador)
```json
{
  "templateName": "chaves_entrega_chaves_prd",
  "namespaceId": "1161020f_8cf8_31c7_fe76_eecfde18f26f",
  "attachedBot": "MariaRosa",
  "botNumber": "<PRD/QAS>",
  "userNumber": "@event{MRV_FTP_Agend_Entreg_Chaves._mrv.identityEvents.phone}",
  "components": [{ "type":"button", "buttonIndex":0, "buttonSubtype":"quick_reply", "parameters":[{ "type":"payload", "payload":"Agendar entrega" }] }]
}
```
- Botão quick_reply: `payload = "Agendar entrega"` (valor estático).
> Corpo estático → `components` só tem o botão.

## De-para (CSV → XDM)
| Coluna CSV | XDM |
|---|---|
| `Nome` | `person.name.fullName` |
| `CPF` | `_mrv.identityEvents.cpfHash` (PK) |
| `Telefone` | `_mrv.identityEvents.phone` → **userNumber** |

Só `Telefone` entra na mensagem (`userNumber`); `Nome`/`CPF` resolvem o perfil/identidade.

## Pendências
- [ ] Confirmar que o template `chaves_entrega_chaves_prd` está aprovado no Meta com o mesmo formato (corpo estático, botão quick_reply).
- [ ] Ingestão C#: já contemplada no mold FTP (nenhum campo novo).
