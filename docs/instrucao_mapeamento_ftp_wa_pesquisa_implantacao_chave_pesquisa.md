# Instrução de mapeamento — "Jornada WhatsApp Pesquisa Implantação - Chave Pesquisa" · AJO **evento FTP** (WhatsApp, template único)

> Jornada FTP WhatsApp **simples**: importa CSV → dispara **1 template WhatsApp** (custom activity MIA →
> Orquestrador) → wait → fim. Corpo do template **estático** (sem variável), **sem botão**. A única variável da
> mensagem é o **telefone** (`userNumber`). Padrão de dados idêntico às demais FTP (`instrucao_mapeamento_csharp.md`).

## Identificação
| | |
|---|---|
| Jornada SFMC | **Jornada WhatsApp Pesquisa Implantação - Chave Pesquisa** (`f52389fd-18ee-4a5f-beab-711c303d7918`, BU `mrv-assistencia-tecnica`) |
| Entrada | `AutomationAudience` (file-triggered) → **FTP file import** |
| `sourceEventType` | `assistenciaTecnicaWhatsappPesquisaImplantacaoChavePesquisa` · `eventType = assistenciaTecnica.ftpFileImport` |
| Evento AJO | **`MRV_FTP_Pesq_Implant`** |
| Template WhatsApp | `chaves_pesquisa_assembleia_prd` |
| Identidade | `CPF` → `cpfHash` (PK) · canal = telefone |

## Fluxo
```
CSV → evento MRV_FTP_Pesq_Implant → nó WhatsApp (template chaves_pesquisa_assembleia_prd) → Fim
```
Sem decision split, sem router.

## Payload WhatsApp (Orquestrador)
```json
{
  "templateName": "chaves_pesquisa_assembleia_prd",
  "namespaceId": "1161020f_8cf8_31c7_fe76_eecfde18f26f",
  "attachedBot": "MariaRosa",
  "botNumber": "<PRD/QAS>",
  "userNumber": "@event{MRV_FTP_Pesq_Implant._mrv.identityEvents.phone}",
  "components": []
}
```
> Corpo estático → `components` só tem vazio (nenhuma variável de corpo).

## De-para (CSV → XDM)
| Coluna CSV | XDM |
|---|---|
| `Nome` | `person.name.fullName` |
| `CPF` | `_mrv.identityEvents.cpfHash` (PK) |
| `Telefone` | `_mrv.identityEvents.phone` → **userNumber** |

Só `Telefone` entra na mensagem (`userNumber`); `Nome`/`CPF` resolvem o perfil/identidade.

## Pendências
- [ ] Confirmar que o template `chaves_pesquisa_assembleia_prd` está aprovado no Meta com o mesmo formato (corpo estático).
- [ ] Ingestão C#: já contemplada no mold FTP (nenhum campo novo).
