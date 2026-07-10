# Instrução de mapeamento — Jornada Patrimonio - Comissão afetação · evento **MRV_FTP_Jor_Patri_Comi_Afet** (FTP e-mail)

> Padrão **FTP clássico** da BU Relacionamento: automation file-triggered importa CSV numa DE
> (modo **Overwrite**) e dispara jornada **linear de 1 e-mail** — sem splits, sem query activities.
> No AJO vira jornada event-triggered pelo evento unitário FTP. Ponto de atenção: o e-mail AS-IS
> usa o campo `Obra` do CSV, que **não tem destino XDM** no de-para atual (ver gaps).

## Identificação
| | |
|---|---|
| Jornada SFMC | **Jornada Patrimonio - Comissão afetação** (`e5f459ee-707f-449f-94ac-211491972aec`, BU `mrv-relacionamento`) |
| Event Key SFMC | `AutomationAud-56cc3d5d-fb30-99bc-61f3-a90f8829d400` |
| Entrada SFMC | `AutomationAudience` → automation **`Jornada Patrimonio`** (`ccdf2b95-922f-40a8-b15d-dd1c5b4c306c`, file-trigger em `import\jornada patrimonio comissão\`, `queueFiles=true`) → import `jornada_patrimonio_afetacao` → DE **`Jornada_patrimonio`** (Overwrite) |
| Arquivo de origem | `6-18-2026-Jornada_patrimonio.csv` (6 colunas, delimitador `;`, UTF-8) |
| `sourceEventType` | `relacionamentoPatrimonioComissaoAfetacao` · `eventType` XDM = `relacionamento.ftpFileImport` |
| Evento AJO | **`MRV_FTP_Jor_Patri_Comi_Afet`** (existe — está no export dos 66; tipo `dcsExternal`) |
| Canal / assets | **só e-mail** — asset `patrimonio_afetacao` (assunto: "Já conferiu o demonstrativo financeiro do seu apê?") |
| Identidade | CPF → `_mrv.identityEvents.cpfHash` (namespace `cpf_hash`; a Function gera o hash) |
| Mapper C# | `PatrimonioComissaoAfetacaoAepMapper.cs` (Relacionamento) — já implementado |

⚠️ **Não confundir com a automation irmã** `Jornada Patrimonio Afetacao` (`35cdc458-227c-4601-9267-4a1f24ec8966`,
pasta `import\patrimonio afetacao\`): é uma versão **legada com trigger inativo** (`InactiveTrigger`,
`isPublished=false`). A automation viva desta jornada é a **`Jornada Patrimonio`** (`ccdf2b95…`,
external key `972f244e-2083-6f27-5640-1fc3c598ae6c`, `AwaitingTrigger`).

## Envelope do evento
| Campo | Valor |
|---|---|
| `eventType` (AJO, real do `ajo_event_map.json`) | `dcsExternal` |
| `eventType` (XDM do payload) | `relacionamento.ftpFileImport` |
| `_mrv.sourceContext.sourceEventType` | `relacionamentoPatrimonioComissaoAfetacao` |
| `_mrv.sourceContext.sourceSystem` | `FTPFileImport` (fixo) |
| `_mrv.ftpFileImport.sourceFileName` | nome do arquivo recebido |

## Fluxo AS-IS (SFMC — linear, sem splits)
```
File drop (import\jornada patrimonio comissão\)
  → Import "jornada_patrimonio_afetacao" → DE Jornada_patrimonio (Overwrite)
  → Journey Entry "Jornada Patrimonio - Comissão afetação"
       → Email patrimonio_afetacao ("Já conferiu o demonstrativo financeiro do seu apê?")
       → Wait 1 min
       → Fim
```
- AMPscript no e-mail: `@PrimeiroNome`, `@Empreendimento`, `@Obra` (+ variáveis de rodapé
  `@Member_Busname/Addr/City/State/PostalCode/Country`, `@profile_center_url`, `@unsub_center_url`).
- Sem query activities: o CSV chega pronto e é importado direto (Rota A / Nativo).
- Histórico ruim no run log: **62% de erro** de import ("field mappings are valid…") — o layout do
  CSV de origem parece ter divergido da DE ao longo do tempo (ver gaps).

## Fluxo AJO equivalente
```
Evento MRV_FTP_Jor_Patri_Comi_Afet (1 evento por linha do CSV)
  → Email "patrimonio_afetacao" (conteúdo migrado do SFMC)
  → Fim
```
Jornada 1-evento/1-mensagem, publicável direto. O Wait de 1 min final do SFMC é dispensável no AJO
(só segurava o contato antes do Fim). Endereço do canal e-mail = `personalEmail.address` do perfil
(populado pela ingestão) — ou o campo do evento
`@event{MRV_FTP_Jor_Patri_Comi_Afet._mrv.identityEvents.email}` se a régua tiver que respeitar o
e-mail do arquivo do dia, não o do perfil. Decidir e documentar.

## Mapeamento dos campos → XDM
Base: de-para `relacionamentoPatrimonioComissaoAfetacao.md` — conferido contra o mapper C#
(`PatrimonioComissaoAfetacaoAepMapper.cs`); todos os leaves já existem no schema (nenhum 🆕).

| # | Campo CSV (DE `Jornada_patrimonio`) | Path XDM completo | FG | Tipo | Obs |
|---|---|---|---|---|---|
| 0 | `Empreendimento` | `_mrv.serviceCase.nomeEmpreendimento` | FG-D | String | Exceção legada PT · usado no corpo do e-mail (`@Empreendimento`) |
| 1 | `CPF` | `_mrv.identityEvents.cpfHash` | Identity | String | Identidade primária (namespace `cpf_hash`); a Function gera o hash |
| 2 | `E-mail` | `_mrv.identityEvents.email` | Identity | String | Endereço do canal e-mail |
| 3 | `Representante` | `_mrv.productOffer.representativeName` | FG-E | String | Bloco B · não aparece no AMPscript do e-mail AS-IS |
| 4 | `Locale` | `_mrv.ftpFileImport.locale` | FG-I | String | `pt-BR` (metadado) |
| 5 | `Obra` | ⚠️ **SEM DESTINO** (schema sem `propertyContext`) | — | — | **Usado no e-mail AS-IS** (`@Obra`, ex.: "76%") — resolver antes de migrar o conteúdo |

Nome / primeiro nome: **não vai no evento** — resolvido no **PROFILE** via `cpfHash`
(`person.name.firstName` / `person.name.fullName`).

## Fórmulas prontas para o AJO
Sempre com o nome **COMPLETO** do evento + path completo (nunca abreviar):

| Uso no e-mail | Fórmula AJO |
|---|---|
| Empreendimento (`@Empreendimento`) | `@event{MRV_FTP_Jor_Patri_Comi_Afet._mrv.serviceCase.nomeEmpreendimento}` |
| Representante (se o conteúdo novo usar) | `@event{MRV_FTP_Jor_Patri_Comi_Afet._mrv.productOffer.representativeName}` |
| E-mail (endereço do canal, se vier do evento) | `@event{MRV_FTP_Jor_Patri_Comi_Afet._mrv.identityEvents.email}` |
| Primeiro nome (`@PrimeiroNome`) | `{{profile.person.name.firstName}}` — via perfil (cpfHash), **não** via `@event{}` |
| Obra (`@Obra`) | ⚠️ sem fórmula possível hoje — campo sem destino XDM (ver gaps) |

**Lembrete concat:** sempre que a variável for usada junto com texto fixo, é preciso `concat(...)`:
- `concat("Já conferiu o demonstrativo financeiro do seu apê no ", @event{MRV_FTP_Jor_Patri_Comi_Afet._mrv.serviceCase.nomeEmpreendimento}, "?")`
- `concat("Empreendimento: ", @event{MRV_FTP_Jor_Patri_Comi_Afet._mrv.serviceCase.nomeEmpreendimento})`

## Gaps / pendências
- [ ] ⚠️ **`Obra` sem destino XDM** e o e-mail AS-IS usa `@Obra` (percentual de evolução da obra).
      Decidir: (a) criar leaf novo 🆕 (ex.: grupo de contexto de obra/propriedade na extensão `_mrv`
      da Relacionamento — proposta a confirmar) e regerar de-para + mapper C#; ou (b) remover a
      variável do conteúdo migrado. Enquanto não decidir, o e-mail não pode ser migrado 1:1.
- [ ] ⚠️ **62% de erro no import AS-IS** ("We couldn't import your file…") — o layout real do CSV pode
      divergir das 6 colunas mapeadas. Validar com a MRV um arquivo recente antes de fixar o parser.
- [ ] ⚠️ Jornada com **2 registros de teste** e automation pausada em 08/2024 — confirmar com o dono
      (Gustavo Cardoso) se a régua será mantida na migração.
- [ ] Migrar o conteúdo do e-mail `patrimonio_afetacao` (assunto "Já conferiu o demonstrativo
      financeiro do seu apê?") e conferir AMPscript interno do asset (o export não versiona o HTML).
- [ ] Nota de trilha: a ficha de assessment (06/2026) sugeria entry **Read Audience**, mas a trilha
      adotada foi **FTP File Event** (evento `MRV_FTP_Jor_Patri_Comi_Afet` já criado, de-para e mapper
      C# prontos) — esta spec segue a trilha FTP.
- [ ] Ingestão C#: jornada já contemplada no mold FTP (`PatrimonioComissaoAfetacaoAepMapper`) —
      nenhum campo novo além da decisão sobre `Obra`.
- [ ] `Locale` (tipo Locale, 5 chars, "pt-BR") — campo incomum; candidato a descarte na migração.

## Complexidade
🟢 **Baixa** — jornada linear de 1 e-mail sem splits; o único driver de trabalho é resolver o campo
`Obra` (usado no e-mail, sem destino XDM) antes de migrar o conteúdo.
