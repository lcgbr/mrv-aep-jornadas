"""
Gerador único do site estático MRV AEP — Jornadas (DE-PARA + WhatsApp SFMC→AJO).
Lê os .md de de-para e os payloads WhatsApp e escreve data.js (raiz do site).
Aposenta o antigo generate_data.js (Node).

Rode localmente (onde as pastas-fonte existem) e faça commit dos arquivos do site.
    python build_site.py
"""
import difflib
import hashlib
import json
import re
import sys
from pathlib import Path

# Variável de evento AJO: @event{<NomeDoEvento>.<pathXDM>}. O nome do evento é
# resolvido por jornada via mapa sourceEventType -> nome, extraído dos
# unitary_events_AJO_*.json. Jornadas sem evento caem no fallback (mantém SFMC + ⚠️).
PHONE_XDM = "_mrv.identityEvents.phone"
BOT_NUMBERS = {
    "PRD": {"MariaRosa": "553199009000", "BotComercial": "558007289000"},
    "QAS": {"MariaRosa": "553197839482", "BotComercial": "553197839482"},
}

# Nomes de evento AJO PROPOSTOS (ainda não criados no AJO) p/ as jornadas sem evento —
# ver jornadas_eventos_ajo.md (coluna Status Evento = novo/reapontar). Chave =
# sourceEventType (lower). Só preenche lacunas: eventos reais do JSON têm prioridade.
PROPOSED_EVENTS = {
    "assistenciatecnicaagendamentovistoriaantecipada": "MRV_FTP_Agend_Visto_Antecip",
    "assistenciatecnicaimplantacaocondominio": "MRV_FTP_Implant_Cond",
    "assistenciatecnicawhatsnpsprofissionalatencaosindico": "MRV_FTP_NPS_Prof_Aten_Sind",
    "assistenciatecnicawhatsappvareagendamento": "MRV_FTP_VA_Reagendamento",
    "assistenciatecnicawhatsappvareparosfinalizados": "MRV_FTP_VA_Reparos_Final",
    "assistenciatecnicawhatsenviochavesfechaduraeletronica": "MRV_FTP_Envio_Chaves_Fech",
    "cobrancaanteciparwpp2": "MRV_FTP_Antecipar_Wpp2",
    "cobrancajbwedoemail": "MRV_FTP_JB_Wedo_Email",
    "cobrancacobrancaluggo": "MRV_FTP_Jor_Cob_Luggo",
    "cobrancawppaditivo": "MRV_FTP_Wpp_Aditivo",
    "cobrancawhatsabatimentonegociacao": "MRV_FTP_Abatimento_Negoc",
    "cobrancawhatsapprenegociar2023": "MRV_FTP_Renegociar_2023",
    "marketplacejraquecimentolancamentos": "MRV_FTP_Aquecimento_Lanc",
    "relacionamentopatrimoniocomissaoafetacao": "MRV_FTP_Jor_Patri_Comi_Afet",
    "relacionamentowhatsappdirecionamentocca": "MRV_FTP_Jor_Whats_Direc_CCA",
    "relacionamentowhatsappdisparopesquisareclameaqui": "MRV_FTP_Jor_Whats_Pesq_Recl",
    "relacionamentoreagendamentovisita": "MRV_FTP_Reagend_Visita",
    "relacionamentovisitaaobrav2": "MRV_FTP_Visita_Obra_V2",
    "relacionamentowhatspremioreclame": "MRV_FTP_Whats_Premio_Recl",
    "relacionamentowhatsappdisparopesquisanps": "MRV_FTP_Whats_Disp_Pesq_NPS",
    "sensiaboasvindasnovasensiaftp": "MRV_FTP_BV_Nov_Jor_Sensia",
    "sensiaeleicaocomissaodepa": "MRV_FTP_Sen_Eleic_Comis_PA",
    "sensiaimplantacaocondcopy": "MRV_FTP_Implant_Cond_Jor",
    "sensiajbwedoemail": "MRV_FTP_JW_Wedo_Email_Sensia",
    "sensiaconvocacaoeleicaopa": "MRV_FTP_Jor_Convoc_Eleicao_PA",
    "sensiajurosobra": "MRV_FTP_Sen_Juros_Obra",
    "sensiamiaagendamentovistoriaporemail": "MRV_FTP_MIA_Agend_Vist_Email",
    "sensiaposassinatura": "MRV_FTP_Jor_Pos_Assin",
    "sensiarenegociacao": "MRV_FTP_Sen_Renegociacao",
}

# Override de evento AJO por journeyId — jornadas WPP cujo payload não traz sourceEventType
# próprio (o site casaria por nome e ficaria sem evento). Valor = nome do evento unitário no AJO.
WPP_EVENT_OVERRIDE = {
    "a2fc65ea-0e17-4831-b8dc-f12f1a2d1485": "Vistoria_Antecipada",  # Jornada VA 03 - Jornada de Revistoria (chaves_va_reprovada_prd)
}

# Override central de de-para de CAMPOS (corpo/botão) que não vêm das fichas.
# Chave = nome do evento AJO; valor = { campo_minusculo: destino }.
# Destino = caminho XDM (vira @event{evento.destino}) OU, se NÃO for caminho XDM
# (ex.: texto com espaço), valor ESTÁTICO literal — o app.js decide via isXdmPath.
PROPOSED_FIELD_MAP = {
    "MRV_FTP_Abatimento_Negoc": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Agend_Entreg_Chaves": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Agend_VA_Sindico": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Agend_Visto_Antecip": {
        "horarios": "_mrv.earlyInspectionDetails.scheduledTime",
        "nome": "person.name.fullName",
        "tempo": "_mrv.earlyInspectionDetails.elapsedTime",
    },
    "MRV_FTP_Agendamento_VA": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Antecipar_Wpp2": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Aquecimento_Lanc": {
        "empreendimento": "_mrv.condominiumEvent.buildingName",
        "primeiro_nome": "person.name.firstName",
    },
    "MRV_FTP_Assembleia": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Ativo_Zendesk": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Auto_Agend": {
        "momento": "_mrv.ftpFileImport.sendMoment",
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Campanha_Final_Ano": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Cob_Notif_Judicial": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_JB_Wedo_Email": {
        "bairro_cliente": "_mrv.customerAddress.neighborhood",
        "cep_cliente": "_mrv.customerAddress.postalCode",
        "cidade_cliente": "_mrv.customerAddress.city",
        "descricao_residencial": "_mrv.propertyContext.residentialDescription",
        "endereco_cliente": "_mrv.customerAddress.street",
        "estado_cliente": "_mrv.customerAddress.state",
        "nome_cliente": "person.name.fullName",
        "nome_completo": "person.name.fullName",
        "prev_assinat_banco": "_mrv.contractBillingEvent.bankSignatureForecastDate",
        "previsao_chaves": "_mrv.contractBillingEvent.keysDeliveryForecastDate",
        "residencial": "_mrv.condominiumEvent.buildingName",
    },
    "MRV_FTP_Jor_Cob_Luggo": {
        "abertura_sinistro": "_mrv.contractBillingEvent.claimOpenedIndicator",
        "adicionado_a_base": "_mrv.ftpFileImport.recordCreatedDate",
        "cliente": "person.name.fullName",
        "dias_de_atraso": "_mrv.contractBillingEvent.lateDays",
        "dt_pagamento": "_mrv.contractBillingEvent.paymentDate",
        "dt_sms": "_mrv.contractBillingEvent.smsDate",
        "indicador_de_cobranca": "_mrv.contractBillingEvent.collectionIndicator",
        "mes": "_mrv.contractBillingEvent.referenceMonth",
        "motivo_impedimento": "_mrv.contractBillingEvent.impedimentReason",
        "residencial": "_mrv.condominiumEvent.buildingName",
        "tipo_contrato": "_mrv.contractBillingEvent.contractType",
        "valor_pago": "_mrv.contractBillingEvent.paidAmount",
    },
    "MRV_FTP_Cobranca_Reneg_Fev": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Comunic_Reneg": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Contrato_Pend_Assin": {
        "nome": "person.name.fullName",
        "nome_empreendimento": "_mrv.condominiumEvent.buildingName",
    },
    "MRV_FTP_Convoc_Elei_PA": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Jor_Whats_Direc_CCA": {
        "cliente": "_mrv.productOffer.clientCCA",
        "nome_cca": "_mrv.productOffer.nameCCA",
    },
    "MRV_FTP_Disp_Oferta_Parc": {
        "primeiro_nome": "person.name.firstName",
    },
    "MRV_FTP_Whats_Disp_Pesq_NPS": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Jor_Whats_Pesq_Recl": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Disp_Relancamento": {
        "empreendimento": "_mrv.condominiumEvent.buildingName",
    },
    "MRV_FTP_Disparo_Divulg_Armario": {
        "empreendimento": "_mrv.condominiumEvent.buildingName",
        "primeiro_nome": "person.name.firstName",
    },
    "MRV_FTP_Disparo_Serv_Morador": {
        "empreendimento": "_mrv.condominiumEvent.buildingName",
        "primeiro_nome": "person.name.firstName",
    },
    "MRV_FTP_Email_Agend_VA": {
        "nome": "person.name.fullName",
        "tempo": "_mrv.earlyInspectionDetails.elapsedTime",
    },
    "MRV_FTP_Envio_Chaves_Fech": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Fin_Bancario": {
        "nome_cliente": "person.name.fullName",
        "produto": "_mrv.propertyContext.productName",
        "valorização": "_mrv.propertyContext.appreciation",
    },
    "MRV_FTP_Implant_Cond": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Jor_CRI_V2": {
        "marca": "_mrv.earlyInspectionDetails.brand",
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Jor_Inicio_Obra": {
        "nome_cliente": "person.name.fullName",
    },
    "MRV_FTP_Jor_Sindico": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Juros_Prim_cobranca": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Lembrete_Jur_Obra": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_NPS_Prof_Aten_Sind": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Notif_Alien_Fidu": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Orient_Sind_Visto": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Parcel_ITBI_Reg": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Jor_Patri_Comi_Afet": {
        "obra": "_mrv.propertyContext.constructionName",
    },
    "MRV_FTP_Pend_Aditivo": {
        "nome do cliente": "person.name.fullName",
    },
    "MRV_FTP_Pesq_Implant": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Pesquisa_Imp_Chave": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Prazo_Encerrando_7d": {
        "empreendimento": "_mrv.condominiumEvent.buildingName",
        "nome": "person.name.fullName",
        "primeiro_nome": "person.name.firstName",
    },
    "MRV_FTP_Whats_Premio_Recl": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Reagend_Visita": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Regu_PreDist": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Rel_Recl_Aqui": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Reneg_Antecip_Maio2025": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Reneg_Entrada_Multa": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Reneg_SemJuros_Mar2025": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Renegociar_2023": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Semi_Aut_Lancamento": {
        "empreendimento": "_mrv.condominiumEvent.buildingName",
        "primeiro_nome": "person.name.firstName",
    },
    "MRV_FTP_BV_Nov_Jor_Sensia": {
        "ganho_pre_ganho": "_mrv.propertyContext.saleStatus",
        "nome_cliente": "person.name.fullName",
        "tipo_contrato": "_mrv.contractBillingEvent.contractType",
    },
    "MRV_FTP_Jor_Convoc_Eleicao_PA": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Sen_Eleic_Comis_PA": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Implant_Cond_Jor": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Sen_Juros_Obra": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_MIA_Agend_Vist_Email": {
        "nome": "person.name.fullName",
        "tempo": "_mrv.earlyInspectionDetails.elapsedTime",
    },
    "MRV_FTP_Jor_Pos_Assin": {
        "data assinatura": "_mrv.contractBillingEvent.contractSignatureDate",
        "nome do cliente": "person.name.fullName",
        "plano financiamento": "_mrv.contractBillingEvent.financingPlan",
    },
    "MRV_FTP_Sen_Renegociacao": {
        "cliente": "person.name.fullName",
        "primeiro_nome": "person.name.firstName",
        "unidade": "_mrv.propertyContext.unit",
    },
    "MRV_FTP_JW_Wedo_Email_Sensia": {
        "bairro_cliente": "_mrv.customerAddress.neighborhood",
        "cep_cliente": "_mrv.customerAddress.postalCode",
        "cidade_cliente": "_mrv.customerAddress.city",
        "descricao_residencial": "_mrv.propertyContext.residentialDescription",
        "endereco_cliente": "_mrv.customerAddress.street",
        "estado_cliente": "_mrv.customerAddress.state",
        "nome_cliente": "person.name.fullName",
        "nome_completo": "person.name.fullName",
        "prev_assinat_banco": "_mrv.contractBillingEvent.bankSignatureForecastDate",
        "previsao_chaves": "_mrv.contractBillingEvent.keysDeliveryForecastDate",
        "residencial": "_mrv.condominiumEvent.buildingName",
    },
    "MRV_FTP_Troca_Plano": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_VA_Nao_Aptos": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_VA_Reagendamento": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_VA_Reparos_Final": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Visita_Obra_V2": {
        "bloco": "_mrv.propertyContext.block",
        "mes": "_mrv.contractBillingEvent.referenceMonth",
        "nome_cliente": "person.name.fullName",
    },
    "MRV_FTP_WPP_Cobranca": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_WPP_Cobranca_Correcao": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_WPP_Reneg": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Whats_Antecipacao": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Whats_Antecipacao_Prem": {
        "desconto": "_mrv.contractBillingEvent.discountAmount",
        "nome": "person.name.fullName",
        "prazo": "_mrv.contractBillingEvent.deadline",
        "quero economizar": "Quero economizar",
    },
    "MRV_FTP_Whats_Confirm_Negoc": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Whats_Notif_Reint_Poss": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Whats_Pague5_Ganhe1": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Whats_VA_Indisponivel": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_Wpp_Aditivo": {
        "nome": "person.name.fullName",
    },
    "MRV_FTP_lancamento_Aut_Corr": {
        "empreendimento": "_mrv.condominiumEvent.buildingName",
        "primeiro_nome": "person.name.firstName",
    },
}

# ----------------------------------------------------------------------------
# Fontes (ajuste se rodar fora da máquina de origem)
# ----------------------------------------------------------------------------
DE_PARA_DIR = Path(r"d:\Projetos\clientes\MRV\AEP\docs_markdown\de_para_jornadas")
PAYLOADS_DIR = Path(r"d:\Projetos\clientes\MRV\AJO\mrv-sfmc-ajo-migration\whatsapp_payloads")
INFOBIP_DIR = Path(r"d:\Projetos\clientes\MRV\AJO\mrv-sfmc-ajo-migration\whatsapp_payloads_infobip")
AJO_EVENTS_DIR = Path(r"d:\Projetos\clientes\MRV\AJO")  # unitary_events_AJO_*.json
OUT_DATA = Path(__file__).resolve().parent / "data.js"

_XDM_PATH_RE = re.compile(r"[A-Za-z_][\w]*(?:\.[\w]+)+")


# ----------------------------------------------------------------------------
# DE-PARA — parse completo dos .md (porta do generate_data.js para Python)
# Retorna: lista de jornadas (p/ o visualizador) + mapa de campos (p/ o transform)
# ----------------------------------------------------------------------------

def parse_de_para(de_para_dir: Path):
    jornadas = []  # itens completos p/ a visão DE-PARA
    index = []     # {journeyName, buLabel, fields_map} p/ o transform WhatsApp

    if not de_para_dir.exists():
        print(f"[de-para] pasta não encontrada: {de_para_dir}")
        return jornadas, index

    for fp in sorted(de_para_dir.glob("*.md")):
        if fp.name == "_INDICE.md":
            continue
        lines = fp.read_text(encoding="utf-8").split("\n")

        title = bu = event_type = source_event = source_file = evidence = ""
        fields = []
        in_table = False
        header_idx = None  # posição de cada coluna, lida do cabeçalho da tabela §2

        for raw in lines:
            line = raw.strip()
            if line.startswith("# DE-PARA"):
                title = re.sub(r"^#\s*DE-PARA\s*[—\-–]\s*", "", line).strip()
            elif line.startswith("| **BU** |"):
                bu = line.split("|")[2].strip()
            elif line.startswith("| **`eventType`** |"):
                event_type = line.split("|")[2].replace("`", "").strip()
            elif line.startswith("| **`sourceEventType`** |"):
                source_event = line.split("|")[2].replace("`", "").strip()
            elif line.startswith("| **Arquivo de origem** |"):
                source_file = line.split("|")[2].strip()
            elif line.startswith("| **Evidência** |"):
                evidence = line.split("|")[2].strip()

            if line.startswith("## 2. DE-PARA campo a campo"):
                in_table = True
                header_idx = None
                continue
            if line.startswith("## 3."):
                in_table = False

            if in_table and line.startswith("|") and "---" not in line:
                parts = [p.strip() for p in line.split("|")]

                # Cabeçalho: mapeia a posição de cada coluna. Torna o parser tolerante
                # ao layout legado (sem "Obrig.") e ao novo (com), sem ler célula trocada.
                if "Campo CSV" in line:
                    header_idx = {}
                    for i, p in enumerate(parts):
                        k = p.lower().replace("`", "").strip()
                        if k.startswith("campo csv"):
                            header_idx["csvField"] = i
                        elif k.startswith("obrig"):
                            header_idx["required"] = i
                        elif k.startswith("campo aep"):
                            header_idx["aepField"] = i
                        elif k == "fg":
                            header_idx["fg"] = i
                        elif k == "tipo":
                            header_idx["type"] = i
                        elif k == "obs":
                            header_idx["obs"] = i
                    continue

                idx = header_idx or {"csvField": 2, "aepField": 3, "fg": 4, "type": 5, "obs": 6}

                def _cell(key):
                    i = idx.get(key)
                    return parts[i].strip() if i is not None and i < len(parts) else ""

                csv_field = _cell("csvField").replace("`", "")
                aep_field = _cell("aepField").replace("`", "")
                if csv_field and aep_field:
                    fields.append({
                        "csvField": csv_field, "aepField": aep_field,
                        "fg": _cell("fg"), "type": _cell("type"), "obs": _cell("obs"),
                        # "Sim" é o default: regra geral = toda coluna do cabeçalho é obrigatória
                        "required": _cell("required").replace("*", "").strip() or "Sim",
                    })

        if not (title and bu):
            continue

        jornadas.append({
            "id": source_event, "title": title, "bu": bu,
            "eventType": event_type, "sourceEventType": source_event,
            "sourceFileName": source_file, "evidence": evidence, "fields": fields,
        })

        # mapa { campoCsvLower: pathXDM } só com destinos de evento válidos
        fields_map = {}
        for f in fields:
            m = _XDM_PATH_RE.search(f["aepField"])
            if m:
                fields_map[f["csvField"].strip().lower()] = m.group(0)
        journey_name = re.sub(r"\s*\([^)]*\)\s*$", "", title).strip()
        index.append({"journeyName": journey_name, "buLabel": bu,
                      "fields_map": fields_map, "sourceEventType": source_event})

    print(f"[de-para] {len(jornadas)} jornadas carregadas")
    return jornadas, index


def annotate_depara(depara_list, ajo_map):
    """Marca cada campo da view DE-PARA com `status`:
      - 'ficha'    : já mapeado na ficha (aepField é caminho XDM);
      - 'override' : mapeado pelo PROPOSED_FIELD_MAP (traz as últimas atualizações);
      - 'missing'  : ainda SEM destino (sinalizado p/ mapear).
    Aplica o override no aepField e conta faltantes. Retorna estatísticas globais."""
    tot = ok_ficha = ok_override = missing = 0
    for j in depara_list:
        ev = ajo_map.get((j.get("sourceEventType") or "").strip().lower())
        ovr = PROPOSED_FIELD_MAP.get(ev, {}) if ev else {}
        for f in j["fields"]:
            tot += 1
            if _XDM_PATH_RE.search(f["aepField"]):
                f["status"] = "ficha"; ok_ficha += 1
            elif f["csvField"].strip().lower() in ovr:
                f["aepField"] = ovr[f["csvField"].strip().lower()]
                f["status"] = "override"; ok_override += 1
            else:
                f["status"] = "missing"; missing += 1
        j["ajoEvent"] = ev
        j["missingCount"] = sum(1 for f in j["fields"] if f.get("status") == "missing")
    stats = {"totalFields": tot, "ficha": ok_ficha, "override": ok_override, "missing": missing,
             "journeysWithMissing": sum(1 for j in depara_list if j.get("missingCount"))}
    print(f"[de-para] campos: {tot} | ficha {ok_ficha} | override {ok_override} | FALTANDO {missing}")
    return stats


def _norm_bu(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def match_de_para(bu: str, journey_name: str, index: list):
    """Retorna a entrada de-para da jornada (fields_map + sourceEventType) ou None."""
    jn = (journey_name or "").strip().lower()
    cands = [e for e in index if e["journeyName"].strip().lower() == jn]
    if not cands:
        return None
    if len(cands) == 1:
        return cands[0]
    pbu = _norm_bu(bu)
    for e in cands:
        ebu = _norm_bu(e["buLabel"])
        if ebu and ebu in pbu:
            return e
    return None


# ----------------------------------------------------------------------------
# Eventos unitários AJO — mapa sourceEventType -> Nome do evento (MRV_FTP_*)
# Extrai da condição de qualificação o valor de json://_mrv/sourceContext/sourceEventType.
# ----------------------------------------------------------------------------

def _collect_cond_pairs(node, pairs):
    if isinstance(node, dict):
        if node.get("type") == "function" and node.get("function") in ("equal", "in"):
            ref, vals = None, []
            for a in node.get("args", []):
                if not isinstance(a, dict):
                    continue
                if a.get("type") == "eventFieldRef":
                    ref = a.get("fieldRef")
                elif a.get("type") == "constant":
                    vals.append(a.get("value"))
                elif a.get("type") == "list":
                    vals += [c.get("value") for c in a.get("values", [])
                             if isinstance(c, dict) and c.get("type") == "constant"]
            if ref and vals:
                pairs.append((ref, vals))
        for v in node.values():
            _collect_cond_pairs(v, pairs)
    elif isinstance(node, list):
        for v in node:
            _collect_cond_pairs(v, pairs)


def build_ajo_event_map(ajo_dir: Path) -> dict:
    """{ sourceEventTypeLower: nomeDoEvento } dos eventos MRV_FTP_*."""
    files = sorted(ajo_dir.glob("unitary_events_AJO_*.json"))
    by_set = {}
    for fp in files:
        for ev in json.loads(fp.read_text(encoding="utf-8")).get("results", []):
            name = ev.get("name") or ""
            if not name.startswith("MRV_FTP"):
                continue
            pairs = []
            _collect_cond_pairs(ev.get("eventQualificationCondition"), pairs)
            source_event = next((vals[0] for ref, vals in pairs if "sourceEventType" in ref), None)
            if not source_event:
                continue
            key = source_event.strip().lower()
            if key in by_set:  # desempate: fica o nome mais parecido com o sourceEventType
                sim = lambda n: difflib.SequenceMatcher(None, re.sub(r"[^a-z0-9]", "", n.lower()), key).ratio()
                name = max([by_set[key], name], key=sim)
            by_set[key] = name
    print(f"[ajo] {len(by_set)} eventos MRV_FTP mapeados de {len(files)} arquivo(s)")
    return by_set


# ----------------------------------------------------------------------------
# WhatsApp — payloads + de-para por jornada
# ----------------------------------------------------------------------------

def build_wpp(payloads_dir: Path, de_para_index: list, ajo_map: dict):
    index_path = payloads_dir / "_indice_whatsapp.json"
    if not index_path.exists():
        print(f"[wpp] índice não encontrado: {index_path}")
        return {}

    with open(index_path, "r", encoding="utf-8") as f:
        index_data = json.load(f)

    # de-para também indexado por sourceEventType (p/ jornadas que trazem o campo explícito)
    depara_by_set = {e["sourceEventType"].strip().lower(): e
                     for e in de_para_index if e.get("sourceEventType")}

    data_by_bu = {}
    matched = with_event = 0
    for j in index_data.get("jornadas", []):
        bu, jid = j["bu"], j["journeyId"]
        file_path = payloads_dir / bu / f"{jid}.json"
        if not file_path.exists():
            continue
        with open(file_path, "r", encoding="utf-8") as f:
            journey = json.load(f)

        # Prioriza sourceEventType explícito no payload (jornadas adicionadas à mão);
        # senão casa pelo nome da jornada contra as fichas de de-para.
        explicit = (journey.get("sourceEventType") or "").strip()
        if explicit:
            entry = depara_by_set.get(explicit.lower())
            source_event = explicit
        else:
            entry = match_de_para(journey.get("bu", bu), journey.get("journeyName", ""), de_para_index)
            source_event = (entry["sourceEventType"] if entry else "") or ""
        journey["_deParaFields"] = entry["fields_map"] if entry else {}
        journey["_ajoEvent"] = ajo_map.get(source_event.strip().lower())  # nome do evento ou None
        if jid in WPP_EVENT_OVERRIDE:  # override por jornada (payload sem sourceEventType)
            journey["_ajoEvent"] = WPP_EVENT_OVERRIDE[jid]

        # Override central de campos mapeados à mão (vence o de-para das fichas).
        _ev = journey["_ajoEvent"]
        if _ev and _ev in PROPOSED_FIELD_MAP:
            _merged = dict(journey["_deParaFields"])
            _merged.update(PROPOSED_FIELD_MAP[_ev])
            journey["_deParaFields"] = _merged

        if journey["_deParaFields"]:
            matched += 1
        if journey["_ajoEvent"]:
            with_event += 1
        data_by_bu.setdefault(bu, []).append(journey)

    total = sum(len(v) for v in data_by_bu.values())
    print(f"[wpp] {total} jornadas; de-para {matched}/{total}; com evento AJO {with_event}/{total}")
    return data_by_bu


def build_infobip(infobip_dir: Path):
    """Lê whatsapp_payloads_infobip/ (payloads no formato-alvo Infobip, SEM segredos) e
    monta bu -> [jornadas], cada envio virando uma pseudo-atividade com _infobip=message
    (p/ reaproveitar lista/seleção da visão WhatsApp)."""
    idx = infobip_dir / "_indice_infobip.json"
    if not idx.exists():
        print(f"[infobip] índice não encontrado: {idx}")
        return {}
    data = json.loads(idx.read_text(encoding="utf-8"))
    by_bu, total_sends = {}, 0
    for j in data.get("jornadas", []):
        bu, jid = j["bu"], j["journeyId"]
        fp = infobip_dir / f"{jid}.json"
        if not fp.exists():
            continue
        jd = json.loads(fp.read_text(encoding="utf-8"))
        acts = []
        for i, s in enumerate(jd.get("sends", [])):
            msg = s.get("message") or {}
            acts.append({
                "activityId": f"{jid}::{i}",
                "activityKey": f"IB-{i + 1}",
                "templateName": (msg.get("template") or {}).get("templateName") or s.get("activityName") or "",
                "_infobip": msg,
                "_single": s.get("_format") == "single",
                "_review": s.get("_review") or [],
            })
        total_sends += len(acts)
        by_bu.setdefault(bu, []).append({
            "journeyId": jid, "journeyName": jd.get("journeyName"), "bu": bu,
            "_provider": "infobip", "_status": jd.get("status"), "whatsappActivities": acts,
        })
    print(f"[infobip] {sum(len(v) for v in by_bu.values())} jornadas; {total_sends} envios")
    return by_bu



# ----------------------------------------------------------------------------
# Guia de Variáveis — instruções de mapeamento (md) das jornadas complexas
# Fonte: AJO/mrv-sfmc-ajo-migration/instrucao_mapeamento_*.md (1 arquivo/jornada)
# Emite window.GUIDE_DATA com fórmulas, atividades, variáveis e HTML das seções.
# O HTML gerado usa APENAS classes guide-* (styles.css) — nada de Tailwind aqui,
# porque o purge do CSS da extensão não escaneia o data.js.
# ----------------------------------------------------------------------------

GUIDE_DIR = Path(r"d:\Projetos\clientes\MRV\AEP\mrv-aep-jornadas\docs")

_GUIDE_BU_LABEL = {
    "mrv-cobranca-portal": "Cobranca Portal",
    "mrv-assistencia-tecnica": "Assistencia Tecnica",
    "mrv-marketplace": "Marketplace",
    "mrv-relacionamento": "Relacionamento",
    "mrv-marketing-credito": "Marketing Credito",
    "mrv-gestao-vendas-h": "Gestao Vendas H",
    "mrv-gestao-vendas-p": "Gestao Vendas P",
    "sensia": "Sensia",
    "urba": "Urba",
    "luggo": "Luggo",
}
_GUIDE_PATTERN_BY_PREFIX = [
    ("instrucao_mapeamento_readaudience_", "Read Audience"),
    ("instrucao_mapeamento_api_", "API Event"),
    ("instrucao_mapeamento_dcs_", "DCS"),
    ("instrucao_mapeamento_ftp_wa_", "FTP · WhatsApp"),
    ("instrucao_mapeamento_ftp_email_", "FTP · E-mail"),
    ("instrucao_mapeamento_ftp_", "FTP"),
]
_GACT_RE = re.compile(r"(?:EMAILV2|SMSSYNC|REST|WAITBYDURATION|MULTICRITERIADECISION[A-Z0-9]*|ENGAGEMENTSPLIT[A-Z0-9]*)-\d+")
_GTPL_RE = re.compile(r"\b[a-z][a-z0-9_]*_(?:prd|qas)\b")
_GASSET_RE = re.compile(r"\bmanutencao_[a-z_]+\b")
_GXDM_RE = re.compile(r"\b(?:_mrv|person)\.[A-Za-z0-9_.]+\b")


def _gesc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _ginline(s):
    """Marcações inline sobre texto JÁ escapado: **bold** e `code`."""
    s = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"`([^`]+)`", r'<code class="guide-inline">\1</code>', s)
    return s


def _gmd_to_html(md):
    """Conversor mínimo do subset markdown usado nas specs (h2/h3, tabela,
    fenced code, listas/checklists, blockquote, parágrafos)."""
    lines = md.splitlines()
    out, i, n = [], 0, len(lines)
    while i < n:
        ln = lines[i]
        if ln.startswith("```"):
            j = i + 1
            buf = []
            while j < n and not lines[j].startswith("```"):
                buf.append(lines[j]); j += 1
            out.append('<pre class="guide-code">' + _gesc("\n".join(buf)) + "</pre>")
            i = j + 1
            continue
        if ln.lstrip().startswith("|"):
            rows = []
            while i < n and lines[i].lstrip().startswith("|"):
                rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")])
                i += 1
            body = rows[1:]
            if len(rows) > 1 and set("".join(rows[1])) <= set("-: "):
                body = rows[2:]
            html = ['<div class="guide-table-wrap"><table class="guide-table"><thead><tr>']
            for c in rows[0]:
                html.append("<th>" + _ginline(_gesc(c)) + "</th>")
            html.append("</tr></thead><tbody>")
            for r in body:
                html.append("<tr>" + "".join("<td>" + _ginline(_gesc(c)) + "</td>" for c in r) + "</tr>")
            html.append("</tbody></table></div>")
            out.append("".join(html))
            continue
        if ln.startswith("### "):
            out.append("<h3>" + _ginline(_gesc(ln[4:])) + "</h3>"); i += 1; continue
        if ln.startswith("## "):
            out.append("<h2>" + _ginline(_gesc(ln[3:])) + "</h2>"); i += 1; continue
        if ln.startswith(">"):
            buf = []
            while i < n and lines[i].startswith(">"):
                buf.append(lines[i].lstrip(">").strip()); i += 1
            out.append("<blockquote>" + _ginline(_gesc(" ".join(buf))) + "</blockquote>")
            continue
        if re.match(r"\s*[-*] ", ln):
            buf = []
            while i < n and re.match(r"\s*[-*] ", lines[i]):
                item = re.sub(r"^\s*[-*] ", "", lines[i])
                mark = ""
                if item.startswith("[ ] "):
                    mark = "\u2610 "; item = item[4:]
                elif item.lower().startswith("[x] "):
                    mark = "\u2611 "; item = item[4:]
                buf.append("<li>" + mark + _ginline(_gesc(item)) + "</li>")
                i += 1
            out.append('<ul class="guide-list">' + "".join(buf) + "</ul>")
            continue
        if ln.strip() in ("", "---"):
            i += 1; continue
        out.append("<p>" + _ginline(_gesc(ln)) + "</p>"); i += 1
    return "".join(out)


def _gnorm(s):
    return re.sub(r"[^0-9a-za-\u00ff]+", "", (s or "").lower())


def _gload_ranking(guide_dir):
    """ranking_complexidade_jornadas.md -> { nomeNormalizado: nivel }."""
    fp = guide_dir / "ranking_complexidade_jornadas.md"
    ranks = {}
    if not fp.exists():
        return ranks
    lvl = {"\U0001f534\U0001f534": "critica", "\U0001f534": "alta", "\U0001f7e1": "media", "\U0001f7e2": "baixa"}
    for m in re.finditer(r"^\|\s*\d+\s*\|\s*\*\*(.+?)\*\*\s*\|(.+)$", fp.read_text(encoding="utf-8"), re.M):
        name = m.group(1).strip()
        rest = m.group(2)
        level = None
        if "\U0001f534\U0001f534" in rest: level = "critica"
        elif "\U0001f534" in rest: level = "alta"
        elif "\U0001f7e1" in rest: level = "media"
        elif "\U0001f7e2" in rest: level = "baixa"
        if level:
            ranks[_gnorm(name)] = level
    return ranks


def _gcomplexity(title, ranks):
    key = _gnorm(title)
    if key in ranks:
        return ranks[key]
    for k, v in ranks.items():  # tolerância: contido num sentido ou noutro
        if k and (k in key or key in k):
            return v
    return None


def _gextract_formulas(md):
    """@event{...} + linhas de código com concat( — com contexto de uso."""
    formulas, seen = [], set()
    section = ""
    for ln in md.splitlines():
        if ln.startswith("## "):
            section = re.sub(r"[*`#]", "", ln[3:]).strip()
        for m in re.finditer(r"@event\{[^}]+\}", ln):
            expr = m.group(0)
            if expr in seen:
                continue
            seen.add(expr)
            ctx = re.sub(r"[`*|>]", " ", ln.replace(expr, " ")).strip()
            ctx = re.sub(r"\s+", " ", ctx).strip(" :=-\u2192()")
            formulas.append({"expr": expr, "context": (ctx or section)[:160]})
        if "concat(" in ln and "concat([" in ln:
            expr = ln.strip()
            if expr not in seen:
                seen.add(expr)
                formulas.append({"expr": expr, "context": section[:160]})
    return formulas


def _gparse_ident(md):
    """Tabela chave-valor da seção '## Identificação'."""
    ident = {}
    m = re.search(r"## Identifica.*?\n(.*?)(?=\n## )", md, re.S)
    if not m:
        return ident
    for ln in m.group(1).splitlines():
        ln = ln.strip()
        if not ln.startswith("|"):
            continue
        cells = [c.strip() for c in ln.strip("|").split("|")]
        if len(cells) < 2 or set("".join(cells)) <= set("-: "):
            continue
        key = re.sub(r"[`*]", "", cells[0]).strip()
        val = re.sub(r"\*\*", "", " · ".join(c for c in cells[1:] if c)).strip()
        if key:
            ident[key] = val
    return ident


def _gvariables(md):
    """1ª coluna das tabelas de de-para/mapeamento + paths XDM citados."""
    out, seen = [], set()
    for sec in re.finditer(r"## ((?:De-para|Mapeamento|Personaliza)[^\n]*)\n(.*?)(?=\n## |\Z)", md, re.S):
        for ln in sec.group(2).splitlines():
            ln = ln.strip()
            if not ln.startswith("|"):
                continue
            first = ln.strip("|").split("|")[0].strip()
            for tick in re.findall(r"`([^`]+)`", first):
                for v in re.split(r"\s*[/|+]\s*", tick):
                    v = v.strip()
                    if v and v.lower() not in seen and not v.startswith(("_mrv", "person.")):
                        seen.add(v.lower()); out.append(v)
    for m in _GXDM_RE.finditer(md):
        v = m.group(0).rstrip(".")
        if v.lower() not in seen:
            seen.add(v.lower()); out.append(v)
    return out


def build_guide(guide_dir: Path):
    if not guide_dir.exists():
        print(f"[guia] diretório não encontrado: {guide_dir} (GUIDE_DATA vazio)")
        return []
    ranks = _gload_ranking(guide_dir)
    entries = []
    for fp in sorted(guide_dir.glob("instrucao_mapeamento_*.md")):
        if fp.name == "instrucao_mapeamento_csharp.md":
            continue  # instrução global de ingestão C#, não é spec por jornada
        md = fp.read_text(encoding="utf-8")
        lines = md.splitlines()
        h1 = lines[0] if lines else ""
        m = re.search(r"—\s*(.+?)\s*·", h1)
        title = re.sub(r'[\"*]', "", m.group(1)).strip() if m else fp.stem
        pattern = next((p for pref, p in _GUIDE_PATTERN_BY_PREFIX if fp.name.startswith(pref)), "FTP")
        ident = _gparse_ident(md)
        if "dcsExternal" in md and pattern.startswith("FTP") and "dcs" not in fp.name:
            # família Wedo: arquivo com prefixo ftp_ mas eventType real dcsExternal
            if "eventType = dcsExternal" in md or "dcsExternal`" in md:
                pattern = "DCS"
        bu_m = re.search(r"BU\s*`([a-z0-9-]+)`", md)
        bu_raw = bu_m.group(1) if bu_m else ""
        ev_m = re.search(r"\b(MRV_FTP_[A-Za-z0-9_]+|Vistoria_Antecipada)\b", ident.get("Evento AJO", "") or md)
        set_m = re.search(r"sourceEventType[`\s=]+`?([a-zA-Z0-9]+)`?", md)
        formulas = _gextract_formulas(md)
        activities, aseen = [], set()
        for rx in (_GACT_RE, _GTPL_RE, _GASSET_RE):
            for m2 in rx.finditer(md):
                v = m2.group(0)
                if v.lower() not in aseen:
                    aseen.add(v.lower()); activities.append(v)
        variables = _gvariables(md)
        body = "\n".join(lines[1:])
        # pool geral de tokens `backtick` (V2-N, templates, emailIds, DEs...) só p/ busca
        tickpool = set()
        for ln2 in md.splitlines():
            for t in re.findall(r"`([^`]{2,60})`", ln2):
                if t.strip(): tickpool.add(t.strip())
            if ln2.lstrip().startswith("|"):  # nomes com _ em tabelas (templates sem backtick etc.)
                for w in re.findall(r"[A-Za-z][A-Za-z0-9]*_[A-Za-z0-9_]+", ln2):
                    tickpool.add(w)
        ticks = sorted(tickpool)
        search_index = " ".join(
            [title, bu_raw, _GUIDE_BU_LABEL.get(bu_raw, ""), pattern,
             (ev_m.group(1) if ev_m else ""), (set_m.group(1) if set_m else "")]
            + activities + variables + [f["expr"] for f in formulas] + ticks
        ).lower()
        entries.append({
            "id": fp.stem.replace("instrucao_mapeamento_", ""),
            "file": fp.name,
            "title": title,
            "pattern": pattern,
            "bu": _GUIDE_BU_LABEL.get(bu_raw, bu_raw or "—"),
            "ajoEvent": ev_m.group(1) if ev_m else None,
            "sourceEventType": set_m.group(1) if set_m else None,
            "complexity": _gcomplexity(title, ranks),
            "formulas": formulas,
            "activities": activities,
            "variables": variables,
            "searchIndex": search_index,
            "sectionsHtml": _gmd_to_html(body),
        })
    print(f"[guia] {len(entries)} jornadas; "
          f"{sum(len(e['formulas']) for e in entries)} fórmulas; "
          f"ranking casado em {sum(1 for e in entries if e['complexity'])}/{len(entries)}")
    return entries


# ----------------------------------------------------------------------------
def main():
    if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
        sys.stdout.reconfigure(encoding="utf-8")

    depara_list, depara_index = parse_de_para(DE_PARA_DIR)
    ajo_map = build_ajo_event_map(AJO_EVENTS_DIR)
    added = [k for k in PROPOSED_EVENTS if k not in ajo_map]
    for k in added:
        ajo_map[k] = PROPOSED_EVENTS[k]
    print(f"[ajo] +{len(added)} nomes propostos aplicados (lacunas sem evento real)")
    depara_stats = annotate_depara(depara_list, ajo_map)  # aplica override + marca status/faltantes
    wpp_data = build_wpp(PAYLOADS_DIR, depara_index, ajo_map)
    infobip_data = build_infobip(INFOBIP_DIR)
    guide_data = build_guide(GUIDE_DIR)

    config = {
        "phoneXdm": PHONE_XDM,
        "botNumbers": BOT_NUMBERS,
        "deparaStats": depara_stats,
    }

    OUT_DATA.parent.mkdir(parents=True, exist_ok=True)
    content = (
        "// GERADO por build_site.py — não editar à mão.\n"
        f"window.DEPARA_DATA = {json.dumps(depara_list, ensure_ascii=False)};\n"
        f"window.WPP_DATA = {json.dumps(wpp_data, ensure_ascii=False)};\n"
        f"window.INFOBIP_DATA = {json.dumps(infobip_data, ensure_ascii=False)};\n"
        f"window.GUIDE_DATA = {json.dumps(guide_data, ensure_ascii=False)};\n"
        f"window.SITE_CONFIG = {json.dumps(config, ensure_ascii=False)};\n"
    )
    OUT_DATA.write_text(content, encoding="utf-8")
    size_kb = OUT_DATA.stat().st_size / 1024
    print(f"OK -> {OUT_DATA} ({size_kb:.0f} KB)")

    # Cache-busting (GitHub Pages): carimba um hash curto de data.js+app.js no loader
    # do index.html irmão. Só age onde existe o marcador BUILD_VER (site); na extensão
    # o index.html não tem o marcador -> no-op.
    try:
        app_txt = (OUT_DATA.parent / "app.js").read_text(encoding="utf-8")
    except OSError:
        app_txt = ""
    ver = hashlib.sha1((content + app_txt).encode("utf-8")).hexdigest()[:10]
    idx_path = OUT_DATA.parent / "index.html"
    if idx_path.exists():
        idx = idx_path.read_text(encoding="utf-8")
        idx2, n = re.subn(r"(var ver = ')[^']*(';\s*/\* BUILD_VER)", r"\g<1>" + ver + r"\g<2>", idx)
        if n:
            idx_path.write_text(idx2, encoding="utf-8")
            print(f"[cache-bust] index.html ver -> {ver}")


if __name__ == "__main__":
    main()
