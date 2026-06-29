const allJornadas = [
  {
    "id": "assistenciaTecnicaAgendamentoParaVaDoSindico",
    "title": "Agendamento_para_VA_do_Sindico (AssistenciaTecnica)",
    "bu": "AssistenciaTecnica",
    "eventType": "assistenciaTecnica.ftpFileImport",
    "sourceEventType": "assistenciaTecnicaAgendamentoParaVaDoSindico",
    "sourceFileName": "`Agendamento_VA _Sindico_fields.json` (5 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "Email",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": "PK"
      },
      {
        "csvField": "CPF_CNPJ",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "CPF/CNPJ → cpfHash"
      },
      {
        "csvField": "Hora_visita",
        "aepField": "_mrv.earlyInspectionDetails.scheduledTime",
        "fg": "FG-B",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Data_visita",
        "aepField": "_mrv.earlyInspectionDetails.scheduledDate",
        "fg": "FG-B",
        "type": "Date",
        "obs": ""
      }
    ]
  },
  {
    "id": "assistenciaTecnicaAgendamentoVistoriaAntecipada",
    "title": "Agendamento vistoria antecipada (AssistenciaTecnica)",
    "bu": "AssistenciaTecnica",
    "eventType": "assistenciaTecnica.ftpFileImport",
    "sourceEventType": "assistenciaTecnicaAgendamentoVistoriaAntecipada",
    "sourceFileName": "`VA_OBRAS_Qas_fields.json` (5 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "Cpf",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "e-mail",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "tempo",
        "aepField": "⚠️ SEM DESTINO (sem campo de tempo decorrido)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "horarios",
        "aepField": "⚠️ SEM DESTINO (sem campo de slots)",
        "fg": "—",
        "type": "—",
        "obs": ""
      }
    ]
  },
  {
    "id": "assistenciaTecnicaAtOrientacoesParaSindicoVistoriaAsc",
    "title": "AT_orientacoes_para_Sindico_Vistoria_ASC (AssistenciaTecnica)",
    "bu": "AssistenciaTecnica",
    "eventType": "assistenciaTecnica.ftpFileImport",
    "sourceEventType": "assistenciaTecnicaAtOrientacoesParaSindicoVistoriaAsc",
    "sourceFileName": "`Orientacoes_sobre_vistoria_sindico_fields.json` (4 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF_CNPJ",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "CPF/CNPJ → cpfHash"
      },
      {
        "csvField": "Email",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": "PK"
      },
      {
        "csvField": "Empreendimento",
        "aepField": "_mrv.earlyInspectionDetails.property",
        "fg": "FG-B",
        "type": "String",
        "obs": ""
      }
    ]
  },
  {
    "id": "assistenciaTecnicaEMailAgendamentoVa",
    "title": "Jornada e-mail Agendamento VA (AssistenciaTecnica)",
    "bu": "AssistenciaTecnica",
    "eventType": "assistenciaTecnica.ftpFileImport",
    "sourceEventType": "assistenciaTecnicaEMailAgendamentoVa",
    "sourceFileName": "`Jornada e-mail Agendamento VA_fields.json` (5 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "cpf",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "e-mail",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "tempo",
        "aepField": "⚠️ SEM DESTINO (sem campo de tempo decorrido)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "status_unidade",
        "aepField": "_mrv.earlyInspectionDetails.inspectionStatus",
        "fg": "FG-B",
        "type": "String",
        "obs": ""
      }
    ]
  },
  {
    "id": "assistenciaTecnicaImplantacaoCondominio",
    "title": "Jornada Implantação Condominio (AssistenciaTecnica)",
    "bu": "AssistenciaTecnica",
    "eventType": "assistenciaTecnica.ftpFileImport",
    "sourceEventType": "assistenciaTecnicaImplantacaoCondominio",
    "sourceFileName": "`Imp_Condo_fields.json` (18 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "cpf",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Email",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "link",
        "aepField": "_mrv.condominiumEvent.actionLink",
        "fg": "FG-F",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "prazo_candidatura",
        "aepField": "_mrv.condominiumEvent.candidacyDeadline",
        "fg": "FG-F",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "video_candidato",
        "aepField": "_mrv.condominiumEvent.candidateVideoLink",
        "fg": "FG-F",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "inicio_votacao",
        "aepField": "_mrv.condominiumEvent.votingStartDate",
        "fg": "FG-F",
        "type": "String",
        "obs": "String (apesar do nome)"
      },
      {
        "csvField": "fim_votacao",
        "aepField": "_mrv.condominiumEvent.votingEndDate",
        "fg": "FG-F",
        "type": "String",
        "obs": "String (apesar do nome)"
      },
      {
        "csvField": "disponibilizacao_conteudo",
        "aepField": "_mrv.condominiumEvent.contentAvailabilityDate",
        "fg": "FG-F",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Data1",
        "aepField": "_mrv.condominiumEvent.date1",
        "fg": "FG-F",
        "type": "String",
        "obs": "D6: opaca"
      },
      {
        "csvField": "Data3",
        "aepField": "_mrv.condominiumEvent.date3",
        "fg": "FG-F",
        "type": "String",
        "obs": "D6: opaca"
      },
      {
        "csvField": "Data5",
        "aepField": "_mrv.condominiumEvent.date5",
        "fg": "FG-F",
        "type": "String",
        "obs": "D6: opaca"
      },
      {
        "csvField": "Datainiciovotacao",
        "aepField": "_mrv.condominiumEvent.votingStartTimestamp",
        "fg": "FG-F",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "inicioimplanta",
        "aepField": "_mrv.condominiumEvent.implementationStartDate",
        "fg": "FG-F",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      },
      {
        "csvField": "locale",
        "aepField": "_mrv.ftpFileImport.locale",
        "fg": "FG-I",
        "type": "String",
        "obs": "pt-BR"
      },
      {
        "csvField": "Data2",
        "aepField": "_mrv.condominiumEvent.date2",
        "fg": "FG-F",
        "type": "String",
        "obs": "D6: opaca"
      },
      {
        "csvField": "Data4",
        "aepField": "_mrv.condominiumEvent.date4",
        "fg": "FG-F",
        "type": "String",
        "obs": "D6: opaca"
      }
    ]
  },
  {
    "id": "assistenciaTecnicaSindico",
    "title": "Jornada Síndico (AssistenciaTecnica)",
    "bu": "AssistenciaTecnica",
    "eventType": "assistenciaTecnica.ftpFileImport",
    "sourceEventType": "assistenciaTecnicaSindico",
    "sourceFileName": "`jornada_sindico_fields.json` (4 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "Cpf",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "e-mail",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "locale",
        "aepField": "_mrv.ftpFileImport.locale",
        "fg": "FG-I",
        "type": "String",
        "obs": "pt-BR"
      }
    ]
  },
  {
    "id": "assistenciaTecnicaWhatsAgendamentoEntregaChaves",
    "title": "Whats - Agendamento Entrega Chaves (AssistenciaTecnica)",
    "bu": "AssistenciaTecnica",
    "eventType": "assistenciaTecnica.ftpFileImport",
    "sourceEventType": "assistenciaTecnicaWhatsAgendamentoEntregaChaves",
    "sourceFileName": "`Whats - Agendamento Entrega Chaves_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular · PK"
      }
    ]
  },
  {
    "id": "assistenciaTecnicaWhatsappAgendamentoVa",
    "title": "Jornada WhatsApp Agendamento VA (AssistenciaTecnica)",
    "bu": "AssistenciaTecnica",
    "eventType": "assistenciaTecnica.ftpFileImport",
    "sourceEventType": "assistenciaTecnicaWhatsappAgendamentoVa",
    "sourceFileName": "`Jornada WhatsApp Agendamento VA_fields.json` (4 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      },
      {
        "csvField": "Marca",
        "aepField": "_mrv.earlyInspectionDetails.brand",
        "fg": "FG-B",
        "type": "String",
        "obs": ""
      }
    ]
  },
  {
    "id": "assistenciaTecnicaWhatsappPesquisaImplantacaoChave",
    "title": "Jornada WhatsApp Pesquisa Implantação - Chave (AssistenciaTecnica)",
    "bu": "AssistenciaTecnica",
    "eventType": "assistenciaTecnica.ftpFileImport",
    "sourceEventType": "assistenciaTecnicaWhatsappPesquisaImplantacaoChave",
    "sourceFileName": "`chvaes_vot_assembleia_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "assistenciaTecnicaWhatsappPesquisaImplantacaoChavePesquisa",
    "title": "Jornada WhatsApp Pesquisa Implantação - Chave Pesquisa (AssistenciaTecnica)",
    "bu": "AssistenciaTecnica",
    "eventType": "assistenciaTecnica.ftpFileImport",
    "sourceEventType": "assistenciaTecnicaWhatsappPesquisaImplantacaoChavePesquisa",
    "sourceFileName": "`wpp_pesquisa_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "assistenciaTecnicaWhatsappVaIndisponivel",
    "title": "Jornada WhatsApp VA Indisponível (AssistenciaTecnica)",
    "bu": "AssistenciaTecnica",
    "eventType": "assistenciaTecnica.ftpFileImport",
    "sourceEventType": "assistenciaTecnicaWhatsappVaIndisponivel",
    "sourceFileName": "`Jornada WhatsApp VA Indisponível_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "assistenciaTecnicaWhatsappVaNaoAptos",
    "title": "Jornada WhatsApp VA Não Aptos (AssistenciaTecnica)",
    "bu": "AssistenciaTecnica",
    "eventType": "assistenciaTecnica.ftpFileImport",
    "sourceEventType": "assistenciaTecnicaWhatsappVaNaoAptos",
    "sourceFileName": "`Jornada WhatsApp VA Não Aptos_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "assistenciaTecnicaWhatsappVaReagendamento",
    "title": "Jornada WhatsApp VA Reagendamento (AssistenciaTecnica)",
    "bu": "AssistenciaTecnica",
    "eventType": "assistenciaTecnica.ftpFileImport",
    "sourceEventType": "assistenciaTecnicaWhatsappVaReagendamento",
    "sourceFileName": "`Jornada WhatsApp VA Reagendamento_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "assistenciaTecnicaWhatsappVaReparosFinalizados",
    "title": "Jornada WhatsApp VA Reparos Finalizados (AssistenciaTecnica)",
    "bu": "AssistenciaTecnica",
    "eventType": "assistenciaTecnica.ftpFileImport",
    "sourceEventType": "assistenciaTecnicaWhatsappVaReparosFinalizados",
    "sourceFileName": "`Jornada WhatsApp VA Reparos Finalizados_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "assistenciaTecnicaWhatsAssembleia",
    "title": "Whats - Assembleia (AssistenciaTecnica)",
    "bu": "AssistenciaTecnica",
    "eventType": "assistenciaTecnica.ftpFileImport",
    "sourceEventType": "assistenciaTecnicaWhatsAssembleia",
    "sourceFileName": "`Whats - Assembleia_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "assistenciaTecnicaWhatsAutoAgendamentoEc",
    "title": "Jornada Whats - Auto-agendamento EC (AssistenciaTecnica)",
    "bu": "AssistenciaTecnica",
    "eventType": "assistenciaTecnica.ftpFileImport",
    "sourceEventType": "assistenciaTecnicaWhatsAutoAgendamentoEc",
    "sourceFileName": "`Whats_Auto_agendamento_EC_fields.json` (5 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      },
      {
        "csvField": "Momento",
        "aepField": "⚠️ SEM DESTINO (sem inspectionMoment no schema)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Email",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      }
    ]
  },
  {
    "id": "assistenciaTecnicaWhatsEnvioChavesFechaduraEletronica",
    "title": "Whats - Envio Chaves Fechadura Eletrônica (AssistenciaTecnica)",
    "bu": "AssistenciaTecnica",
    "eventType": "assistenciaTecnica.ftpFileImport",
    "sourceEventType": "assistenciaTecnicaWhatsEnvioChavesFechaduraEletronica",
    "sourceFileName": "`Whats - Envio Chaves Fechadura Eletrônica_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular · PK"
      }
    ]
  },
  {
    "id": "assistenciaTecnicaWhatsNpsProfissionalAtencaoSindico",
    "title": "Jornada Whats - NPS Profissional Atenção Síndico (AssistenciaTecnica)",
    "bu": "AssistenciaTecnica",
    "eventType": "assistenciaTecnica.ftpFileImport",
    "sourceEventType": "assistenciaTecnicaWhatsNpsProfissionalAtencaoSindico",
    "sourceFileName": "`Whats_NPS_Profissional_Atencao_Sindico_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "cobrancaAnteciparWpp2",
    "title": "Antecipar_Wpp2 (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaAnteciparWpp2",
    "sourceFileName": "`6-23-2026-Antecipar_Wpp2.csv` (3 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "cobrancaCobrancaLuggo",
    "title": "Jornada Cobrança Luggo (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaCobrancaLuggo",
    "sourceFileName": "`6-23-2026-Jornada Cobrança Luggo.csv` (22 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "Locale",
        "aepField": "_mrv.ftpFileImport.locale",
        "fg": "FG-I",
        "type": "String",
        "obs": "pt-BR"
      },
      {
        "csvField": "Adicionado_a_base",
        "aepField": "⚠️ SEM DESTINO (Adicionado_a_base)",
        "fg": "—",
        "type": "—",
        "obs": "Campo não mapeado"
      },
      {
        "csvField": "Dt_pagamento",
        "aepField": "⚠️ SEM DESTINO (Dt_pagamento)",
        "fg": "—",
        "type": "—",
        "obs": "Campo não mapeado"
      },
      {
        "csvField": "Valor_pago",
        "aepField": "⚠️ SEM DESTINO (Valor_pago)",
        "fg": "—",
        "type": "—",
        "obs": "Campo não mapeado"
      },
      {
        "csvField": "Status",
        "aepField": "_mrv.contractBillingEvent.invoiceStatus",
        "fg": "FG-A",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Indicador_de_cobranca",
        "aepField": "⚠️ SEM DESTINO (Indicador_de_cobranca)",
        "fg": "—",
        "type": "—",
        "obs": "Campo não mapeado"
      },
      {
        "csvField": "Motivo_impedimento",
        "aepField": "⚠️ SEM DESTINO (Motivo_impedimento)",
        "fg": "—",
        "type": "—",
        "obs": "Campo não mapeado"
      },
      {
        "csvField": "Abertura_sinistro",
        "aepField": "⚠️ SEM DESTINO (Abertura_sinistro)",
        "fg": "—",
        "type": "—",
        "obs": "Campo não mapeado"
      },
      {
        "csvField": "Tipo",
        "aepField": "_mrv.ftpFileImport.recordType",
        "fg": "FG-I",
        "type": "String",
        "obs": "D9: opaca"
      },
      {
        "csvField": "Contrato",
        "aepField": "_mrv.contractBillingEvent.contractId",
        "fg": "FG-A",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Email",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Celular",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Telefone"
      },
      {
        "csvField": "Cliente",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "Residencial",
        "aepField": "⚠️ SEM DESTINO (sem campo no schema)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Parcela_aluguel",
        "aepField": "_mrv.contractBillingEvent.rentInstallmentAmount",
        "fg": "FG-A",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Vencimento",
        "aepField": "_mrv.contractBillingEvent.dueDate",
        "fg": "FG-A",
        "type": "String",
        "obs": "String no schema (Lift&Shift)"
      },
      {
        "csvField": "Valor_aberto_c_reajuste",
        "aepField": "_mrv.contractBillingEvent.openAmountWithAdjustment",
        "fg": "FG-A",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Dias_de_atraso",
        "aepField": "⚠️ SEM DESTINO (Dias_de_atraso)",
        "fg": "—",
        "type": "—",
        "obs": "Campo não mapeado"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "mes",
        "aepField": "⚠️ SEM DESTINO (mes)",
        "fg": "—",
        "type": "—",
        "obs": "Campo não mapeado"
      },
      {
        "csvField": "dt_sms",
        "aepField": "⚠️ SEM DESTINO (dt_sms)",
        "fg": "—",
        "type": "—",
        "obs": "Campo não mapeado"
      },
      {
        "csvField": "Tipo_Contrato",
        "aepField": "⚠️ SEM DESTINO (sem campo no schema)",
        "fg": "—",
        "type": "—",
        "obs": ""
      }
    ]
  },
  {
    "id": "cobrancaCobrancaWedoSms",
    "title": "Cobranca - Wedo - SMS (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaCobrancaWedoSms",
    "sourceFileName": "`Wedo_SMS_fields.json` (5 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      },
      {
        "csvField": "Mensagem",
        "aepField": "_mrv.contractBillingEvent.messageBody",
        "fg": "FG-A",
        "type": "String",
        "obs": "Bloco B — corpo SMS pré-renderizado"
      },
      {
        "csvField": "Locale",
        "aepField": "_mrv.ftpFileImport.locale",
        "fg": "FG-I",
        "type": "String",
        "obs": "pt-BR"
      },
      {
        "csvField": "data_criacao",
        "aepField": "_mrv.ftpFileImport.recordCreatedDate",
        "fg": "FG-I",
        "type": "Date",
        "obs": ""
      }
    ]
  },
  {
    "id": "cobrancaDeEMailComunicadoRenegociacao",
    "title": "Jornada de E-mail - Comunicado Renegociação (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaDeEMailComunicadoRenegociacao",
    "sourceFileName": "`6-23-2026-Comunicado_Renegociacao.csv` (5 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "e-mail",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "locale",
        "aepField": "_mrv.ftpFileImport.locale",
        "fg": "FG-I",
        "type": "String",
        "obs": "pt-BR"
      },
      {
        "csvField": "celular",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Telefone"
      },
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      }
    ]
  },
  {
    "id": "cobrancaFtpLembreteJurosDeObra",
    "title": "Jornada FTP lembrete juros de obra (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaFtpLembreteJurosDeObra",
    "sourceFileName": "`Jornada FTP lembrete juros de obra_fields.json` (7 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "cpf",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "e-mail",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Valor",
        "aepField": "_mrv.contractBillingEvent.installmentAmount",
        "fg": "FG-A",
        "type": "String",
        "obs": "String no schema"
      },
      {
        "csvField": "Vencimento_parcela",
        "aepField": "_mrv.contractBillingEvent.dueDate",
        "fg": "FG-A",
        "type": "String",
        "obs": "String no schema"
      },
      {
        "csvField": "banco",
        "aepField": "_mrv.contractBillingEvent.bankName",
        "fg": "FG-A",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "site",
        "aepField": "_mrv.contractBillingEvent.bankSiteUrl",
        "fg": "FG-A",
        "type": "String",
        "obs": ""
      }
    ]
  },
  {
    "id": "cobrancaJbFtpWppCobranca",
    "title": "JB_FTP_WPP_Cobranca (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaJbFtpWppCobranca",
    "sourceFileName": "`6-23-2026-Jornada-FTP-Wpp-Cobranca.csv` (3 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "cobrancaJbJurosPrimeiraCobranca",
    "title": "JB_Juros - Primeira Cobrança (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaJbJurosPrimeiraCobranca",
    "sourceFileName": "`6-23-2026-JB_Juros – Primeira Cobrança.csv` (3 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "cobrancaJbWedoEmail",
    "title": "JB_Wedo_Email (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaJbWedoEmail",
    "sourceFileName": "`6-23-2026-Email_Wedo.csv` (39 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "Origem",
        "aepField": "_mrv.sourceContext.sourceJobName",
        "fg": "FG-I",
        "type": "String",
        "obs": "Valor de negócio (ex.: Wedo)"
      },
      {
        "csvField": "Sistema",
        "aepField": "_mrv.sourceContext.sourceJobName",
        "fg": "FG-I",
        "type": "String",
        "obs": "Valor de negócio"
      },
      {
        "csvField": "Descricao_Residencial",
        "aepField": "⚠️ SEM DESTINO (sem campo no schema)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Codigo_Cliente",
        "aepField": "_mrv.contractBillingEvent.sapClientId",
        "fg": "FG-A",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Nome_Completo",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "Endereco_Cliente",
        "aepField": "⚠️ SEM DESTINO (sem homeAddress no schema)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Bairro_Cliente",
        "aepField": "⚠️ SEM DESTINO (sem homeAddress)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Cidade_Cliente",
        "aepField": "⚠️ SEM DESTINO (sem homeAddress)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Estado_Cliente",
        "aepField": "⚠️ SEM DESTINO (sem homeAddress)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "CEP_Cliente",
        "aepField": "⚠️ SEM DESTINO (sem homeAddress)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Email_Cliente",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Nome_Parcela",
        "aepField": "_mrv.contractBillingEvent.installmentName",
        "fg": "FG-A",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Identificador_Parcela",
        "aepField": "_mrv.contractBillingEvent.installmentId",
        "fg": "FG-A",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Vencimento_Parcela",
        "aepField": "_mrv.contractBillingEvent.dueDate",
        "fg": "FG-A",
        "type": "String",
        "obs": "String no schema"
      },
      {
        "csvField": "Original_Parcela",
        "aepField": "_mrv.contractBillingEvent.installmentDetailsBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco (Fase 1)"
      },
      {
        "csvField": "Reajuste_Parcela",
        "aepField": "_mrv.contractBillingEvent.installmentDetailsBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "Parcela_Reajustada",
        "aepField": "_mrv.contractBillingEvent.installmentDetailsBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "CPF_CNPJ",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "CPF/CNPJ → cpfHash"
      },
      {
        "csvField": "Residencial",
        "aepField": "⚠️ SEM DESTINO (sem campo no schema)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Mora_Parcela",
        "aepField": "_mrv.contractBillingEvent.installmentDetailsBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "Multa_Parcela",
        "aepField": "_mrv.contractBillingEvent.installmentDetailsBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "Valor_Total",
        "aepField": "_mrv.contractBillingEvent.installmentDetailsBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "Desconto_Parcela",
        "aepField": "_mrv.contractBillingEvent.installmentDetailsBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "Divida_Parcela",
        "aepField": "_mrv.contractBillingEvent.installmentDetailsBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "Original_Contrato",
        "aepField": "_mrv.contractBillingEvent.contractDebtBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "Reajuste_Contrato",
        "aepField": "_mrv.contractBillingEvent.contractDebtBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "Valor_Reajustado_Contrato",
        "aepField": "_mrv.contractBillingEvent.contractDebtBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "Mora_Contrato",
        "aepField": "_mrv.contractBillingEvent.contractDebtBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "Multa_Contrato",
        "aepField": "_mrv.contractBillingEvent.contractDebtBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "Multa_Mora_Contrato",
        "aepField": "_mrv.contractBillingEvent.contractDebtBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "Desconto_Contrato",
        "aepField": "_mrv.contractBillingEvent.contractDebtBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "Divida_Atualizada_Contrato",
        "aepField": "_mrv.contractBillingEvent.contractDebtBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "VI_Atualizado",
        "aepField": "_mrv.contractBillingEvent.openAmountWithAdjustment",
        "fg": "FG-A",
        "type": "String",
        "obs": "Provável typo Vl→Vi"
      },
      {
        "csvField": "ID_Mensagem_Email",
        "aepField": "_mrv.contractBillingEvent.emailMessageId",
        "fg": "FG-A",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Prev_Assinat_Banco",
        "aepField": "⚠️ SEM DESTINO (Fase 2 não construída)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Previsao_Chaves",
        "aepField": "⚠️ SEM DESTINO (Fase 2 não construída)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Nome_Cliente",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "Contrato",
        "aepField": "_mrv.contractBillingEvent.contractId",
        "fg": "FG-A",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Safra_Parcela",
        "aepField": "_mrv.contractBillingEvent.vintage",
        "fg": "FG-A",
        "type": "String",
        "obs": ""
      }
    ]
  },
  {
    "id": "cobrancaPendenciaDeAditivoCopy",
    "title": "Jornada Pendência de Aditivo (Copy) (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaPendenciaDeAditivoCopy",
    "sourceFileName": "`Pendencia_Aditivo_fields.json` (6 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "cpf",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "nome do cliente",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "email",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": "PK"
      },
      {
        "csvField": "telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      },
      {
        "csvField": "locale",
        "aepField": "_mrv.ftpFileImport.locale",
        "fg": "FG-I",
        "type": "String",
        "obs": "pt-BR"
      },
      {
        "csvField": "Tipo",
        "aepField": "_mrv.ftpFileImport.recordType",
        "fg": "FG-I",
        "type": "String",
        "obs": "D9: opaca"
      }
    ]
  },
  {
    "id": "cobrancaWhatsAbatimentoNegociacao",
    "title": "Whats - Abatimento Negociacao (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaWhatsAbatimentoNegociacao",
    "sourceFileName": "`Whats_Abatimento_Negociacao_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "cobrancaWhatsAntecipacao",
    "title": "Whats - Antecipação (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaWhatsAntecipacao",
    "sourceFileName": "`Whats - Antecipação_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "cobrancaWhatsAntecipacaoPremiada",
    "title": "Whats - Antecipação Premiada (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaWhatsAntecipacaoPremiada",
    "sourceFileName": "`Whats - Antecipação Premiada_fields.json` (5 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      },
      {
        "csvField": "Desconto",
        "aepField": "⚠️ SEM DESTINO (negotiationDiscountAmount não no schema)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Prazo",
        "aepField": "⚠️ SEM DESTINO (proposalDeadline não no schema)",
        "fg": "—",
        "type": "—",
        "obs": ""
      }
    ]
  },
  {
    "id": "cobrancaWhatsappRenegociar2023",
    "title": "WhatsApp_Renegociar_2023 (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaWhatsappRenegociar2023",
    "sourceFileName": "`Renegociar_wpp_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "cobrancaWhatsAtivoZendesk",
    "title": "Whats - Ativo Zendesk (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaWhatsAtivoZendesk",
    "sourceFileName": "`Whats - Ativo Zendesk_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "Cpf",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "cobrancaWhatsCampanhaFinalAno",
    "title": "Whats - Campanha Final Ano (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaWhatsCampanhaFinalAno",
    "sourceFileName": "`Whats - Campanha Final Ano_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "cobrancaWhatsCampanhaPague5Ganhe1",
    "title": "Jornada_Whats_Campanha_Pague5_Ganhe1 (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaWhatsCampanhaPague5Ganhe1",
    "sourceFileName": "`Jornada_Pague5_Ganhe1_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "cobrancaWhatsCobNotificacaoJudicial",
    "title": "Whats - Cob Notificação Judicial (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaWhatsCobNotificacaoJudicial",
    "sourceFileName": "`Whats - Cob Notificação Judicial_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "cobrancaWhatsConfirmacaoNegociacao",
    "title": "Jornada_Whats - Confirmacao Negociacao (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaWhatsConfirmacaoNegociacao",
    "sourceFileName": "`Whats_Confirmacao_Negociacao_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "cobrancaWhatsNotifAlienaFidu",
    "title": "Jornada_Whats_Notif_Aliena_Fidu (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaWhatsNotifAlienaFidu",
    "sourceFileName": "`Whats_Notif_Aliena_Fidu_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "cobrancaWhatsNotifReintegraPosse",
    "title": "Jornada_Whats - Notif Reintegra Posse (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaWhatsNotifReintegraPosse",
    "sourceFileName": "`Whats_Notif_Reintegra_Posse_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "cobrancaWhatsRegularizacaoPredistrato",
    "title": "Whats - Regularização PreDistrato (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaWhatsRegularizacaoPredistrato",
    "sourceFileName": "`Whats - Regularização PreDistrato_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "cobrancaWhatsRenegEntradaMulta",
    "title": "Jornada_Whats_Reneg_Entrada_Multa (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaWhatsRenegEntradaMulta",
    "sourceFileName": "`Whats_Reneg_Entrada_Multa_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "cobrancaWhatsRenegociacaoFev",
    "title": "Whats - Renegociação Fev (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaWhatsRenegociacaoFev",
    "sourceFileName": "`Whats - Cob Notificação Judicial_Proposta_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "cobrancaWppAditivo",
    "title": "Jornada Wpp Aditivo (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaWppAditivo",
    "sourceFileName": "`wpp_aditivo_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "cobrancaWppCobrancaCorrecao",
    "title": "Wpp - Cobrança Correção (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaWppCobrancaCorrecao",
    "sourceFileName": "`Wpp Cobrança Correção_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "cobrancaWppRenegAntecipacaoMaio2025",
    "title": "Jornada Wpp - Reneg_Antecipacao_Maio2025 (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaWppRenegAntecipacaoMaio2025",
    "sourceFileName": "`Whats_Reneg_Antecipacao_Boleto_Maio_25_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "cobrancaWppRenegociacao",
    "title": "Wpp -  Renegociação (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaWppRenegociacao",
    "sourceFileName": "`Wpp - Renegociação_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "cobrancaWppRenegSemjurosMarco2025",
    "title": "Jornada_Wpp_Reneg_SemJuros_Marco2025 (Cobranca)",
    "bu": "Cobranca",
    "eventType": "cobranca.ftpFileImport",
    "sourceEventType": "cobrancaWppRenegSemjurosMarco2025",
    "sourceFileName": "`Whats_Renegociacao_SemJuros_Marco25_fields.json` (3 colunas)",
    "evidence": "fields.json",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash · PK"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "marketingCreditoWhatsContratoPendenteAssinatura",
    "title": "Whats Contrato Pendente Assinatura (MarketingCredito)",
    "bu": "MarketingCredito",
    "eventType": "marketingCredito.ftpFileImport",
    "sourceEventType": "marketingCreditoWhatsContratoPendenteAssinatura",
    "sourceFileName": "`6-19-2026-Whats_Contrato-_Pendente_Assinatura.csv` (7 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      },
      {
        "csvField": "Momento",
        "aepField": "_mrv.ftpFileImport.sendMoment",
        "fg": "FG-I",
        "type": "String",
        "obs": "D9: opaca"
      },
      {
        "csvField": "nome_empreendimento",
        "aepField": "⚠️ SEM DESTINO (sem Lookup/projectName)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "nome_correspondente",
        "aepField": "_mrv.productOffer.correspondentName",
        "fg": "FG-E",
        "type": "String",
        "obs": "Bloco B"
      },
      {
        "csvField": "telefone_correspondente",
        "aepField": "_mrv.productOffer.correspondentPhone",
        "fg": "FG-E",
        "type": "String",
        "obs": "Bloco B"
      }
    ]
  },
  {
    "id": "marketingCreditoWhatsTrocaDePlano",
    "title": "Jornada Whats - Troca de Plano (MarketingCredito)",
    "bu": "MarketingCredito",
    "eventType": "marketingCredito.ftpFileImport",
    "sourceEventType": "marketingCreditoWhatsTrocaDePlano",
    "sourceFileName": "`6-19-2026-Whats_Troca_de_Plano.csv` (4 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      },
      {
        "csvField": "Tipo",
        "aepField": "_mrv.ftpFileImport.recordType",
        "fg": "FG-I",
        "type": "String",
        "obs": "D9: opaca"
      }
    ]
  },
  {
    "id": "marketplaceDisparoDivulgacaoArmariosWpp",
    "title": "Disparo Divulgacao Armários - WPP (Marketplace)",
    "bu": "Marketplace",
    "eventType": "marketplace.ftpFileImport",
    "sourceEventType": "marketplaceDisparoDivulgacaoArmariosWpp",
    "sourceFileName": "`6-19-2026-Disparo_divulgacao_Armarios.csv` (4 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Primeiro_nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "empreendimento",
        "aepField": "⚠️ SEM DESTINO (sem Lookup; offerName roteia)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Celular",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Telefone"
      }
    ]
  },
  {
    "id": "marketplaceDisparoOfertasEmParceirosWpp",
    "title": "Disparo Ofertas em parceiros - WPP (Marketplace)",
    "bu": "Marketplace",
    "eventType": "marketplace.ftpFileImport",
    "sourceEventType": "marketplaceDisparoOfertasEmParceirosWpp",
    "sourceFileName": "`6-19-2026-Disparo_ofertas_parceiros.csv` (6 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Celular",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Telefone"
      },
      {
        "csvField": "Primeiro_nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "parceiro",
        "aepField": "_mrv.productOffer.partnerName",
        "fg": "FG-E",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Link",
        "aepField": "_mrv.productOffer.offerLink",
        "fg": "FG-E",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Desconto",
        "aepField": "_mrv.productOffer.discountAmount",
        "fg": "FG-E",
        "type": "String",
        "obs": "String (ex.: '60%')"
      }
    ]
  },
  {
    "id": "marketplaceDisparoRelancamentoWpp",
    "title": "Disparo relancamento - wpp (Marketplace)",
    "bu": "Marketplace",
    "eventType": "marketplace.ftpFileImport",
    "sourceEventType": "marketplaceDisparoRelancamentoWpp",
    "sourceFileName": "`6-19-2026-Disparo_Relancamento.csv` (6 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Empreendimento",
        "aepField": "⚠️ SEM DESTINO (sem Lookup; offerName roteia)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "data_evento",
        "aepField": "_mrv.physicalEvent.eventDate",
        "fg": "FG-E",
        "type": "String",
        "obs": "Texto livre (ex.: '21 a 23/03')"
      },
      {
        "csvField": "horario_evento",
        "aepField": "_mrv.physicalEvent.eventTime",
        "fg": "FG-E",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "endereco_evento",
        "aepField": "_mrv.physicalEvent.eventAddress",
        "fg": "FG-E",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Celular",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Telefone"
      }
    ]
  },
  {
    "id": "marketplaceDisparoServicoMorador",
    "title": "Disparo_Servico_Morador (Marketplace)",
    "bu": "Marketplace",
    "eventType": "marketplace.ftpFileImport",
    "sourceEventType": "marketplaceDisparoServicoMorador",
    "sourceFileName": "`6-19-2026-Disparo_Servico_Morador.csv` (7 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Celular",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Telefone"
      },
      {
        "csvField": "Primeiro_nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "servico",
        "aepField": "_mrv.productOffer.serviceName",
        "fg": "FG-E",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Empreendimento",
        "aepField": "⚠️ SEM DESTINO (sem Lookup; offerName roteia)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Link",
        "aepField": "_mrv.productOffer.offerLink",
        "fg": "FG-E",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Consultor",
        "aepField": "_mrv.productOffer.consultantName",
        "fg": "FG-E",
        "type": "String",
        "obs": ""
      }
    ]
  },
  {
    "id": "marketplaceJrAquecimentoLancamentos",
    "title": "JR_aquecimento_lancamentos (Marketplace)",
    "bu": "Marketplace",
    "eventType": "marketplace.ftpFileImport",
    "sourceEventType": "marketplaceJrAquecimentoLancamentos",
    "sourceFileName": "`6-19-2026-arm_aquecimento_semi_automatizacao.csv` (13 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Email",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Primeiro_nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "Celular",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Telefone"
      },
      {
        "csvField": "Empreendimento",
        "aepField": "⚠️ SEM DESTINO (sem Lookup; offerName roteia)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Regional",
        "aepField": "_mrv.physicalEvent.region",
        "fg": "FG-E",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Data_evento",
        "aepField": "_mrv.physicalEvent.eventDate",
        "fg": "FG-E",
        "type": "String",
        "obs": "Texto livre (ex.: '21 a 23/03')"
      },
      {
        "csvField": "Horario_evento",
        "aepField": "_mrv.physicalEvent.eventTime",
        "fg": "FG-E",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Endereco_evento",
        "aepField": "_mrv.physicalEvent.eventAddress",
        "fg": "FG-E",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Numero_parcelas",
        "aepField": "_mrv.productOffer.installmentsQuantity",
        "fg": "FG-E",
        "type": "String",
        "obs": "String (ex.: '24x')"
      },
      {
        "csvField": "Locale",
        "aepField": "_mrv.ftpFileImport.locale",
        "fg": "FG-I",
        "type": "String",
        "obs": "pt-BR"
      },
      {
        "csvField": "data_inicio",
        "aepField": "_mrv.physicalEvent.campaignStartDate",
        "fg": "FG-E",
        "type": "String",
        "obs": "String no schema"
      },
      {
        "csvField": "Kit_Acabamento",
        "aepField": "_mrv.productOffer.productKit",
        "fg": "FG-E",
        "type": "String",
        "obs": ""
      }
    ]
  },
  {
    "id": "marketplaceJrLancamentoAutomatizacaoCorretor",
    "title": "JR_lancamento_automatizacao_corretor (Marketplace)",
    "bu": "Marketplace",
    "eventType": "marketplace.ftpFileImport",
    "sourceEventType": "marketplaceJrLancamentoAutomatizacaoCorretor",
    "sourceFileName": "`6-19-2026-arm_Corretor_semi_automatizacao.csv` (13 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Email",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Primeiro_nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "Celular",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Telefone"
      },
      {
        "csvField": "Empreendimento",
        "aepField": "⚠️ SEM DESTINO (sem Lookup; offerName roteia)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Regional",
        "aepField": "_mrv.physicalEvent.region",
        "fg": "FG-E",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Data_evento",
        "aepField": "_mrv.physicalEvent.eventDate",
        "fg": "FG-E",
        "type": "String",
        "obs": "Texto livre (ex.: '21 a 23/03')"
      },
      {
        "csvField": "Horario_evento",
        "aepField": "_mrv.physicalEvent.eventTime",
        "fg": "FG-E",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Endereco_evento",
        "aepField": "_mrv.physicalEvent.eventAddress",
        "fg": "FG-E",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Numero_parcelas",
        "aepField": "_mrv.productOffer.installmentsQuantity",
        "fg": "FG-E",
        "type": "String",
        "obs": "String (ex.: '24x')"
      },
      {
        "csvField": "Locale",
        "aepField": "_mrv.ftpFileImport.locale",
        "fg": "FG-I",
        "type": "String",
        "obs": "pt-BR"
      },
      {
        "csvField": "data_inicio",
        "aepField": "_mrv.physicalEvent.campaignStartDate",
        "fg": "FG-E",
        "type": "String",
        "obs": "String no schema"
      },
      {
        "csvField": "Kit_Acabamento",
        "aepField": "_mrv.productOffer.productKit",
        "fg": "FG-E",
        "type": "String",
        "obs": ""
      }
    ]
  },
  {
    "id": "marketplaceJrSemiAutomatizacaoLancamento",
    "title": "JR_semi_automatizacao_Lancamento (Marketplace)",
    "bu": "Marketplace",
    "eventType": "marketplace.ftpFileImport",
    "sourceEventType": "marketplaceJrSemiAutomatizacaoLancamento",
    "sourceFileName": "`6-19-2026-arm_lancamento_semi_automatizacao.csv` (13 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Email",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Primeiro_nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "Celular",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Telefone"
      },
      {
        "csvField": "Empreendimento",
        "aepField": "⚠️ SEM DESTINO (sem Lookup; offerName roteia)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Regional",
        "aepField": "_mrv.physicalEvent.region",
        "fg": "FG-E",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Data_evento",
        "aepField": "_mrv.physicalEvent.eventDate",
        "fg": "FG-E",
        "type": "String",
        "obs": "Texto livre (ex.: '21 a 23/03')"
      },
      {
        "csvField": "Horario_evento",
        "aepField": "_mrv.physicalEvent.eventTime",
        "fg": "FG-E",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Endereco_evento",
        "aepField": "_mrv.physicalEvent.eventAddress",
        "fg": "FG-E",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Numero_parcelas",
        "aepField": "_mrv.productOffer.installmentsQuantity",
        "fg": "FG-E",
        "type": "String",
        "obs": "String (ex.: '24x')"
      },
      {
        "csvField": "Locale",
        "aepField": "_mrv.ftpFileImport.locale",
        "fg": "FG-I",
        "type": "String",
        "obs": "pt-BR"
      },
      {
        "csvField": "data_inicio",
        "aepField": "_mrv.physicalEvent.campaignStartDate",
        "fg": "FG-E",
        "type": "String",
        "obs": "String no schema"
      },
      {
        "csvField": "Kit_Acabamento",
        "aepField": "_mrv.productOffer.productKit",
        "fg": "FG-E",
        "type": "String",
        "obs": ""
      }
    ]
  },
  {
    "id": "marketplacePrazoEncerrando7dias",
    "title": "Jornada Prazo Encerrando_7dIas (Marketplace)",
    "bu": "Marketplace",
    "eventType": "marketplace.ftpFileImport",
    "sourceEventType": "marketplacePrazoEncerrando7dias",
    "sourceFileName": "`6-19-2026-Prazo-Encerramento.csv` (9 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "Primeiro_nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "Empreendimento",
        "aepField": "⚠️ SEM DESTINO (sem Lookup; offerName roteia)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Celular",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Telefone"
      },
      {
        "csvField": "Email",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Classificação",
        "aepField": "_mrv.customerClassification",
        "fg": "FG-E",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Locale",
        "aepField": "_mrv.ftpFileImport.locale",
        "fg": "FG-I",
        "type": "String",
        "obs": "pt-BR"
      },
      {
        "csvField": "Prazo_encerrando",
        "aepField": "_mrv.deadlineApproaching",
        "fg": "FG-E",
        "type": "String",
        "obs": ""
      }
    ]
  },
  {
    "id": "relacionamentoCriV2",
    "title": "Jornada CRI v2 (Relacionamento)",
    "bu": "Relacionamento",
    "eventType": "relacionamento.ftpFileImport",
    "sourceEventType": "relacionamentoCriV2",
    "sourceFileName": "`6-18-2026-Comunicado_CRI_v2.csv` (11 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "Contrato",
        "aepField": "_mrv.contractBillingEvent.contractId",
        "fg": "FG-A",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Celular",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Telefone"
      },
      {
        "csvField": "Locale",
        "aepField": "_mrv.ftpFileImport.locale",
        "fg": "FG-I",
        "type": "String",
        "obs": "pt-BR"
      },
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "Data_Venda",
        "aepField": "_mrv.contractBillingEvent.saleDate",
        "fg": "FG-A",
        "type": "Date",
        "obs": "Bloco B"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "E-mail",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "CNPJ",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "CNPJ (PJ) → cpfHash"
      },
      {
        "csvField": "Securitizadora",
        "aepField": "_mrv.contractBillingEvent.securitizer",
        "fg": "FG-A",
        "type": "String",
        "obs": "Bloco B"
      },
      {
        "csvField": "Marca",
        "aepField": "⚠️ SEM DESTINO (brand só em earlyInspectionDetails)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Portal",
        "aepField": "_mrv.contractBillingEvent.portalUrl",
        "fg": "FG-A",
        "type": "String",
        "obs": "Bloco B"
      }
    ]
  },
  {
    "id": "relacionamentoJbConvocacaoEleicaoPa",
    "title": "JB_Convocacao_Eleição_PA (Relacionamento)",
    "bu": "Relacionamento",
    "eventType": "relacionamento.ftpFileImport",
    "sourceEventType": "relacionamentoJbConvocacaoEleicaoPa",
    "sourceFileName": "`6-18-2026-Convocacao_Eleicao_PA.csv` (5 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Email",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Parceiro",
        "aepField": "_mrv.condominiumEvent.partnerName",
        "fg": "FG-F",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Dia",
        "aepField": "_mrv.condominiumEvent.electionDate",
        "fg": "FG-F",
        "type": "String",
        "obs": ""
      }
    ]
  },
  {
    "id": "relacionamentoPatrimonioComissaoAfetacao",
    "title": "Jornada Patrimonio - Comissão afetação (Relacionamento)",
    "bu": "Relacionamento",
    "eventType": "relacionamento.ftpFileImport",
    "sourceEventType": "relacionamentoPatrimonioComissaoAfetacao",
    "sourceFileName": "`6-18-2026-Jornada_patrimonio.csv` (6 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "Empreendimento",
        "aepField": "_mrv.serviceCase.nomeEmpreendimento",
        "fg": "FG-D",
        "type": "String",
        "obs": "Exceção legada PT"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "E-mail",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Representante",
        "aepField": "_mrv.productOffer.representativeName",
        "fg": "FG-E",
        "type": "String",
        "obs": "Bloco B"
      },
      {
        "csvField": "Locale",
        "aepField": "_mrv.ftpFileImport.locale",
        "fg": "FG-I",
        "type": "String",
        "obs": "pt-BR"
      },
      {
        "csvField": "Obra",
        "aepField": "⚠️ SEM DESTINO (sem propertyContext)",
        "fg": "—",
        "type": "—",
        "obs": ""
      }
    ]
  },
  {
    "id": "relacionamentoReagendamentoVisita",
    "title": "Reagendamento Visita (Relacionamento)",
    "bu": "Relacionamento",
    "eventType": "relacionamento.ftpFileImport",
    "sourceEventType": "relacionamentoReagendamentoVisita",
    "sourceFileName": "`6-18-2026-reagedamento-visita.csv` (3 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "relacionamentoReclameAqui",
    "title": "Jornada Reclame Aqui (Relacionamento)",
    "bu": "Relacionamento",
    "eventType": "relacionamento.ftpFileImport",
    "sourceEventType": "relacionamentoReclameAqui",
    "sourceFileName": "`6-18-2026-Reclame_Aqui.csv` (7 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "Email",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Link",
        "aepField": "_mrv.serviceCase.responseLink",
        "fg": "FG-D",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Celular",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Telefone"
      },
      {
        "csvField": "Nome_SMS",
        "aepField": "_mrv.serviceCase.smsDisplayName",
        "fg": "FG-D",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "locale",
        "aepField": "_mrv.ftpFileImport.locale",
        "fg": "FG-I",
        "type": "String",
        "obs": "pt-BR"
      }
    ]
  },
  {
    "id": "relacionamentoVisitaAObraV2",
    "title": "Visita à Obra_v2 (Relacionamento)",
    "bu": "Relacionamento",
    "eventType": "relacionamento.ftpFileImport",
    "sourceEventType": "relacionamentoVisitaAObraV2",
    "sourceFileName": "`6-23-2026-Obra.csv` (12 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Nome_cliente",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "Email",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Locale",
        "aepField": "_mrv.ftpFileImport.locale",
        "fg": "FG-I",
        "type": "String",
        "obs": "pt-BR"
      },
      {
        "csvField": "Empreendimento",
        "aepField": "_mrv.serviceCase.nomeEmpreendimento",
        "fg": "FG-D",
        "type": "String",
        "obs": "Exceção legada PT"
      },
      {
        "csvField": "Bloco",
        "aepField": "⚠️ SEM DESTINO (Bloco)",
        "fg": "—",
        "type": "—",
        "obs": "Campo não mapeado"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      },
      {
        "csvField": "Data_evento",
        "aepField": "_mrv.physicalEvent.eventDate",
        "fg": "FG-E",
        "type": "String",
        "obs": "Texto livre (ex.: '21 a 23/03')"
      },
      {
        "csvField": "horario_evento",
        "aepField": "_mrv.physicalEvent.eventTime",
        "fg": "FG-E",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Dia",
        "aepField": "_mrv.condominiumEvent.electionDate",
        "fg": "FG-F",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Mes",
        "aepField": "⚠️ SEM DESTINO (Mes)",
        "fg": "—",
        "type": "—",
        "obs": "Campo não mapeado"
      },
      {
        "csvField": "data_criacao",
        "aepField": "_mrv.ftpFileImport.recordCreatedDate",
        "fg": "FG-I",
        "type": "Date",
        "obs": ""
      }
    ]
  },
  {
    "id": "relacionamentoWhatsappDirecionamentoCca",
    "title": "Jornada WhatsApp - Direcionamento CCA (Relacionamento)",
    "bu": "Relacionamento",
    "eventType": "relacionamento.ftpFileImport",
    "sourceEventType": "relacionamentoWhatsappDirecionamentoCca",
    "sourceFileName": "`6-18-2026-Jornada_WhatsApp_Direcionamento_CCA.csv` (7 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "Cliente",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "Empreendimento",
        "aepField": "_mrv.serviceCase.nomeEmpreendimento",
        "fg": "FG-D",
        "type": "String",
        "obs": "Exceção legada PT"
      },
      {
        "csvField": "Nome_CCA",
        "aepField": "⚠️ SEM DESTINO (sem commercialRelationship)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      },
      {
        "csvField": "Email",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Celular",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Telefone"
      }
    ]
  },
  {
    "id": "relacionamentoWhatsappDisparoPesquisaNps",
    "title": "WhatsApp_Disparo_Pesquisa_NPS (Relacionamento)",
    "bu": "Relacionamento",
    "eventType": "relacionamento.ftpFileImport",
    "sourceEventType": "relacionamentoWhatsappDisparoPesquisaNps",
    "sourceFileName": "`6-19-2026-WhatsApp_Disparo_Pesquisa_NPS.csv` (6 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Celular",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Telefone"
      },
      {
        "csvField": "Link",
        "aepField": "_mrv.serviceCase.responseLink",
        "fg": "FG-D",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Empreendimento",
        "aepField": "_mrv.serviceCase.nomeEmpreendimento",
        "fg": "FG-D",
        "type": "String",
        "obs": "Exceção legada PT"
      },
      {
        "csvField": "Campanha",
        "aepField": "_mrv.serviceCase.surveyCampaign",
        "fg": "FG-D",
        "type": "String",
        "obs": ""
      }
    ]
  },
  {
    "id": "relacionamentoWhatsappDisparoPesquisaReclameAqui",
    "title": "Jornada WhatsApp - Disparo Pesquisa Reclame Aqui (Relacionamento)",
    "bu": "Relacionamento",
    "eventType": "relacionamento.ftpFileImport",
    "sourceEventType": "relacionamentoWhatsappDisparoPesquisaReclameAqui",
    "sourceFileName": "`6-18-2026-WhatsApp_Disparo_Pesquisa_Reclame_Aqui.csv` (8 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Celular",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Telefone"
      },
      {
        "csvField": "Link",
        "aepField": "_mrv.serviceCase.responseLink",
        "fg": "FG-D",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Tipo",
        "aepField": "_mrv.serviceCase.surveyType",
        "fg": "FG-D",
        "type": "String",
        "obs": "Tipo de pesquisa"
      },
      {
        "csvField": "Nome_parceiro",
        "aepField": "_mrv.serviceCase.partnerName",
        "fg": "FG-D",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Site_parceiro",
        "aepField": "_mrv.serviceCase.partnerSite",
        "fg": "FG-D",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "cupom",
        "aepField": "_mrv.serviceCase.rewardCoupon",
        "fg": "FG-D",
        "type": "String",
        "obs": ""
      }
    ]
  },
  {
    "id": "relacionamentoWhatsParcelamentoItbiERegistro",
    "title": "Whats - Parcelamento ITBI e Registro (Relacionamento)",
    "bu": "Relacionamento",
    "eventType": "relacionamento.ftpFileImport",
    "sourceEventType": "relacionamentoWhatsParcelamentoItbiERegistro",
    "sourceFileName": "`6-18-2026-ParcelamentoeRegistro.csv` (3 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "relacionamentoWhatsPremioReclame",
    "title": "Whats - Premio Reclame (Relacionamento)",
    "bu": "Relacionamento",
    "eventType": "relacionamento.ftpFileImport",
    "sourceEventType": "relacionamentoWhatsPremioReclame",
    "sourceFileName": "`6-18-2026-Whats---Premio-Reclame.csv` (3 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      }
    ]
  },
  {
    "id": "sensiaBoasVindasNovaSensiaFtp",
    "title": "Boas vindas - Nova Jornada Sensia_FTP (Sensia)",
    "bu": "Sensia",
    "eventType": "sensia.ftpFileImport",
    "sourceEventType": "sensiaBoasVindasNovaSensiaFtp",
    "sourceFileName": "`6-19-2026-boas_vindas_FTP_Sensia.csv` (13 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "nome_cliente",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Email",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Celular",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Telefone"
      },
      {
        "csvField": "Tipo",
        "aepField": "_mrv.ftpFileImport.recordType",
        "fg": "FG-I",
        "type": "String",
        "obs": "D9: opaca"
      },
      {
        "csvField": "Ganho_Pre_Ganho",
        "aepField": "⚠️ SEM DESTINO (human-gated, não formalizado)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Liberacao_SAP",
        "aepField": "_mrv.constructionStart.sapReleased",
        "fg": "FG-G",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Locale",
        "aepField": "_mrv.ftpFileImport.locale",
        "fg": "FG-I",
        "type": "String",
        "obs": "pt-BR"
      },
      {
        "csvField": "Tipo_Contrato",
        "aepField": "⚠️ SEM DESTINO (sem campo no schema)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "ID_Contrato_Sap",
        "aepField": "_mrv.contractBillingEvent.contractId",
        "fg": "FG-A",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Empreendimento",
        "aepField": "⚠️ SEM DESTINO (sem Lookup; ver serviceCase.nomeEmpreendimento / earlyInspectionDetails.property)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Personalização",
        "aepField": "_mrv.constructionStart.customizationAvailable",
        "fg": "FG-G",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Inicio Obra",
        "aepField": "_mrv.constructionStart.constructionStartDate",
        "fg": "FG-G",
        "type": "String",
        "obs": ""
      }
    ]
  },
  {
    "id": "sensiaConvocacaoEleicaoPa",
    "title": "Jornada Convocação Eleição PA (Sensia)",
    "bu": "Sensia",
    "eventType": "sensia.ftpFileImport",
    "sourceEventType": "sensiaConvocacaoEleicaoPa",
    "sourceFileName": "`6-19-2026-Convocacao_Eleicao_PA.csv` (5 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Email",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Parceiro",
        "aepField": "_mrv.condominiumEvent.partnerName",
        "fg": "FG-F",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Dia",
        "aepField": "_mrv.condominiumEvent.electionDate",
        "fg": "FG-F",
        "type": "String",
        "obs": ""
      }
    ]
  },
  {
    "id": "sensiaEleicaoComissaoDePa",
    "title": "Eleicao_Comissão_de_PA (Sensia)",
    "bu": "Sensia",
    "eventType": "sensia.ftpFileImport",
    "sourceEventType": "sensiaEleicaoComissaoDePa",
    "sourceFileName": "`6-19-2026-Eleicao_Comissão_de_PA.csv` (5 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Email",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Parceiro",
        "aepField": "_mrv.condominiumEvent.partnerName",
        "fg": "FG-F",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Dia",
        "aepField": "_mrv.condominiumEvent.electionDate",
        "fg": "FG-F",
        "type": "String",
        "obs": ""
      }
    ]
  },
  {
    "id": "sensiaImplantacaoCondCopy",
    "title": "Implantação cond. Jornada (Copy) (Sensia)",
    "bu": "Sensia",
    "eventType": "sensia.ftpFileImport",
    "sourceEventType": "sensiaImplantacaoCondCopy",
    "sourceFileName": "`6-19-2026-imp_condo (1).csv` (18 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "cpf",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "e-mail",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "link",
        "aepField": "_mrv.condominiumEvent.actionLink",
        "fg": "FG-F",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "prazo candidatura",
        "aepField": "_mrv.condominiumEvent.candidacyDeadline",
        "fg": "FG-F",
        "type": "String",
        "obs": "⚠️ grafado com espaço"
      },
      {
        "csvField": "video_candidato",
        "aepField": "_mrv.condominiumEvent.candidateVideoLink",
        "fg": "FG-F",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "inicio_votacao",
        "aepField": "_mrv.condominiumEvent.votingStartDate",
        "fg": "FG-F",
        "type": "String",
        "obs": "String (apesar do nome)"
      },
      {
        "csvField": "fim_votacao",
        "aepField": "_mrv.condominiumEvent.votingEndDate",
        "fg": "FG-F",
        "type": "String",
        "obs": "String (apesar do nome)"
      },
      {
        "csvField": "disponibilizacao_conteudo",
        "aepField": "_mrv.condominiumEvent.contentAvailabilityDate",
        "fg": "FG-F",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Data1",
        "aepField": "_mrv.condominiumEvent.date1",
        "fg": "FG-F",
        "type": "String",
        "obs": "D6: opaca"
      },
      {
        "csvField": "Data3",
        "aepField": "_mrv.condominiumEvent.date3",
        "fg": "FG-F",
        "type": "String",
        "obs": "D6: opaca"
      },
      {
        "csvField": "Data5",
        "aepField": "_mrv.condominiumEvent.date5",
        "fg": "FG-F",
        "type": "String",
        "obs": "D6: opaca"
      },
      {
        "csvField": "Datainiciovotacao",
        "aepField": "_mrv.condominiumEvent.votingStartTimestamp",
        "fg": "FG-F",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "telefone",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Celular"
      },
      {
        "csvField": "locale",
        "aepField": "_mrv.ftpFileImport.locale",
        "fg": "FG-I",
        "type": "String",
        "obs": "pt-BR"
      },
      {
        "csvField": "inicioimplanta",
        "aepField": "_mrv.condominiumEvent.implementationStartDate",
        "fg": "FG-F",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Data4",
        "aepField": "_mrv.condominiumEvent.date4",
        "fg": "FG-F",
        "type": "String",
        "obs": "D6: opaca"
      },
      {
        "csvField": "Data2",
        "aepField": "_mrv.condominiumEvent.date2",
        "fg": "FG-F",
        "type": "String",
        "obs": "D6: opaca"
      }
    ]
  },
  {
    "id": "sensiaJbWedoEmail",
    "title": "JB_Wedo_Email (Sensia)",
    "bu": "Sensia",
    "eventType": "sensia.ftpFileImport",
    "sourceEventType": "sensiaJbWedoEmail",
    "sourceFileName": "`6-19-2026-Email_Wedo.csv` (39 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "Origem",
        "aepField": "_mrv.sourceContext.sourceJobName",
        "fg": "FG-I",
        "type": "String",
        "obs": "Valor de negócio (ex.: Wedo)"
      },
      {
        "csvField": "Sistema",
        "aepField": "_mrv.sourceContext.sourceJobName",
        "fg": "FG-I",
        "type": "String",
        "obs": "Valor de negócio"
      },
      {
        "csvField": "Descricao_Residencial",
        "aepField": "⚠️ SEM DESTINO (sem campo no schema)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Codigo_Cliente",
        "aepField": "_mrv.contractBillingEvent.sapClientId",
        "fg": "FG-A",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Nome_Completo",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "Endereco_Cliente",
        "aepField": "⚠️ SEM DESTINO (sem homeAddress no schema)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Bairro_Cliente",
        "aepField": "⚠️ SEM DESTINO (sem homeAddress)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Cidade_Cliente",
        "aepField": "⚠️ SEM DESTINO (sem homeAddress)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Estado_Cliente",
        "aepField": "⚠️ SEM DESTINO (sem homeAddress)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "CEP_Cliente",
        "aepField": "⚠️ SEM DESTINO (sem homeAddress)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Email_Cliente",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Nome_Parcela",
        "aepField": "_mrv.contractBillingEvent.installmentName",
        "fg": "FG-A",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Identificador_Parcela",
        "aepField": "_mrv.contractBillingEvent.installmentId",
        "fg": "FG-A",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Vencimento_Parcela",
        "aepField": "_mrv.contractBillingEvent.dueDate",
        "fg": "FG-A",
        "type": "String",
        "obs": "String no schema"
      },
      {
        "csvField": "Original_Parcela",
        "aepField": "_mrv.contractBillingEvent.installmentDetailsBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco (Fase 1)"
      },
      {
        "csvField": "Reajuste_Parcela",
        "aepField": "_mrv.contractBillingEvent.installmentDetailsBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "Parcela_Reajustada",
        "aepField": "_mrv.contractBillingEvent.installmentDetailsBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "CPF_CNPJ",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "CPF/CNPJ → cpfHash"
      },
      {
        "csvField": "Residencial",
        "aepField": "⚠️ SEM DESTINO (sem campo no schema)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Mora_Parcela",
        "aepField": "_mrv.contractBillingEvent.installmentDetailsBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "Multa_Parcela",
        "aepField": "_mrv.contractBillingEvent.installmentDetailsBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "Valor_Total",
        "aepField": "_mrv.contractBillingEvent.installmentDetailsBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "Desconto_Parcela",
        "aepField": "_mrv.contractBillingEvent.installmentDetailsBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "Divida_Parcela",
        "aepField": "_mrv.contractBillingEvent.installmentDetailsBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "Original_Contrato",
        "aepField": "_mrv.contractBillingEvent.contractDebtBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "Reajuste_Contrato",
        "aepField": "_mrv.contractBillingEvent.contractDebtBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "Valor_Reajustado_Contrato",
        "aepField": "_mrv.contractBillingEvent.contractDebtBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "Mora_Contrato",
        "aepField": "_mrv.contractBillingEvent.contractDebtBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "Multa_Contrato",
        "aepField": "_mrv.contractBillingEvent.contractDebtBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "Multa_Mora_Contrato",
        "aepField": "_mrv.contractBillingEvent.contractDebtBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "Desconto_Contrato",
        "aepField": "_mrv.contractBillingEvent.contractDebtBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "Divida_Atualizada_Contrato",
        "aepField": "_mrv.contractBillingEvent.contractDebtBlock",
        "fg": "FG-A",
        "type": "String",
        "obs": "Concatenado no bloco"
      },
      {
        "csvField": "VI_Atualizado",
        "aepField": "_mrv.contractBillingEvent.openAmountWithAdjustment",
        "fg": "FG-A",
        "type": "String",
        "obs": "Provável typo Vl→Vi"
      },
      {
        "csvField": "ID_Mensagem_Email",
        "aepField": "_mrv.contractBillingEvent.emailMessageId",
        "fg": "FG-A",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Prev_Assinat_Banco",
        "aepField": "⚠️ SEM DESTINO (Fase 2 não construída)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Previsao_Chaves",
        "aepField": "⚠️ SEM DESTINO (Fase 2 não construída)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Nome_Cliente",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "Contrato",
        "aepField": "_mrv.contractBillingEvent.contractId",
        "fg": "FG-A",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Safra_Parcela",
        "aepField": "_mrv.contractBillingEvent.vintage",
        "fg": "FG-A",
        "type": "String",
        "obs": ""
      }
    ]
  },
  {
    "id": "sensiaJurosObra",
    "title": "Juros Obra (Sensia)",
    "bu": "Sensia",
    "eventType": "sensia.ftpFileImport",
    "sourceEventType": "sensiaJurosObra",
    "sourceFileName": "`6-19-2026-Juros-Obra.csv` (4 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "cpf",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "e-mail",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "momento_envio",
        "aepField": "_mrv.ftpFileImport.sendMoment",
        "fg": "FG-I",
        "type": "String",
        "obs": "D9: opaca"
      }
    ]
  },
  {
    "id": "sensiaMiaAgendamentoVistoriaPorEMail",
    "title": "Mia - Agendamento vistoria por e-mail (Sensia)",
    "bu": "Sensia",
    "eventType": "sensia.ftpFileImport",
    "sourceEventType": "sensiaMiaAgendamentoVistoriaPorEMail",
    "sourceFileName": "`6-19-2026-mia_agendamento_vistoria.csv` (5 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "Nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "e-mail",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Cpf",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "tempo",
        "aepField": "⚠️ SEM DESTINO (sem campo de tempo decorrido)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "status_unidade",
        "aepField": "_mrv.earlyInspectionDetails.inspectionStatus",
        "fg": "FG-B",
        "type": "String",
        "obs": ""
      }
    ]
  },
  {
    "id": "sensiaPosAssinatura",
    "title": "Pós assinatura (Sensia)",
    "bu": "Sensia",
    "eventType": "sensia.ftpFileImport",
    "sourceEventType": "sensiaPosAssinatura",
    "sourceFileName": "`6-23-2026-PosAssinatura.csv` (8 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "Nome do cliente",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Celular",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Telefone"
      },
      {
        "csvField": "locale",
        "aepField": "_mrv.ftpFileImport.locale",
        "fg": "FG-I",
        "type": "String",
        "obs": "pt-BR"
      },
      {
        "csvField": "E-mail",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Empreendimento",
        "aepField": "⚠️ SEM DESTINO (sem Lookup; ver serviceCase.nomeEmpreendimento / earlyInspectionDetails.property)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Data Assinatura",
        "aepField": "⚠️ SEM DESTINO (Data Assinatura)",
        "fg": "—",
        "type": "—",
        "obs": "Campo não mapeado"
      },
      {
        "csvField": "Plano Financiamento",
        "aepField": "⚠️ SEM DESTINO (Plano Financiamento)",
        "fg": "—",
        "type": "—",
        "obs": "Campo não mapeado"
      }
    ]
  },
  {
    "id": "sensiaRenegociacao",
    "title": "Renegociação (Sensia)",
    "bu": "Sensia",
    "eventType": "sensia.ftpFileImport",
    "sourceEventType": "sensiaRenegociacao",
    "sourceFileName": "`6-19-2026-renegociacao.csv` (18 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "Primeiro_nome",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "Cliente",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "Celular",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Telefone"
      },
      {
        "csvField": "Email",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Unidade",
        "aepField": "⚠️ SEM DESTINO (sem propertyContext)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "parceiro",
        "aepField": "_mrv.condominiumEvent.partnerName",
        "fg": "FG-F",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Link",
        "aepField": "_mrv.condominiumEvent.actionLink",
        "fg": "FG-F",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Desconto",
        "aepField": "_mrv.productOffer.discountAmount",
        "fg": "FG-E",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "DtPagamento",
        "aepField": "_mrv.contractBillingEvent.paymentDate",
        "fg": "FG-A",
        "type": "String",
        "obs": "String no schema"
      },
      {
        "csvField": "Status",
        "aepField": "_mrv.contractBillingEvent.invoiceStatus",
        "fg": "FG-A",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Locale",
        "aepField": "_mrv.ftpFileImport.locale",
        "fg": "FG-I",
        "type": "String",
        "obs": "pt-BR"
      },
      {
        "csvField": "Contrato",
        "aepField": "_mrv.contractBillingEvent.contractId",
        "fg": "FG-A",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "DiasAtraso",
        "aepField": "_mrv.contractBillingEvent.lateDays",
        "fg": "FG-A",
        "type": "String",
        "obs": "String no schema"
      },
      {
        "csvField": "ValorParcela",
        "aepField": "_mrv.contractBillingEvent.installmentAmount",
        "fg": "FG-A",
        "type": "String",
        "obs": "String no schema"
      },
      {
        "csvField": "ValorPago",
        "aepField": "_mrv.contractBillingEvent.paidAmount",
        "fg": "FG-A",
        "type": "String",
        "obs": "String no schema"
      },
      {
        "csvField": "ParcelaAluguel",
        "aepField": "_mrv.contractBillingEvent.rentInstallmentAmount",
        "fg": "FG-A",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Vencimento",
        "aepField": "_mrv.contractBillingEvent.dueDate",
        "fg": "FG-A",
        "type": "String",
        "obs": "String no schema (Lift&Shift)"
      }
    ]
  },
  {
    "id": "urbaFinanciamentoBancario",
    "title": "Jornada Financiamento Bancário - PRD (Urba)",
    "bu": "Urba",
    "eventType": "urba.ftpFileImport",
    "sourceEventType": "urbaFinanciamentoBancario",
    "sourceFileName": "`6-19-2026-Jornada_Financiamento_Bancario_PRD.csv` (9 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "Nome_Cliente",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "CNPJ",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "CNPJ (PJ) → cpfHash"
      },
      {
        "csvField": "Email",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Celular",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Telefone"
      },
      {
        "csvField": "Empreendimento",
        "aepField": "⚠️ SEM DESTINO (sem Lookup; ver serviceCase.nomeEmpreendimento / earlyInspectionDetails.property)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Produto",
        "aepField": "⚠️ SEM DESTINO (sem propertyContext)",
        "fg": "—",
        "type": "—",
        "obs": ""
      },
      {
        "csvField": "Contrato",
        "aepField": "_mrv.contractBillingEvent.contractId",
        "fg": "FG-A",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Valorização",
        "aepField": "⚠️ SEM DESTINO (Valorização)",
        "fg": "—",
        "type": "—",
        "obs": "Campo não mapeado"
      }
    ]
  },
  {
    "id": "urbaInicioDeObra",
    "title": "Jornada Início de Obra PRD (Urba)",
    "bu": "Urba",
    "eventType": "urba.ftpFileImport",
    "sourceEventType": "urbaInicioDeObra",
    "sourceFileName": "`6-19-2026-Jornada_Inicio_de_Obra_PRD.csv` (6 colunas)",
    "evidence": "CSV (header)",
    "fields": [
      {
        "csvField": "Nome_Cliente",
        "aepField": "Profile (via identidade) — não carregado no evento",
        "fg": "Profile",
        "type": "—",
        "obs": "Nome resolvido no Profile via cpfHash"
      },
      {
        "csvField": "CPF",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "Identidade primária (namespace cpf_hash); a Function gera o hash"
      },
      {
        "csvField": "CNPJ",
        "aepField": "_mrv.identityEvents.cpfHash",
        "fg": "Identity",
        "type": "String",
        "obs": "CNPJ (PJ) → cpfHash"
      },
      {
        "csvField": "Email",
        "aepField": "_mrv.identityEvents.email",
        "fg": "Identity",
        "type": "String",
        "obs": ""
      },
      {
        "csvField": "Celular",
        "aepField": "_mrv.identityEvents.phone",
        "fg": "Identity",
        "type": "String",
        "obs": "D3: unificado com Telefone"
      },
      {
        "csvField": "Empreendimento",
        "aepField": "⚠️ SEM DESTINO (sem Lookup; ver serviceCase.nomeEmpreendimento / earlyInspectionDetails.property)",
        "fg": "—",
        "type": "—",
        "obs": ""
      }
    ]
  }
];