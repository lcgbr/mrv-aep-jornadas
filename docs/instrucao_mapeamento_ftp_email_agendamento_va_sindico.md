# Instrução de mapeamento — Agendamento_para_VA_do_Sindico · evento **MRV_FTP_Agend_VA_Sindico** (FTP · e-mail)

> Jornada FTP de **e-mail** para o **síndico** confirmar/lembrar a Vistoria Antecipada (VA) do condomínio.
> Fluxo **linear** (sem decision split / sem router): 1 e-mail de confirmação → espera até 2 dias antes da
> `Data_visita` → 1 e-mail de lembrete → Fim.
> ⚠️ **NÃO confundir** com as irmãs de nome parecido — já têm spec própria:
> "Jornada WhatsApp Agendamento VA" (`MRV_FTP_Agendamento_VA`, WhatsApp) e
> "Jornada e-mail Agendamento VA" (`MRV_FTP_Email_Agend_VA`, e-mail com router por `status_unidade`).
> Esta aqui é a do **síndico** (`assistenciaTecnicaAgendamentoParaVaDoSindico`).

## Identificação
| | |
|---|---|
| Jornada SFMC | **Agendamento_para_VA_do_Sindico** (journeyId `26f24896-b468-4fd6-9c3f-701ac61acd2d`, BU `mrv-assistencia-tecnica`) |
| Automation de origem | `AU_agendamento vistoria do Síndico` (`6d7a762c-70f3-4f6b-9958-f36a0371cea8`, key `4e13e43f-fa74-7681-fbcb-a797490745b6`, Triggered / File Drop) |
| Entrada | `AutomationAudience` → **FTP file import** (File Drop em `import\agendamento_vistoria_sindico\`) → DE → Journey Entry (`DEAudience-daf7ab63-da88-b6d8-a91b-23df7b342b96`) |
| DE de origem | `Agendamento_VA _Sindico` (key `F19EB560-30C5-4BD3-BDF2-E7B960A59CB2`) · 5 colunas |
| `sourceEventType` | `assistenciaTecnicaAgendamentoParaVaDoSindico` |
| Evento AJO | **`MRV_FTP_Agend_VA_Sindico`** |
| Canal | **só e-mail** (2 disparos; identidade sem telefone) |
| Assets (a migrar) | e-mail **`Agendamento_Vistoria_ASC_confirmado`** · e-mail **`Lembrete_agendamento_vistoria_ASC`** |

## Envelope do evento
| Campo | Valor |
|---|---|
| Evento AJO (nome completo) | `MRV_FTP_Agend_VA_Sindico` |
| `eventType` (fonte AJO / `ajo_event_map.json`) | **`dcsExternal`** — o evento é alimentado no AJO via Data Collection Service (streaming) |
| `eventType` (campo XDM do payload, mapper C#) | `assistenciaTecnica.ftpFileImport` |
| `_mrv.sourceContext.sourceEventType` | `assistenciaTecnicaAgendamentoParaVaDoSindico` |
| `_mrv.sourceContext.sourceSystem` | `FTPFileImport` (fixo) |
| `_mrv.ftpFileImport.sourceFileName` | nome do arquivo recebido (metadado) |

> Envelope confirmado no mapper C# `AtAgendamentoParaVaDoSindicoAepMapper.cs`
> (`EventType = "assistenciaTecnica.ftpFileImport"`, `SourceSystem = "FTPFileImport"`,
> `SourceEventType = "assistenciaTecnicaAgendamentoParaVaDoSindico"`).

## Fluxo AS-IS (Journey Builder)
```
Entrada (DE Agendamento_VA _Sindico, batch/Automation)
  → E-mail  "Agendamento_Vistoria_ASC_confirmado"   (confirmação do agendamento)
  → Wait by Attribute: 2 dias ANTES de Data_visita
  → E-mail  "Lembrete_agendamento_vistoria_ASC"      (lembrete da vistoria)
  → Wait 1 dia
  → Fim
```
- **Linear** — sem decision split, sem router. Único ponto de tempo é o **Wait by Attribute** ancorado em `Data_visita`.
- **AMPscript** dos e-mails: `@DataFormatada` (a partir de `Data_visita`) e `@Hora_visita` — texto fixo + variável.

## Fluxo AJO equivalente
```
Evento MRV_FTP_Agend_VA_Sindico (dcsExternal)
  └─ E-mail "Agendamento Vistoria ASC confirmado"
       to = @event{MRV_FTP_Agend_VA_Sindico._mrv.identityEvents.email}
     → Wait until: (scheduledDate − 2 dias)
          referência = @event{MRV_FTP_Agend_VA_Sindico._mrv.earlyInspectionDetails.scheduledDate}
     → E-mail "Lembrete agendamento vistoria ASC"
     → Fim
```
- Jornada 1-evento / linear → **publicável direto** (sem join/EXISTS, sem condição de router).
- Endereço do canal e-mail = `@event{MRV_FTP_Agend_VA_Sindico._mrv.identityEvents.email}` (ou `personalEmail.address`,
  se a régua usar o e-mail do profile resolvido pelo `cpfHash`).
- Nome do síndico no corpo do e-mail → resolvido no **PROFILE** via `cpfHash` (`person.name.firstName` /
  `person.name.fullName`) — **não** vem no evento.

## Mapeamento dos campos → XDM
| # | Campo CSV (DE) | Path XDM completo | FG | Tipo | Obs |
|---|---|---|---|---|---|
| 0 | `Nome` | `person.name.firstName` / `person.name.fullName` (PROFILE via `cpfHash`) | Profile | String | **NÃO vai no evento** — resolvido no profile pela identidade `cpfHash` |
| 1 | `Email` | `_mrv.identityEvents.email` | Identity | String | PK / endereço do canal e-mail (namespace `email`) |
| 2 | `CPF_CNPJ` | `_mrv.identityEvents.cpfHash` | Identity | String | CPF/CNPJ → **hash** gerado pela Function (namespace `cpf_hash`) |
| 3 | `Hora_visita` | `_mrv.earlyInspectionDetails.scheduledTime` | FG-B | String | usado no corpo (`@Hora_visita`) |
| 4 | `Data_visita` | `_mrv.earlyInspectionDetails.scheduledDate` | FG-B | Date | dispara o Wait (2d antes) e o corpo (`@DataFormatada`) |

> Sem leaves novos 🆕 — todos os paths já existem no schema (`earlyInspectionDetails` é compartilhado com as
> demais jornadas de VA). Todas as 5 colunas têm destino (nenhuma lacuna de campo).

## Fórmulas prontas para o AJO
Sempre o **nome COMPLETO** do evento + path completo — nunca abreviar:

| Uso | Fórmula |
|---|---|
| E-mail (destinatário) | `@event{MRV_FTP_Agend_VA_Sindico._mrv.identityEvents.email}` |
| Data da vistoria | `@event{MRV_FTP_Agend_VA_Sindico._mrv.earlyInspectionDetails.scheduledDate}` |
| Hora da vistoria | `@event{MRV_FTP_Agend_VA_Sindico._mrv.earlyInspectionDetails.scheduledTime}` |
| Wait until (2d antes) | referência de data = `@event{MRV_FTP_Agend_VA_Sindico._mrv.earlyInspectionDetails.scheduledDate}` menos 2 dias |
| Nome do síndico (profile) | `person.name.firstName` (via identidade `cpfHash`) — **não** usar `@event{}` |

**Lembrete de `concat` (texto fixo + variável):** onde o corpo mistura texto e variável, use `concat`, ex.:
```
concat("Olá ", person.name.firstName, ", sua vistoria está confirmada para o dia ",
       @event{MRV_FTP_Agend_VA_Sindico._mrv.earlyInspectionDetails.scheduledDate},
       " às ", @event{MRV_FTP_Agend_VA_Sindico._mrv.earlyInspectionDetails.scheduledTime}, ".")
```
Isso substitui o `@DataFormatada` / `@Hora_visita` do AMPscript. Formatar a data (`scheduledDate` é `Date`)
para o padrão pt-BR (dd/MM) na renderização do e-mail.

## Gaps / pendências (⚠️) e checklist
- [ ] ⚠️ **Wait by Attribute → Wait until no AJO**: recriar o "2 dias antes de `Data_visita`" como nó *Wait until*
  ancorado em `scheduledDate`. Confirmar o comportamento quando o arquivo chega **com menos de 2 dias** de
  antecedência (a data-alvo já passou) — definir se pula o 1º e-mail/lembrete ou dispara imediato.
- [ ] Migrar os 2 assets de e-mail (`Agendamento_Vistoria_ASC_confirmado`, `Lembrete_agendamento_vistoria_ASC`)
  e trocar o AMPscript (`@DataFormatada`/`@Hora_visita`) pelas fórmulas `@event{}` + `concat` acima.
- [ ] Confirmar via tela: **PK / Subscriber Key** da DE, tipagem e delimitador/encoding do CSV, e o modo de carga
  (assumido **Overwrite**).
- [ ] Confirmar formato de `Data_visita` no arquivo (para o `ParseDateOnly` do mapper) e a formatação pt-BR no corpo.
- [ ] Identidade sem telefone (só `cpfHash` + `email`) — canal é **e-mail**; validar que o e-mail do arquivo é o
  endereço de envio (vs. e-mail do profile).

## Complexidade
🟢 **Baixa** — jornada linear de e-mail (2 disparos, sem router/split); o único ponto de atenção é converter o
*Wait by Attribute* (2 dias antes de `Data_visita`) em *Wait until* sobre `scheduledDate` e tratar a antecedência curta.
