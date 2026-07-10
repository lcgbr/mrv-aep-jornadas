# Instrução de mapeamento — AT_orientacoes_para_Sindico_Vistoria_ASC · evento **MRV_FTP_Orient_Sind_Visto** (FTP e-mail)

> Jornada FTP de **e-mail único** (1 EMAILV2 → Wait 1 dia → fim). **Sem router / sem split.**
> Entrada por `AutomationAudience` alimentada por uma automation FTP-triggered
> (`AU_Orientacoes_sobre_vistoria_sindico`). No AJO vira evento externo → 1 e-mail direto.

## Identificação
| | |
|---|---|
| Jornada SFMC | **AT_orientacoes_para_Sindico_Vistoria_ASC** (`4e067d44-00b0-4468-b027-ef2480371b54`, BU `mrv-assistencia-tecnica`) |
| Entrada | `AutomationAudience` → **FTP file import** (automation `7083396c-7ec4-4e16-b5ac-e48436290142`, folder `import\orientacao_vistoria_sindico\`) |
| Data Extension | `Orientacoes_sobre_vistoria_sindico` (`3cd8b72b-dad1-ef11-ba6c-48df37e63c5d`) |
| `sourceEventType` | `assistenciaTecnicaAtOrientacoesParaSindicoVistoriaAsc` |
| `eventType` (XDM) | `assistenciaTecnica.ftpFileImport` |
| Evento AJO | **`MRV_FTP_Orient_Sind_Visto`** |
| Asset | E-mail `Orientacoes_sobre_vistoria_sindico` (emailId **68297**, triggeredSendKey 206419) |
| Canal | **só e-mail** |

## Envelope do evento
| Campo | Valor |
|---|---|
| Tipo do evento AJO | `dcsExternal` (evento externo ingerido via streaming — conforme `ajo_event_map.json`) |
| `eventType` (payload XDM) | `assistenciaTecnica.ftpFileImport` |
| `_mrv.sourceContext.sourceEventType` | `assistenciaTecnicaAtOrientacoesParaSindicoVistoriaAsc` |
| `_mrv.sourceContext.sourceSystem` | `FTPFileImport` (fixo) |
| `_mrv.ftpFileImport.sourceFileName` | nome do arquivo recebido |
| Identidade | `_mrv.identityEvents.cpfHash` (namespace `cpf_hash`) + `_mrv.identityEvents.email` (PK) |

Confere com o mapper C# `AtAtOrientacoesParaSindicoVistoriaAscAepMapper.cs`
(`EventType = assistenciaTecnica.ftpFileImport`, `SourceSystem = FTPFileImport`).

## Fluxo AS-IS (SFMC)
```
Automation AU_Orientacoes_sobre_vistoria_sindico  (FTP file trigger)
  └─ Import File → DE Orientacoes_sobre_vistoria_sindico
       └─ AutomationAudience (entrada da jornada)
             └─ EMAILV2  "Orientacoes_sobre_vistoria_sindico" (emailId 68297)
                   assunto: "A vistoria do condomínio %%Empreendimento%% está chegando"
                   preheader: "Confira as orientações para a vistoria"
                   └─ WAIT 1 dia
                         └─ Fim
```
- Sem decision split, sem goal, sem exit. Entrada `MultipleEntries`.
- O Wait de 1 dia é o passo final antes do fim (não gate para outra mensagem) → no AJO pode ser
  descartado (não há ação após ele) ou mantido como delay cosmético. **Recomendação: remover** — não altera o resultado.

## Fluxo AJO equivalente
```
Evento MRV_FTP_Orient_Sind_Visto
  └─ E-mail "Orientacoes_sobre_vistoria_sindico"
        (endereço = personalEmail.address, PK do arquivo)
  └─ Fim
```
Publicável direto — evento único, sem condição. Nenhum join/audience.

## Mapeamento dos campos → XDM
Base: `de_para_jornadas/assistenciaTecnicaAtOrientacoesParaSindicoVistoriaAsc.md` (4 colunas), conferido
contra o mapper C#. Todos os leaves já existem no schema (nenhum 🆕).

| # | Campo CSV/DE | Path XDM | Field Group | Obs |
|---|---|---|---|---|
| 0 | `Nome` | `person.name.fullName` / `person.name.firstName` | Profile | **Não vai no evento** — resolvido no PROFILE via `cpfHash` |
| 1 | `CPF_CNPJ` | `_mrv.identityEvents.cpfHash` | Identity | namespace `cpf_hash`; a Function gera o hash |
| 2 | `Email` | `_mrv.identityEvents.email` | Identity | **PK** / endereço do canal e-mail (`personalEmail.address`) |
| 3 | `Empreendimento` | `_mrv.earlyInspectionDetails.property` | FG-B | usado no assunto do e-mail |

## Fórmulas AJO (nome COMPLETO do evento + path completo)
- **Endereço do canal e-mail** (PK do arquivo):
  `@event{MRV_FTP_Orient_Sind_Visto._mrv.identityEvents.email}`
  (ou `personalEmail.address` resolvido no perfil, se a régua usar o e-mail do profile).
- **Nome do empreendimento** (variável pura):
  `@event{MRV_FTP_Orient_Sind_Visto._mrv.earlyInspectionDetails.property}`
- **CPF hash** (identidade):
  `@event{MRV_FTP_Orient_Sind_Visto._mrv.identityEvents.cpfHash}`
- **Primeiro nome / nome completo** (NÃO vem do evento — vem do Profile via cpfHash):
  `person.name.firstName` · `person.name.fullName`

### Assunto do e-mail (texto + variável → usar `concat`)
O assunto SFMC é `"A vistoria do condomínio %%Empreendimento%% está chegando"` — texto fixo **intercalado**
com a variável. No AJO **é obrigatório `concat`** (não dá para colar `@event{}` no meio da string):
```
concat(
  "A vistoria do condomínio ",
  @event{MRV_FTP_Orient_Sind_Visto._mrv.earlyInspectionDetails.property},
  " está chegando"
)
```
- Preheader `"Confira as orientações para a vistoria"` é **estático** → não precisa de `concat`.
- Se o corpo do e-mail também citar o empreendimento, aplicar a mesma regra de `concat`.

## Gaps / pendências (⚠️)
- [ ] ⚠️ Migrar o asset de e-mail **emailId 68297** (`Orientacoes_sobre_vistoria_sindico`) para o AJO
      e reapontar as personalizações (`%%Empreendimento%%` → `@event{MRV_FTP_Orient_Sind_Visto._mrv.earlyInspectionDetails.property}` via `concat`).
- [ ] Confirmar se o corpo do e-mail usa outras variáveis além de `Empreendimento` (só o assunto/preheader
      foram lidos do workflow) — reapontar cada uma para o path XDM correspondente.
- [ ] Decidir sobre o **Wait 1 dia** final: recomendação é remover (não há ação após ele). Confirmar com negócio.
- [ ] Confirmar que a ingestão FTP→AEP desta jornada está ativa (mapper C#
      `AtAtOrientacoesParaSindicoVistoriaAscAepMapper` já existe).
- [x] Evento AJO `MRV_FTP_Orient_Sind_Visto` já existe no export (`ajo_event_map.json`).
- [x] De-para sem lacunas — as 4 colunas têm destino no schema.

## Complexidade
🟢 **Baixa** — jornada de e-mail único, sem router/split/goal; só reaponta 1 asset e uma personalização de assunto via `concat`.
