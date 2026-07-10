# Instrução de mapeamento C# — ingestão FTP → AEP

> Serviço `com_aep_message_processor` (`AEPIngestion.Core/Models/AEP/...`). Cada jornada FTP lê o CSV,
> monta o evento XDM (record `Aep…Event`) e envia via **Streaming Ingestion** ao AEP.
> Este doc = mapeamento **coluna CSV → path XDM** para **todas as 78 jornadas / 515 campos**, alinhado ao de-para 100% do site.
> Fonte de dados: schema **FTP_File_Event** (mixins `_mrv.*` + `person.*`). Total: 78 jornadas · 515 campos · **32 usam campos novos (🆕)**.

---

## 1. Regras gerais (valem para TODA jornada)

### 1.1 Envelope (fixo por jornada)
| XDM | Valor |
|---|---|
| `eventType` | `<bu>.ftpFileImport` (ver por jornada) |
| `_mrv.sourceContext.sourceEventType` | `<sourceEventType>` (ver por jornada) |
| `_mrv.sourceContext.sourceSystem` | `FTPFileImport` (fixo) |
| `_mrv.ftpFileImport.sourceFileName` | nome do arquivo recebido |
| `xdm:timestamp`, `@id` | timestamp do processamento / id do evento |

### 1.2 Identidade (padrão — não repetido nas tabelas por jornada, exceto quando a coluna existe)
| Coluna CSV | XDM | Nota |
|---|---|---|
| `CPF` | `_mrv.identityEvents.cpfHash` | **hash** (namespace `cpf_hash`); PK — a Function gera o hash |
| `Telefone` / `Celular` | `_mrv.identityEvents.phone` | + identidade primária `phoneEmail` (namespace `telefone_email`) + `mobilePhone` padrão |
| `Email` | `_mrv.identityEvents.email` | namespace `Email` |

### 1.3 Nome do cliente
`Nome`/`Cliente`/`Nome_Cliente`/`Primeiro_nome` → **`person.name.fullName`** (ou `person.name.firstName` p/ "Primeiro_nome") — mixin padrão `profile-person-details` (`XdmPerson.Name`). Enviar no evento; o Profile é resolvido via `cpfHash`.

### 1.4 Tipos e nulos
- Praticamente tudo `string?` (record `init`-only). Datas: enviar string; os campos criados como `date`/`date-time` no schema (`contractSignatureDate`, `bankSignatureForecastDate`, `keysDeliveryForecastDate`, `smsDate`, `saleDate`) aceitam ISO-8601.
- **Coluna vazia → NÃO enviar a propriedade** (omitir do JSON). Nada de string vazia.
- O record serializa o container como `_mrv` (placeholder do tenant já resolvido).

---

## 2. Mudanças no modelo C# — FAZER ANTES de mapear as jornadas

Os **22 campos novos** criados no schema AEP precisam de propriedade C#.

### 2.1 Estender `Common/ContractBillingEvent.cs` (+10 propriedades)
```csharp
[JsonPropertyName("contractType")]              public string? ContractType { get; init; }
[JsonPropertyName("contractSignatureDate")]     public string? ContractSignatureDate { get; init; }
[JsonPropertyName("financingPlan")]             public string? FinancingPlan { get; init; }
[JsonPropertyName("bankSignatureForecastDate")] public string? BankSignatureForecastDate { get; init; }
[JsonPropertyName("keysDeliveryForecastDate")]  public string? KeysDeliveryForecastDate { get; init; }
[JsonPropertyName("collectionIndicator")]       public string? CollectionIndicator { get; init; }
[JsonPropertyName("impedimentReason")]          public string? ImpedimentReason { get; init; }
[JsonPropertyName("claimOpenedIndicator")]      public string? ClaimOpenedIndicator { get; init; }
[JsonPropertyName("smsDate")]                   public string? SmsDate { get; init; }
[JsonPropertyName("referenceMonth")]            public string? ReferenceMonth { get; init; }
```

### 2.2 Criar `Common/PropertyContext.cs` (record novo)
```csharp
using System.Text.Json.Serialization;
namespace AEPIngestion.Core.Models.AEP.Common;

public record PropertyContext
{
    [JsonPropertyName("constructionName")]       public string? ConstructionName { get; init; }
    [JsonPropertyName("unit")]                   public string? Unit { get; init; }
    [JsonPropertyName("block")]                  public string? Block { get; init; }
    [JsonPropertyName("productName")]            public string? ProductName { get; init; }
    [JsonPropertyName("residentialDescription")] public string? ResidentialDescription { get; init; }
    [JsonPropertyName("appreciation")]           public string? Appreciation { get; init; }
    [JsonPropertyName("saleStatus")]             public string? SaleStatus { get; init; }
}
```

### 2.3 Criar `Common/CustomerAddress.cs` (record novo)
```csharp
using System.Text.Json.Serialization;
namespace AEPIngestion.Core.Models.AEP.Common;

public record CustomerAddress
{
    [JsonPropertyName("street")]       public string? Street { get; init; }
    [JsonPropertyName("neighborhood")] public string? Neighborhood { get; init; }
    [JsonPropertyName("city")]         public string? City { get; init; }
    [JsonPropertyName("state")]        public string? State { get; init; }
    [JsonPropertyName("postalCode")]   public string? PostalCode { get; init; }
}
```

### 2.4 Registrar os 2 grupos novos em `Common/MrvExtension.cs` (e nos extensions por BU que os usem)
```csharp
[JsonPropertyName("propertyContext")]
public PropertyContext? PropertyContext { get; init; }

[JsonPropertyName("customerAddress")]
public CustomerAddress? CustomerAddress { get; init; }
```
> Os subsets por BU (`MrvCobrancaExtension`, etc.) devem incluir os grupos novos **onde a jornada os usa** (ver 🆕 nas tabelas). `propertyContext` aparece em Cobrança/Sensia/Marketplace/Relacionamento/Urba; `customerAddress` em `JB_Wedo_Email` (Cobrança e Sensia).

---

## 3. Mapeamento por jornada (coluna CSV → XDM)

> `🆕` = usa campo novo (§2). Colunas de identidade (CPF/Telefone/Email) seguem §1.2.

## BU: AssistenciaTecnica

### AT_orientacoes_para_Sindico_Vistoria_ASC (AssistenciaTecnica)
`eventType` = `assistenciaTecnica.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `assistenciaTecnicaAtOrientacoesParaSindicoVistoriaAsc` · evento AJO `MRV_FTP_Orient_Sind_Visto`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF_CNPJ` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Email` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `Empreendimento` | `_mrv.earlyInspectionDetails.property` | EarlyInspectionDetails.Property |  |

### Agendamento vistoria antecipada (AssistenciaTecnica)
`eventType` = `assistenciaTecnica.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `assistenciaTecnicaAgendamentoVistoriaAntecipada` · evento AJO `MRV_FTP_Agend_Visto_Antecip`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `Cpf` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `e-mail` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `tempo` | `_mrv.earlyInspectionDetails.elapsedTime` | EarlyInspectionDetails.ElapsedTime |  |
| `horarios` | `_mrv.earlyInspectionDetails.scheduledTime` | EarlyInspectionDetails.ScheduledTime |  |

### Agendamento_para_VA_do_Sindico (AssistenciaTecnica)
`eventType` = `assistenciaTecnica.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `assistenciaTecnicaAgendamentoParaVaDoSindico` · evento AJO `MRV_FTP_Agend_VA_Sindico`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `Email` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `CPF_CNPJ` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Hora_visita` | `_mrv.earlyInspectionDetails.scheduledTime` | EarlyInspectionDetails.ScheduledTime |  |
| `Data_visita` | `_mrv.earlyInspectionDetails.scheduledDate` | EarlyInspectionDetails.ScheduledDate |  |

### Jornada Implantação Condominio (AssistenciaTecnica)
`eventType` = `assistenciaTecnica.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `assistenciaTecnicaImplantacaoCondominio` · evento AJO `MRV_FTP_Implant_Condominio`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `cpf` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Email` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `link` | `_mrv.condominiumEvent.actionLink` | CondominiumEvent.ActionLink |  |
| `prazo_candidatura` | `_mrv.condominiumEvent.candidacyDeadline` | CondominiumEvent.CandidacyDeadline |  |
| `video_candidato` | `_mrv.condominiumEvent.candidateVideoLink` | CondominiumEvent.CandidateVideoLink |  |
| `inicio_votacao` | `_mrv.condominiumEvent.votingStartDate` | CondominiumEvent.VotingStartDate |  |
| `fim_votacao` | `_mrv.condominiumEvent.votingEndDate` | CondominiumEvent.VotingEndDate |  |
| `disponibilizacao_conteudo` | `_mrv.condominiumEvent.contentAvailabilityDate` | CondominiumEvent.ContentAvailabilityDate |  |
| `Data1` | `_mrv.condominiumEvent.date1` | CondominiumEvent.Date1 |  |
| `Data3` | `_mrv.condominiumEvent.date3` | CondominiumEvent.Date3 |  |
| `Data5` | `_mrv.condominiumEvent.date5` | CondominiumEvent.Date5 |  |
| `Datainiciovotacao` | `_mrv.condominiumEvent.votingStartTimestamp` | CondominiumEvent.VotingStartTimestamp |  |
| `inicioimplanta` | `_mrv.condominiumEvent.implementationStartDate` | CondominiumEvent.ImplementationStartDate |  |
| `telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `locale` | `_mrv.ftpFileImport.locale` | FtpFileImport.Locale |  |
| `Data2` | `_mrv.condominiumEvent.date2` | CondominiumEvent.Date2 |  |
| `Data4` | `_mrv.condominiumEvent.date4` | CondominiumEvent.Date4 |  |

### Jornada Síndico (AssistenciaTecnica)
`eventType` = `assistenciaTecnica.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `assistenciaTecnicaSindico` · evento AJO `MRV_FTP_Jor_Sindico`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `Cpf` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `e-mail` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `locale` | `_mrv.ftpFileImport.locale` | FtpFileImport.Locale |  |

### Jornada Whats - Auto-agendamento EC (AssistenciaTecnica)
`eventType` = `assistenciaTecnica.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `assistenciaTecnicaWhatsAutoAgendamentoEc` · evento AJO `MRV_FTP_Auto_Agend`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `Momento` | `_mrv.ftpFileImport.sendMoment` | FtpFileImport.SendMoment |  |
| `Email` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |

### Jornada Whats - NPS Profissional Atenção Síndico (AssistenciaTecnica)
`eventType` = `assistenciaTecnica.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `assistenciaTecnicaWhatsNpsProfissionalAtencaoSindico` · evento AJO `MRV_FTP_NPS_Prof_Aten_Sind`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Jornada WhatsApp Agendamento VA (AssistenciaTecnica)
`eventType` = `assistenciaTecnica.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `assistenciaTecnicaWhatsappAgendamentoVa` · evento AJO `MRV_FTP_Agendamento_VA`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `Marca` | `_mrv.earlyInspectionDetails.brand` | EarlyInspectionDetails.Brand |  |

### Jornada WhatsApp Pesquisa Implantação - Chave (AssistenciaTecnica)
`eventType` = `assistenciaTecnica.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `assistenciaTecnicaWhatsappPesquisaImplantacaoChave` · evento AJO `MRV_FTP_Pesquisa_Imp_Chave`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Jornada WhatsApp Pesquisa Implantação - Chave Pesquisa (AssistenciaTecnica)
`eventType` = `assistenciaTecnica.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `assistenciaTecnicaWhatsappPesquisaImplantacaoChavePesquisa` · evento AJO `MRV_FTP_Pesq_Implant`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Jornada WhatsApp VA Indisponível (AssistenciaTecnica)
`eventType` = `assistenciaTecnica.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `assistenciaTecnicaWhatsappVaIndisponivel` · evento AJO `MRV_FTP_Whats_VA_Indisponivel`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Jornada WhatsApp VA Não Aptos (AssistenciaTecnica)
`eventType` = `assistenciaTecnica.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `assistenciaTecnicaWhatsappVaNaoAptos` · evento AJO `MRV_FTP_VA_Nao_Aptos`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Jornada WhatsApp VA Reagendamento (AssistenciaTecnica)
`eventType` = `assistenciaTecnica.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `assistenciaTecnicaWhatsappVaReagendamento` · evento AJO `MRV_FTP_VA_Reagendamento`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Jornada WhatsApp VA Reparos Finalizados (AssistenciaTecnica)
`eventType` = `assistenciaTecnica.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `assistenciaTecnicaWhatsappVaReparosFinalizados` · evento AJO `MRV_FTP_VA_Reparos_Final`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Jornada e-mail Agendamento VA (AssistenciaTecnica)
`eventType` = `assistenciaTecnica.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `assistenciaTecnicaEMailAgendamentoVa` · evento AJO `MRV_FTP_Email_Agend_VA`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `cpf` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `e-mail` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `tempo` | `_mrv.earlyInspectionDetails.elapsedTime` | EarlyInspectionDetails.ElapsedTime |  |
| `status_unidade` | `_mrv.earlyInspectionDetails.inspectionStatus` | EarlyInspectionDetails.InspectionStatus |  |

### Whats - Agendamento Entrega Chaves (AssistenciaTecnica)
`eventType` = `assistenciaTecnica.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `assistenciaTecnicaWhatsAgendamentoEntregaChaves` · evento AJO `MRV_FTP_Agend_Entreg_Chaves`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Whats - Assembleia (AssistenciaTecnica)
`eventType` = `assistenciaTecnica.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `assistenciaTecnicaWhatsAssembleia` · evento AJO `MRV_FTP_Assembleia`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Whats - Envio Chaves Fechadura Eletrônica (AssistenciaTecnica)
`eventType` = `assistenciaTecnica.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `assistenciaTecnicaWhatsEnvioChavesFechaduraEletronica` · evento AJO `MRV_FTP_Envio_Chaves_Fech`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |


## BU: Cobranca

### Antecipar_Wpp2 (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaAnteciparWpp2` · evento AJO `MRV_FTP_Antecipar_Wpp2`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Cobranca - Wedo - SMS (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaCobrancaWedoSms` · evento AJO `MRV_FTP_Cobranca_Wedo`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `Mensagem` | `_mrv.contractBillingEvent.messageBody` | ContractBillingEvent.MessageBody |  |
| `Locale` | `_mrv.ftpFileImport.locale` | FtpFileImport.Locale |  |
| `data_criacao` | `_mrv.ftpFileImport.recordCreatedDate` | FtpFileImport.RecordCreatedDate |  |

### JB_FTP_WPP_Cobranca (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaJbFtpWppCobranca` · evento AJO `MRV_FTP_WPP_Cobranca`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### JB_Juros - Primeira Cobrança (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaJbJurosPrimeiraCobranca` · evento AJO `MRV_FTP_Juros_Prim_cobranca`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### JB_Wedo_Email (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaJbWedoEmail` · evento AJO `MRV_FTP_Cob_Wedo_Email`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Origem` | `_mrv.sourceContext.sourceJobName` | SourceContext.SourceJobName |  |
| `Sistema` | `_mrv.sourceContext.sourceJobName` | SourceContext.SourceJobName |  |
| `Descricao_Residencial` | `_mrv.propertyContext.residentialDescription` | PropertyContext.ResidentialDescription | 🆕 |
| `Codigo_Cliente` | `_mrv.contractBillingEvent.sapClientId` | ContractBillingEvent.SapClientId |  |
| `Nome_Completo` | `person.name.fullName` | XdmPersonName.FullName |  |
| `Endereco_Cliente` | `_mrv.customerAddress.street` | CustomerAddress.Street | 🆕 |
| `Bairro_Cliente` | `_mrv.customerAddress.neighborhood` | CustomerAddress.Neighborhood | 🆕 |
| `Cidade_Cliente` | `_mrv.customerAddress.city` | CustomerAddress.City | 🆕 |
| `Estado_Cliente` | `_mrv.customerAddress.state` | CustomerAddress.State | 🆕 |
| `CEP_Cliente` | `_mrv.customerAddress.postalCode` | CustomerAddress.PostalCode | 🆕 |
| `Email_Cliente` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `Nome_Parcela` | `_mrv.contractBillingEvent.installmentName` | ContractBillingEvent.InstallmentName |  |
| `Identificador_Parcela` | `_mrv.contractBillingEvent.installmentId` | ContractBillingEvent.InstallmentId |  |
| `Vencimento_Parcela` | `_mrv.contractBillingEvent.dueDate` | ContractBillingEvent.DueDate |  |
| `Original_Parcela` | `_mrv.contractBillingEvent.installmentDetailsBlock` | ContractBillingEvent.InstallmentDetailsBlock |  |
| `Reajuste_Parcela` | `_mrv.contractBillingEvent.installmentDetailsBlock` | ContractBillingEvent.InstallmentDetailsBlock |  |
| `Parcela_Reajustada` | `_mrv.contractBillingEvent.installmentDetailsBlock` | ContractBillingEvent.InstallmentDetailsBlock |  |
| `CPF_CNPJ` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Residencial` | `_mrv.condominiumEvent.buildingName` | CondominiumEvent.BuildingName |  |
| `Mora_Parcela` | `_mrv.contractBillingEvent.installmentDetailsBlock` | ContractBillingEvent.InstallmentDetailsBlock |  |
| `Multa_Parcela` | `_mrv.contractBillingEvent.installmentDetailsBlock` | ContractBillingEvent.InstallmentDetailsBlock |  |
| `Valor_Total` | `_mrv.contractBillingEvent.installmentDetailsBlock` | ContractBillingEvent.InstallmentDetailsBlock |  |
| `Desconto_Parcela` | `_mrv.contractBillingEvent.installmentDetailsBlock` | ContractBillingEvent.InstallmentDetailsBlock |  |
| `Divida_Parcela` | `_mrv.contractBillingEvent.installmentDetailsBlock` | ContractBillingEvent.InstallmentDetailsBlock |  |
| `Original_Contrato` | `_mrv.contractBillingEvent.contractDebtBlock` | ContractBillingEvent.ContractDebtBlock |  |
| `Reajuste_Contrato` | `_mrv.contractBillingEvent.contractDebtBlock` | ContractBillingEvent.ContractDebtBlock |  |
| `Valor_Reajustado_Contrato` | `_mrv.contractBillingEvent.contractDebtBlock` | ContractBillingEvent.ContractDebtBlock |  |
| `Mora_Contrato` | `_mrv.contractBillingEvent.contractDebtBlock` | ContractBillingEvent.ContractDebtBlock |  |
| `Multa_Contrato` | `_mrv.contractBillingEvent.contractDebtBlock` | ContractBillingEvent.ContractDebtBlock |  |
| `Multa_Mora_Contrato` | `_mrv.contractBillingEvent.contractDebtBlock` | ContractBillingEvent.ContractDebtBlock |  |
| `Desconto_Contrato` | `_mrv.contractBillingEvent.contractDebtBlock` | ContractBillingEvent.ContractDebtBlock |  |
| `Divida_Atualizada_Contrato` | `_mrv.contractBillingEvent.contractDebtBlock` | ContractBillingEvent.ContractDebtBlock |  |
| `VI_Atualizado` | `_mrv.contractBillingEvent.openAmountWithAdjustment` | ContractBillingEvent.OpenAmountWithAdjustment |  |
| `ID_Mensagem_Email` | `_mrv.contractBillingEvent.emailMessageId` | ContractBillingEvent.EmailMessageId |  |
| `Prev_Assinat_Banco` | `_mrv.contractBillingEvent.bankSignatureForecastDate` | ContractBillingEvent.BankSignatureForecastDate | 🆕 |
| `Previsao_Chaves` | `_mrv.contractBillingEvent.keysDeliveryForecastDate` | ContractBillingEvent.KeysDeliveryForecastDate | 🆕 |
| `Nome_Cliente` | `person.name.fullName` | XdmPersonName.FullName |  |
| `Contrato` | `_mrv.contractBillingEvent.contractId` | ContractBillingEvent.ContractId |  |
| `Safra_Parcela` | `_mrv.contractBillingEvent.vintage` | ContractBillingEvent.Vintage |  |

### Jornada Cobrança Luggo (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaCobrancaLuggo` · evento AJO `MRV_FTP_Cobranca_Luggo`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Locale` | `_mrv.ftpFileImport.locale` | FtpFileImport.Locale |  |
| `Adicionado_a_base` | `_mrv.ftpFileImport.recordCreatedDate` | FtpFileImport.RecordCreatedDate |  |
| `Dt_pagamento` | `_mrv.contractBillingEvent.paymentDate` | ContractBillingEvent.PaymentDate |  |
| `Valor_pago` | `_mrv.contractBillingEvent.paidAmount` | ContractBillingEvent.PaidAmount |  |
| `Status` | `_mrv.contractBillingEvent.invoiceStatus` | ContractBillingEvent.InvoiceStatus |  |
| `Indicador_de_cobranca` | `_mrv.contractBillingEvent.collectionIndicator` | ContractBillingEvent.CollectionIndicator | 🆕 |
| `Motivo_impedimento` | `_mrv.contractBillingEvent.impedimentReason` | ContractBillingEvent.ImpedimentReason | 🆕 |
| `Abertura_sinistro` | `_mrv.contractBillingEvent.claimOpenedIndicator` | ContractBillingEvent.ClaimOpenedIndicator | 🆕 |
| `Tipo` | `_mrv.ftpFileImport.recordType` | FtpFileImport.RecordType |  |
| `Contrato` | `_mrv.contractBillingEvent.contractId` | ContractBillingEvent.ContractId |  |
| `Email` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `Celular` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `Cliente` | `person.name.fullName` | XdmPersonName.FullName |  |
| `Residencial` | `_mrv.condominiumEvent.buildingName` | CondominiumEvent.BuildingName |  |
| `Parcela_aluguel` | `_mrv.contractBillingEvent.rentInstallmentAmount` | ContractBillingEvent.RentInstallmentAmount |  |
| `Vencimento` | `_mrv.contractBillingEvent.dueDate` | ContractBillingEvent.DueDate |  |
| `Valor_aberto_c_reajuste` | `_mrv.contractBillingEvent.openAmountWithAdjustment` | ContractBillingEvent.OpenAmountWithAdjustment |  |
| `Dias_de_atraso` | `_mrv.contractBillingEvent.lateDays` | ContractBillingEvent.LateDays |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `mes` | `_mrv.contractBillingEvent.referenceMonth` | ContractBillingEvent.ReferenceMonth | 🆕 |
| `dt_sms` | `_mrv.contractBillingEvent.smsDate` | ContractBillingEvent.SmsDate | 🆕 |
| `Tipo_Contrato` | `_mrv.contractBillingEvent.contractType` | ContractBillingEvent.ContractType | 🆕 |

### Jornada FTP lembrete juros de obra (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaFtpLembreteJurosDeObra` · evento AJO `MRV_FTP_Lembrete_Jur_Obra`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `cpf` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `e-mail` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `Valor` | `_mrv.contractBillingEvent.installmentAmount` | ContractBillingEvent.InstallmentAmount |  |
| `Vencimento_parcela` | `_mrv.contractBillingEvent.dueDate` | ContractBillingEvent.DueDate |  |
| `banco` | `_mrv.contractBillingEvent.bankName` | ContractBillingEvent.BankName |  |
| `site` | `_mrv.contractBillingEvent.bankSiteUrl` | ContractBillingEvent.BankSiteUrl |  |

### Jornada Pendência de Aditivo (Copy) (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaPendenciaDeAditivoCopy` · evento AJO `MRV_FTP_Pend_Aditivo`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `cpf` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `nome do cliente` | `person.name.fullName` | XdmPersonName.FullName |  |
| `email` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `locale` | `_mrv.ftpFileImport.locale` | FtpFileImport.Locale |  |
| `Tipo` | `_mrv.ftpFileImport.recordType` | FtpFileImport.RecordType |  |

### Jornada Wpp - Reneg_Antecipacao_Maio2025 (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaWppRenegAntecipacaoMaio2025` · evento AJO `MRV_FTP_Reneg_Antecip_Maio2025`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Jornada Wpp Aditivo (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaWppAditivo` · evento AJO `MRV_FTP_Wpp_Aditivo`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Jornada de E-mail - Comunicado Renegociação (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaDeEMailComunicadoRenegociacao` · evento AJO `MRV_FTP_Comunic_Reneg`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `e-mail` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `locale` | `_mrv.ftpFileImport.locale` | FtpFileImport.Locale |  |
| `celular` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |

### Jornada_Whats - Confirmacao Negociacao (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaWhatsConfirmacaoNegociacao` · evento AJO `MRV_FTP_Whats_Confirm_Negoc`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Jornada_Whats - Notif Reintegra Posse (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaWhatsNotifReintegraPosse` · evento AJO `MRV_FTP_Whats_Notif_Reint_Poss`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Jornada_Whats_Campanha_Pague5_Ganhe1 (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaWhatsCampanhaPague5Ganhe1` · evento AJO `MRV_FTP_Whats_Pague5_Ganhe1`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Jornada_Whats_Notif_Aliena_Fidu (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaWhatsNotifAlienaFidu` · evento AJO `MRV_FTP_Notif_Alien_Fidu`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Jornada_Whats_Reneg_Entrada_Multa (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaWhatsRenegEntradaMulta` · evento AJO `MRV_FTP_Reneg_Entrada_Multa`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Jornada_Wpp_Reneg_SemJuros_Marco2025 (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaWppRenegSemjurosMarco2025` · evento AJO `MRV_FTP_Reneg_SemJuros_Mar2025`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Whats - Abatimento Negociacao (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaWhatsAbatimentoNegociacao` · evento AJO `MRV_FTP_Abatimento_Negoc`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Whats - Antecipação (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaWhatsAntecipacao` · evento AJO `MRV_FTP_Whats_Antecipacao`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Whats - Antecipação Premiada (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaWhatsAntecipacaoPremiada` · evento AJO `MRV_FTP_Whats_Antecipacao_Prem`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `Desconto` | `_mrv.contractBillingEvent.discountAmount` | ContractBillingEvent.DiscountAmount |  |
| `Prazo` | `_mrv.contractBillingEvent.deadline` | ContractBillingEvent.Deadline |  |

### Whats - Ativo Zendesk (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaWhatsAtivoZendesk` · evento AJO `MRV_FTP_Ativo_Zendesk`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `Cpf` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Whats - Campanha Final Ano (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaWhatsCampanhaFinalAno` · evento AJO `MRV_FTP_Campanha_Final_Ano`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Whats - Cob Notificação Judicial (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaWhatsCobNotificacaoJudicial` · evento AJO `MRV_FTP_Cob_Notif_Judicial`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Whats - Regularização PreDistrato (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaWhatsRegularizacaoPredistrato` · evento AJO `MRV_FTP_Regu_PreDist`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Whats - Renegociação Fev (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaWhatsRenegociacaoFev` · evento AJO `MRV_FTP_Cobranca_Reneg_Fev`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### WhatsApp_Renegociar_2023 (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaWhatsappRenegociar2023` · evento AJO `MRV_FTP_Renegociar_2023`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Wpp -  Renegociação (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaWppRenegociacao` · evento AJO `MRV_FTP_WPP_Reneg`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Wpp - Cobrança Correção (Cobranca)
`eventType` = `cobranca.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `cobrancaWppCobrancaCorrecao` · evento AJO `MRV_FTP_WPP_Cobranca_Correcao`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |


## BU: MarketingCredito

### Jornada Whats - Troca de Plano (MarketingCredito)
`eventType` = `marketingCredito.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `marketingCreditoWhatsTrocaDePlano` · evento AJO `MRV_FTP_Troca_Plano`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `Tipo` | `_mrv.ftpFileImport.recordType` | FtpFileImport.RecordType |  |

### Whats Contrato Pendente Assinatura (MarketingCredito)
`eventType` = `marketingCredito.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `marketingCreditoWhatsContratoPendenteAssinatura` · evento AJO `MRV_FTP_Contrato_Pend_Assin`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `Momento` | `_mrv.ftpFileImport.sendMoment` | FtpFileImport.SendMoment |  |
| `nome_empreendimento` | `_mrv.condominiumEvent.buildingName` | CondominiumEvent.BuildingName |  |
| `nome_correspondente` | `_mrv.productOffer.correspondentName` | ProductOffer.CorrespondentName |  |
| `telefone_correspondente` | `_mrv.productOffer.correspondentPhone` | ProductOffer.CorrespondentPhone |  |


## BU: Marketplace

### Disparo Divulgacao Armários - WPP (Marketplace)
`eventType` = `marketplace.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `marketplaceDisparoDivulgacaoArmariosWpp` · evento AJO `MRV_FTP_Disparo_Divulg_Armario`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Primeiro_nome` | `person.name.firstName` | XdmPersonName.FirstName |  |
| `empreendimento` | `_mrv.condominiumEvent.buildingName` | CondominiumEvent.BuildingName |  |
| `Celular` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Disparo Ofertas em parceiros - WPP (Marketplace)
`eventType` = `marketplace.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `marketplaceDisparoOfertasEmParceirosWpp` · evento AJO `MRV_FTP_Disp_Oferta_Parc`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Celular` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `Primeiro_nome` | `person.name.firstName` | XdmPersonName.FirstName |  |
| `parceiro` | `_mrv.productOffer.partnerName` | ProductOffer.PartnerName |  |
| `Link` | `_mrv.productOffer.offerLink` | ProductOffer.OfferLink |  |
| `Desconto` | `_mrv.productOffer.discountAmount` | ProductOffer.DiscountAmount |  |

### Disparo relancamento - wpp (Marketplace)
`eventType` = `marketplace.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `marketplaceDisparoRelancamentoWpp` · evento AJO `MRV_FTP_Disp_Relancamento`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Empreendimento` | `_mrv.condominiumEvent.buildingName` | CondominiumEvent.BuildingName |  |
| `data_evento` | `_mrv.physicalEvent.eventDate` | PhysicalEvent.EventDate |  |
| `horario_evento` | `_mrv.physicalEvent.eventTime` | PhysicalEvent.EventTime |  |
| `endereco_evento` | `_mrv.physicalEvent.eventAddress` | PhysicalEvent.EventAddress |  |
| `Celular` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Disparo_Servico_Morador (Marketplace)
`eventType` = `marketplace.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `marketplaceDisparoServicoMorador` · evento AJO `MRV_FTP_Disparo_Serv_Morador`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Celular` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `Primeiro_nome` | `person.name.firstName` | XdmPersonName.FirstName |  |
| `servico` | `_mrv.productOffer.serviceName` | ProductOffer.ServiceName |  |
| `Empreendimento` | `_mrv.condominiumEvent.buildingName` | CondominiumEvent.BuildingName |  |
| `Link` | `_mrv.productOffer.offerLink` | ProductOffer.OfferLink |  |
| `Consultor` | `_mrv.productOffer.consultantName` | ProductOffer.ConsultantName |  |

### JR_aquecimento_lancamentos (Marketplace)
`eventType` = `marketplace.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `marketplaceJrAquecimentoLancamentos` · evento AJO `MRV_FTP_Aquecimento_Lanc`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Email` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `Primeiro_nome` | `person.name.firstName` | XdmPersonName.FirstName |  |
| `Celular` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `Empreendimento` | `_mrv.condominiumEvent.buildingName` | CondominiumEvent.BuildingName |  |
| `Regional` | `_mrv.physicalEvent.region` | PhysicalEvent.Region |  |
| `Data_evento` | `_mrv.physicalEvent.eventDate` | PhysicalEvent.EventDate |  |
| `Horario_evento` | `_mrv.physicalEvent.eventTime` | PhysicalEvent.EventTime |  |
| `Endereco_evento` | `_mrv.physicalEvent.eventAddress` | PhysicalEvent.EventAddress |  |
| `Numero_parcelas` | `_mrv.productOffer.installmentsQuantity` | ProductOffer.InstallmentsQuantity |  |
| `Locale` | `_mrv.ftpFileImport.locale` | FtpFileImport.Locale |  |
| `data_inicio` | `_mrv.physicalEvent.campaignStartDate` | PhysicalEvent.CampaignStartDate |  |
| `Kit_Acabamento` | `_mrv.productOffer.productKit` | ProductOffer.ProductKit |  |

### JR_lancamento_automatizacao_corretor (Marketplace)
`eventType` = `marketplace.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `marketplaceJrLancamentoAutomatizacaoCorretor` · evento AJO `MRV_FTP_lancamento_Aut_Corr`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Email` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `Primeiro_nome` | `person.name.firstName` | XdmPersonName.FirstName |  |
| `Celular` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `Empreendimento` | `_mrv.condominiumEvent.buildingName` | CondominiumEvent.BuildingName |  |
| `Regional` | `_mrv.physicalEvent.region` | PhysicalEvent.Region |  |
| `Data_evento` | `_mrv.physicalEvent.eventDate` | PhysicalEvent.EventDate |  |
| `Horario_evento` | `_mrv.physicalEvent.eventTime` | PhysicalEvent.EventTime |  |
| `Endereco_evento` | `_mrv.physicalEvent.eventAddress` | PhysicalEvent.EventAddress |  |
| `Numero_parcelas` | `_mrv.productOffer.installmentsQuantity` | ProductOffer.InstallmentsQuantity |  |
| `Locale` | `_mrv.ftpFileImport.locale` | FtpFileImport.Locale |  |
| `data_inicio` | `_mrv.physicalEvent.campaignStartDate` | PhysicalEvent.CampaignStartDate |  |
| `Kit_Acabamento` | `_mrv.productOffer.productKit` | ProductOffer.ProductKit |  |

### JR_semi_automatizacao_Lancamento (Marketplace)
`eventType` = `marketplace.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `marketplaceJrSemiAutomatizacaoLancamento` · evento AJO `MRV_FTP_Semi_Aut_Lancamento`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Email` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `Primeiro_nome` | `person.name.firstName` | XdmPersonName.FirstName |  |
| `Celular` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `Empreendimento` | `_mrv.condominiumEvent.buildingName` | CondominiumEvent.BuildingName |  |
| `Regional` | `_mrv.physicalEvent.region` | PhysicalEvent.Region |  |
| `Data_evento` | `_mrv.physicalEvent.eventDate` | PhysicalEvent.EventDate |  |
| `Horario_evento` | `_mrv.physicalEvent.eventTime` | PhysicalEvent.EventTime |  |
| `Endereco_evento` | `_mrv.physicalEvent.eventAddress` | PhysicalEvent.EventAddress |  |
| `Numero_parcelas` | `_mrv.productOffer.installmentsQuantity` | ProductOffer.InstallmentsQuantity |  |
| `Locale` | `_mrv.ftpFileImport.locale` | FtpFileImport.Locale |  |
| `data_inicio` | `_mrv.physicalEvent.campaignStartDate` | PhysicalEvent.CampaignStartDate |  |
| `Kit_Acabamento` | `_mrv.productOffer.productKit` | ProductOffer.ProductKit |  |

### Jornada Prazo Encerrando_7dIas (Marketplace)
`eventType` = `marketplace.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `marketplacePrazoEncerrando7dias` · evento AJO `MRV_FTP_Prazo_Encerrando_7d`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `Primeiro_nome` | `person.name.firstName` | XdmPersonName.FirstName |  |
| `Empreendimento` | `_mrv.condominiumEvent.buildingName` | CondominiumEvent.BuildingName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Celular` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `Email` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `Classificação` | `_mrv.customerClassification` | CustomerClassification.CustomerClassification |  |
| `Locale` | `_mrv.ftpFileImport.locale` | FtpFileImport.Locale |  |
| `Prazo_encerrando` | `_mrv.deadlineApproaching` | DeadlineApproaching.DeadlineApproaching |  |


## BU: Relacionamento

### JB_Convocacao_Eleição_PA (Relacionamento)
`eventType` = `relacionamento.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `relacionamentoJbConvocacaoEleicaoPa` · evento AJO `MRV_FTP_Convoc_Elei_PA`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Email` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `Parceiro` | `_mrv.condominiumEvent.partnerName` | CondominiumEvent.PartnerName |  |
| `Dia` | `_mrv.condominiumEvent.electionDate` | CondominiumEvent.ElectionDate |  |

### Jornada CRI v2 (Relacionamento)
`eventType` = `relacionamento.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `relacionamentoCriV2` · evento AJO `MRV_FTP_Jor_CRI_V2`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Contrato` | `_mrv.contractBillingEvent.contractId` | ContractBillingEvent.ContractId |  |
| `Celular` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `Locale` | `_mrv.ftpFileImport.locale` | FtpFileImport.Locale |  |
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `Data_Venda` | `_mrv.contractBillingEvent.saleDate` | ContractBillingEvent.SaleDate |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `E-mail` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `CNPJ` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Securitizadora` | `_mrv.contractBillingEvent.securitizer` | ContractBillingEvent.Securitizer |  |
| `Marca` | `_mrv.earlyInspectionDetails.brand` | EarlyInspectionDetails.Brand |  |
| `Portal` | `_mrv.contractBillingEvent.portalUrl` | ContractBillingEvent.PortalUrl |  |

### Jornada Patrimonio - Comissão afetação (Relacionamento)
`eventType` = `relacionamento.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `relacionamentoPatrimonioComissaoAfetacao` · evento AJO `MRV_FTP_Patrim_Comis_Afet`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Empreendimento` | `_mrv.serviceCase.nomeEmpreendimento` | ServiceCase.NomeEmpreendimento |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `E-mail` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `Representante` | `_mrv.productOffer.representativeName` | ProductOffer.RepresentativeName |  |
| `Locale` | `_mrv.ftpFileImport.locale` | FtpFileImport.Locale |  |
| `Obra` | `_mrv.propertyContext.constructionName` | PropertyContext.ConstructionName | 🆕 |

### Jornada Reclame Aqui (Relacionamento)
`eventType` = `relacionamento.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `relacionamentoReclameAqui` · evento AJO `MRV_FTP_Rel_Recl_Aqui`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `Email` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `Link` | `_mrv.serviceCase.responseLink` | ServiceCase.ResponseLink |  |
| `Celular` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `Nome_SMS` | `_mrv.serviceCase.smsDisplayName` | ServiceCase.SmsDisplayName |  |
| `locale` | `_mrv.ftpFileImport.locale` | FtpFileImport.Locale |  |

### Jornada WhatsApp - Direcionamento CCA (Relacionamento)
`eventType` = `relacionamento.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `relacionamentoWhatsappDirecionamentoCca` · evento AJO `MRV_FTP_Direcionamento_CCA`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Cliente` | `_mrv.productOffer.clientCCA` | ProductOffer.ClientCCA |  |
| `Empreendimento` | `_mrv.serviceCase.nomeEmpreendimento` | ServiceCase.NomeEmpreendimento |  |
| `Nome_CCA` | `_mrv.productOffer.nameCCA` | ProductOffer.NameCCA |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `Email` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Celular` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Jornada WhatsApp - Disparo Pesquisa Reclame Aqui (Relacionamento)
`eventType` = `relacionamento.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `relacionamentoWhatsappDisparoPesquisaReclameAqui` · evento AJO `MRV_FTP_Disp_Pesq_Recl_Aqui`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Celular` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `Link` | `_mrv.serviceCase.responseLink` | ServiceCase.ResponseLink |  |
| `Tipo` | `_mrv.serviceCase.surveyType` | ServiceCase.SurveyType |  |
| `Nome_parceiro` | `_mrv.serviceCase.partnerName` | ServiceCase.PartnerName |  |
| `Site_parceiro` | `_mrv.serviceCase.partnerSite` | ServiceCase.PartnerSite |  |
| `cupom` | `_mrv.serviceCase.rewardCoupon` | ServiceCase.RewardCoupon |  |

### Reagendamento Visita (Relacionamento)
`eventType` = `relacionamento.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `relacionamentoReagendamentoVisita` · evento AJO `MRV_FTP_Reagend_Visita`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Visita à Obra_v2 (Relacionamento)
`eventType` = `relacionamento.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `relacionamentoVisitaAObraV2` · evento AJO `MRV_FTP_Visita_Obra_V2`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Nome_cliente` | `person.name.fullName` | XdmPersonName.FullName |  |
| `Email` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `Locale` | `_mrv.ftpFileImport.locale` | FtpFileImport.Locale |  |
| `Empreendimento` | `_mrv.serviceCase.nomeEmpreendimento` | ServiceCase.NomeEmpreendimento |  |
| `Bloco` | `_mrv.propertyContext.block` | PropertyContext.Block | 🆕 |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `Data_evento` | `_mrv.physicalEvent.eventDate` | PhysicalEvent.EventDate |  |
| `horario_evento` | `_mrv.physicalEvent.eventTime` | PhysicalEvent.EventTime |  |
| `Dia` | `_mrv.condominiumEvent.electionDate` | CondominiumEvent.ElectionDate |  |
| `Mes` | `_mrv.contractBillingEvent.referenceMonth` | ContractBillingEvent.ReferenceMonth | 🆕 |
| `data_criacao` | `_mrv.ftpFileImport.recordCreatedDate` | FtpFileImport.RecordCreatedDate |  |

### Whats - Parcelamento ITBI e Registro (Relacionamento)
`eventType` = `relacionamento.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `relacionamentoWhatsParcelamentoItbiERegistro` · evento AJO `MRV_FTP_Parcel_ITBI_Reg`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### Whats - Premio Reclame (Relacionamento)
`eventType` = `relacionamento.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `relacionamentoWhatsPremioReclame` · evento AJO `MRV_FTP_Premio_Reclame`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |

### WhatsApp_Disparo_Pesquisa_NPS (Relacionamento)
`eventType` = `relacionamento.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `relacionamentoWhatsappDisparoPesquisaNps` · evento AJO `MRV_FTP_Disp_Pesq_NPS`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Celular` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `Link` | `_mrv.serviceCase.responseLink` | ServiceCase.ResponseLink |  |
| `Empreendimento` | `_mrv.serviceCase.nomeEmpreendimento` | ServiceCase.NomeEmpreendimento |  |
| `Campanha` | `_mrv.serviceCase.surveyCampaign` | ServiceCase.SurveyCampaign |  |


## BU: Sensia

### Boas vindas - Nova Jornada Sensia_FTP (Sensia)
`eventType` = `sensia.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `sensiaBoasVindasNovaSensiaFtp` · evento AJO `MRV_FTP_Sen_BoasVindas`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `nome_cliente` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Email` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `Celular` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `Tipo` | `_mrv.ftpFileImport.recordType` | FtpFileImport.RecordType |  |
| `Ganho_Pre_Ganho` | `_mrv.propertyContext.saleStatus` | PropertyContext.SaleStatus | 🆕 |
| `Liberacao_SAP` | `_mrv.constructionStart.sapReleased` | ConstructionStart.SapReleased |  |
| `Locale` | `_mrv.ftpFileImport.locale` | FtpFileImport.Locale |  |
| `Tipo_Contrato` | `_mrv.contractBillingEvent.contractType` | ContractBillingEvent.ContractType | 🆕 |
| `ID_Contrato_Sap` | `_mrv.contractBillingEvent.contractId` | ContractBillingEvent.ContractId |  |
| `Empreendimento` | `⚠️ SEM DESTINO (sem Lookup; ver serviceCase.nomeEmpreendimento / earlyInspectionDetails.property)` | -."⚠️ SEM DESTINO (sem Lookup; ver serviceCase.nomeEmpreendimento / earlyInspectionDetails.property)" |  |
| `Personalização` | `_mrv.constructionStart.customizationAvailable` | ConstructionStart.CustomizationAvailable |  |
| `Inicio Obra` | `_mrv.constructionStart.constructionStartDate` | ConstructionStart.ConstructionStartDate |  |

### Eleicao_Comissão_de_PA (Sensia)
`eventType` = `sensia.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `sensiaEleicaoComissaoDePa` · evento AJO `MRV_FTP_Sen_Eleic_Comis_PA`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Email` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `Parceiro` | `_mrv.condominiumEvent.partnerName` | CondominiumEvent.PartnerName |  |
| `Dia` | `_mrv.condominiumEvent.electionDate` | CondominiumEvent.ElectionDate |  |

### Implantação cond. Jornada (Copy) (Sensia)
`eventType` = `sensia.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `sensiaImplantacaoCondCopy` · evento AJO `MRV_FTP_Sen_Implant_Cond`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `cpf` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `e-mail` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `link` | `_mrv.condominiumEvent.actionLink` | CondominiumEvent.ActionLink |  |
| `prazo candidatura` | `_mrv.condominiumEvent.candidacyDeadline` | CondominiumEvent.CandidacyDeadline |  |
| `video_candidato` | `_mrv.condominiumEvent.candidateVideoLink` | CondominiumEvent.CandidateVideoLink |  |
| `inicio_votacao` | `_mrv.condominiumEvent.votingStartDate` | CondominiumEvent.VotingStartDate |  |
| `fim_votacao` | `_mrv.condominiumEvent.votingEndDate` | CondominiumEvent.VotingEndDate |  |
| `disponibilizacao_conteudo` | `_mrv.condominiumEvent.contentAvailabilityDate` | CondominiumEvent.ContentAvailabilityDate |  |
| `Data1` | `_mrv.condominiumEvent.date1` | CondominiumEvent.Date1 |  |
| `Data3` | `_mrv.condominiumEvent.date3` | CondominiumEvent.Date3 |  |
| `Data5` | `_mrv.condominiumEvent.date5` | CondominiumEvent.Date5 |  |
| `Datainiciovotacao` | `_mrv.condominiumEvent.votingStartTimestamp` | CondominiumEvent.VotingStartTimestamp |  |
| `telefone` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `locale` | `_mrv.ftpFileImport.locale` | FtpFileImport.Locale |  |
| `inicioimplanta` | `_mrv.condominiumEvent.implementationStartDate` | CondominiumEvent.ImplementationStartDate |  |
| `Data4` | `_mrv.condominiumEvent.date4` | CondominiumEvent.Date4 |  |
| `Data2` | `_mrv.condominiumEvent.date2` | CondominiumEvent.Date2 |  |

### JB_Wedo_Email (Sensia)
`eventType` = `sensia.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `sensiaJbWedoEmail` · evento AJO `MRV_FTP_Sen_Wedo_Email`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Origem` | `_mrv.sourceContext.sourceJobName` | SourceContext.SourceJobName |  |
| `Sistema` | `_mrv.sourceContext.sourceJobName` | SourceContext.SourceJobName |  |
| `Descricao_Residencial` | `_mrv.propertyContext.residentialDescription` | PropertyContext.ResidentialDescription | 🆕 |
| `Codigo_Cliente` | `_mrv.contractBillingEvent.sapClientId` | ContractBillingEvent.SapClientId |  |
| `Nome_Completo` | `person.name.fullName` | XdmPersonName.FullName |  |
| `Endereco_Cliente` | `_mrv.customerAddress.street` | CustomerAddress.Street | 🆕 |
| `Bairro_Cliente` | `_mrv.customerAddress.neighborhood` | CustomerAddress.Neighborhood | 🆕 |
| `Cidade_Cliente` | `_mrv.customerAddress.city` | CustomerAddress.City | 🆕 |
| `Estado_Cliente` | `_mrv.customerAddress.state` | CustomerAddress.State | 🆕 |
| `CEP_Cliente` | `_mrv.customerAddress.postalCode` | CustomerAddress.PostalCode | 🆕 |
| `Email_Cliente` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `Nome_Parcela` | `_mrv.contractBillingEvent.installmentName` | ContractBillingEvent.InstallmentName |  |
| `Identificador_Parcela` | `_mrv.contractBillingEvent.installmentId` | ContractBillingEvent.InstallmentId |  |
| `Vencimento_Parcela` | `_mrv.contractBillingEvent.dueDate` | ContractBillingEvent.DueDate |  |
| `Original_Parcela` | `_mrv.contractBillingEvent.installmentDetailsBlock` | ContractBillingEvent.InstallmentDetailsBlock |  |
| `Reajuste_Parcela` | `_mrv.contractBillingEvent.installmentDetailsBlock` | ContractBillingEvent.InstallmentDetailsBlock |  |
| `Parcela_Reajustada` | `_mrv.contractBillingEvent.installmentDetailsBlock` | ContractBillingEvent.InstallmentDetailsBlock |  |
| `CPF_CNPJ` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Residencial` | `_mrv.condominiumEvent.buildingName` | CondominiumEvent.BuildingName |  |
| `Mora_Parcela` | `_mrv.contractBillingEvent.installmentDetailsBlock` | ContractBillingEvent.InstallmentDetailsBlock |  |
| `Multa_Parcela` | `_mrv.contractBillingEvent.installmentDetailsBlock` | ContractBillingEvent.InstallmentDetailsBlock |  |
| `Valor_Total` | `_mrv.contractBillingEvent.installmentDetailsBlock` | ContractBillingEvent.InstallmentDetailsBlock |  |
| `Desconto_Parcela` | `_mrv.contractBillingEvent.installmentDetailsBlock` | ContractBillingEvent.InstallmentDetailsBlock |  |
| `Divida_Parcela` | `_mrv.contractBillingEvent.installmentDetailsBlock` | ContractBillingEvent.InstallmentDetailsBlock |  |
| `Original_Contrato` | `_mrv.contractBillingEvent.contractDebtBlock` | ContractBillingEvent.ContractDebtBlock |  |
| `Reajuste_Contrato` | `_mrv.contractBillingEvent.contractDebtBlock` | ContractBillingEvent.ContractDebtBlock |  |
| `Valor_Reajustado_Contrato` | `_mrv.contractBillingEvent.contractDebtBlock` | ContractBillingEvent.ContractDebtBlock |  |
| `Mora_Contrato` | `_mrv.contractBillingEvent.contractDebtBlock` | ContractBillingEvent.ContractDebtBlock |  |
| `Multa_Contrato` | `_mrv.contractBillingEvent.contractDebtBlock` | ContractBillingEvent.ContractDebtBlock |  |
| `Multa_Mora_Contrato` | `_mrv.contractBillingEvent.contractDebtBlock` | ContractBillingEvent.ContractDebtBlock |  |
| `Desconto_Contrato` | `_mrv.contractBillingEvent.contractDebtBlock` | ContractBillingEvent.ContractDebtBlock |  |
| `Divida_Atualizada_Contrato` | `_mrv.contractBillingEvent.contractDebtBlock` | ContractBillingEvent.ContractDebtBlock |  |
| `VI_Atualizado` | `_mrv.contractBillingEvent.openAmountWithAdjustment` | ContractBillingEvent.OpenAmountWithAdjustment |  |
| `ID_Mensagem_Email` | `_mrv.contractBillingEvent.emailMessageId` | ContractBillingEvent.EmailMessageId |  |
| `Prev_Assinat_Banco` | `_mrv.contractBillingEvent.bankSignatureForecastDate` | ContractBillingEvent.BankSignatureForecastDate | 🆕 |
| `Previsao_Chaves` | `_mrv.contractBillingEvent.keysDeliveryForecastDate` | ContractBillingEvent.KeysDeliveryForecastDate | 🆕 |
| `Nome_Cliente` | `person.name.fullName` | XdmPersonName.FullName |  |
| `Contrato` | `_mrv.contractBillingEvent.contractId` | ContractBillingEvent.ContractId |  |
| `Safra_Parcela` | `_mrv.contractBillingEvent.vintage` | ContractBillingEvent.Vintage |  |

### Jornada Convocação Eleição PA (Sensia)
`eventType` = `sensia.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `sensiaConvocacaoEleicaoPa` · evento AJO `MRV_FTP_Sen_Convoc_Elei_PA`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Email` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `Parceiro` | `_mrv.condominiumEvent.partnerName` | CondominiumEvent.PartnerName |  |
| `Dia` | `_mrv.condominiumEvent.electionDate` | CondominiumEvent.ElectionDate |  |

### Juros Obra (Sensia)
`eventType` = `sensia.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `sensiaJurosObra` · evento AJO `MRV_FTP_Sen_Juros_Obra`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `cpf` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `e-mail` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `momento_envio` | `_mrv.ftpFileImport.sendMoment` | FtpFileImport.SendMoment |  |

### Mia - Agendamento vistoria por e-mail (Sensia)
`eventType` = `sensia.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `sensiaMiaAgendamentoVistoriaPorEMail` · evento AJO `MRV_FTP_Sen_Mia_Agend_Vist`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome` | `person.name.fullName` | XdmPersonName.FullName |  |
| `e-mail` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `Cpf` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `tempo` | `_mrv.earlyInspectionDetails.elapsedTime` | EarlyInspectionDetails.ElapsedTime |  |
| `status_unidade` | `_mrv.earlyInspectionDetails.inspectionStatus` | EarlyInspectionDetails.InspectionStatus |  |

### Pós assinatura (Sensia)
`eventType` = `sensia.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `sensiaPosAssinatura` · evento AJO `MRV_FTP_Sen_Pos_Assinatura`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome do cliente` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Celular` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `locale` | `_mrv.ftpFileImport.locale` | FtpFileImport.Locale |  |
| `E-mail` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `Empreendimento` | `⚠️ SEM DESTINO (sem Lookup; ver serviceCase.nomeEmpreendimento / earlyInspectionDetails.property)` | -."⚠️ SEM DESTINO (sem Lookup; ver serviceCase.nomeEmpreendimento / earlyInspectionDetails.property)" |  |
| `Data Assinatura` | `_mrv.contractBillingEvent.contractSignatureDate` | ContractBillingEvent.ContractSignatureDate | 🆕 |
| `Plano Financiamento` | `_mrv.contractBillingEvent.financingPlan` | ContractBillingEvent.FinancingPlan | 🆕 |

### Renegociação (Sensia)
`eventType` = `sensia.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `sensiaRenegociacao` · evento AJO `MRV_FTP_Sen_Renegociacao`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Primeiro_nome` | `person.name.firstName` | XdmPersonName.FirstName |  |
| `Cliente` | `person.name.fullName` | XdmPersonName.FullName |  |
| `Celular` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `Email` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `Unidade` | `_mrv.propertyContext.unit` | PropertyContext.Unit | 🆕 |
| `parceiro` | `_mrv.condominiumEvent.partnerName` | CondominiumEvent.PartnerName |  |
| `Link` | `_mrv.condominiumEvent.actionLink` | CondominiumEvent.ActionLink |  |
| `Desconto` | `_mrv.productOffer.discountAmount` | ProductOffer.DiscountAmount |  |
| `DtPagamento` | `_mrv.contractBillingEvent.paymentDate` | ContractBillingEvent.PaymentDate |  |
| `Status` | `_mrv.contractBillingEvent.invoiceStatus` | ContractBillingEvent.InvoiceStatus |  |
| `Locale` | `_mrv.ftpFileImport.locale` | FtpFileImport.Locale |  |
| `Contrato` | `_mrv.contractBillingEvent.contractId` | ContractBillingEvent.ContractId |  |
| `DiasAtraso` | `_mrv.contractBillingEvent.lateDays` | ContractBillingEvent.LateDays |  |
| `ValorParcela` | `_mrv.contractBillingEvent.installmentAmount` | ContractBillingEvent.InstallmentAmount |  |
| `ValorPago` | `_mrv.contractBillingEvent.paidAmount` | ContractBillingEvent.PaidAmount |  |
| `ParcelaAluguel` | `_mrv.contractBillingEvent.rentInstallmentAmount` | ContractBillingEvent.RentInstallmentAmount |  |
| `Vencimento` | `_mrv.contractBillingEvent.dueDate` | ContractBillingEvent.DueDate |  |


## BU: Urba

### Jornada Financiamento Bancário - PRD (Urba)
`eventType` = `urba.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `urbaFinanciamentoBancario` · evento AJO `MRV_FTP_Fin_Bancario`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome_Cliente` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `CNPJ` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Email` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `Celular` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `Empreendimento` | `⚠️ SEM DESTINO (sem Lookup; ver serviceCase.nomeEmpreendimento / earlyInspectionDetails.property)` | -."⚠️ SEM DESTINO (sem Lookup; ver serviceCase.nomeEmpreendimento / earlyInspectionDetails.property)" |  |
| `Produto` | `_mrv.propertyContext.productName` | PropertyContext.ProductName | 🆕 |
| `Contrato` | `_mrv.contractBillingEvent.contractId` | ContractBillingEvent.ContractId |  |
| `Valorização` | `_mrv.propertyContext.appreciation` | PropertyContext.Appreciation | 🆕 |

### Jornada Início de Obra PRD (Urba)
`eventType` = `urba.ftpFileImport` · `_mrv.sourceContext.sourceEventType` = `urbaInicioDeObra` · evento AJO `MRV_FTP_Jor_Inicio_Obra`

| Coluna CSV | XDM path | Classe C# · Propriedade | Novo? |
|---|---|---|---|
| `Nome_Cliente` | `person.name.fullName` | XdmPersonName.FullName |  |
| `CPF` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `CNPJ` | `_mrv.identityEvents.cpfHash` | IdentityEvents.CpfHash |  |
| `Email` | `_mrv.identityEvents.email` | IdentityEvents.Email |  |
| `Celular` | `_mrv.identityEvents.phone` | IdentityEvents.Phone (+ mobilePhone/identityMap) |  |
| `Empreendimento` | `⚠️ SEM DESTINO (sem Lookup; ver serviceCase.nomeEmpreendimento / earlyInspectionDetails.property)` | -."⚠️ SEM DESTINO (sem Lookup; ver serviceCase.nomeEmpreendimento / earlyInspectionDetails.property)" |  |


---

*CSV plano (import): `mapeamento_csharp.csv` — BU;Jornada;sourceEventType;eventType;ColunaCSV;XDM_path;grupoXDM;classeC#;propriedadeC#;novo.*
