"""
Gerador único do site estático MRV AEP — Jornadas (DE-PARA + WhatsApp SFMC→AJO).
Lê os .md de de-para e os payloads WhatsApp e escreve data.js (raiz do site).
Aposenta o antigo generate_data.js (Node).

Rode localmente (onde as pastas-fonte existem) e faça commit dos arquivos do site.
    python build_site.py
"""
import difflib
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
    "QAS": {"MariaRosa": "553173160076", "BotComercial": "553173160076"},
}

# Nomes de evento AJO PROPOSTOS (ainda não criados no AJO) p/ as jornadas sem evento —
# ver jornadas_eventos_ajo.md (coluna Status Evento = novo/reapontar). Chave =
# sourceEventType (lower). Só preenche lacunas: eventos reais do JSON têm prioridade.
PROPOSED_EVENTS = {
    "assistenciatecnicaagendamentovistoriaantecipada": "MRV_FTP_Agend_Visto_Antecip",
    "assistenciatecnicaimplantacaocondominio": "MRV_FTP_Implant_Condominio",
    "assistenciatecnicawhatsnpsprofissionalatencaosindico": "MRV_FTP_NPS_Prof_Aten_Sind",
    "assistenciatecnicawhatsappvareagendamento": "MRV_FTP_VA_Reagendamento",
    "assistenciatecnicawhatsappvareparosfinalizados": "MRV_FTP_VA_Reparos_Final",
    "assistenciatecnicawhatsenviochavesfechaduraeletronica": "MRV_FTP_Envio_Chaves_Fech",
    "cobrancaanteciparwpp2": "MRV_FTP_Antecipar_Wpp2",
    "cobrancajbwedoemail": "MRV_FTP_Cob_Wedo_Email",
    "cobrancacobrancaluggo": "MRV_FTP_Cobranca_Luggo",
    "cobrancawppaditivo": "MRV_FTP_Wpp_Aditivo",
    "cobrancawhatsabatimentonegociacao": "MRV_FTP_Abatimento_Negoc",
    "cobrancawhatsapprenegociar2023": "MRV_FTP_Renegociar_2023",
    "marketplacejraquecimentolancamentos": "MRV_FTP_Aquecimento_Lanc",
    "relacionamentopatrimoniocomissaoafetacao": "MRV_FTP_Patrim_Comis_Afet",
    "relacionamentowhatsappdirecionamentocca": "MRV_FTP_Direcionamento_CCA",
    "relacionamentowhatsappdisparopesquisareclameaqui": "MRV_FTP_Disp_Pesq_Recl_Aqui",
    "relacionamentoreagendamentovisita": "MRV_FTP_Reagend_Visita",
    "relacionamentovisitaaobrav2": "MRV_FTP_Visita_Obra_V2",
    "relacionamentowhatspremioreclame": "MRV_FTP_Premio_Reclame",
    "relacionamentowhatsappdisparopesquisanps": "MRV_FTP_Disp_Pesq_NPS",
    "sensiaboasvindasnovasensiaftp": "MRV_FTP_Sen_BoasVindas",
    "sensiaeleicaocomissaodepa": "MRV_FTP_Sen_Eleic_Comis_PA",
    "sensiaimplantacaocondcopy": "MRV_FTP_Sen_Implant_Cond",
    "sensiajbwedoemail": "MRV_FTP_Sen_Wedo_Email",
    "sensiaconvocacaoeleicaopa": "MRV_FTP_Sen_Convoc_Elei_PA",
    "sensiajurosobra": "MRV_FTP_Sen_Juros_Obra",
    "sensiamiaagendamentovistoriaporemail": "MRV_FTP_Sen_Mia_Agend_Vist",
    "sensiaposassinatura": "MRV_FTP_Sen_Pos_Assinatura",
    "sensiarenegociacao": "MRV_FTP_Sen_Renegociacao",
}

# Override central de de-para de CAMPOS (corpo/botão) que não vêm das fichas.
# Chave = nome do evento AJO; valor = { campo_minusculo: destino }.
# Destino = caminho XDM (vira @event{evento.destino}) OU, se NÃO for caminho XDM
# (ex.: texto com espaço), valor ESTÁTICO literal — o app.js decide via isXdmPath.
PROPOSED_FIELD_MAP = {
    "MRV_FTP_Whats_Antecipacao_Prem": {
        "nome": "person.name.fullName",
        "desconto": "_mrv.contractBillingEvent.discountAmount",
        "prazo": "_mrv.contractBillingEvent.deadline",
        "quero economizar": "Quero economizar",   # estático (payload fixo do botão)
    },
    "MRV_FTP_Contrato_Pend_Assin": {
        "nome": "person.name.fullName",
        "nome_empreendimento": "_mrv.condominiumEvent.buildingName",
    },
    "MRV_FTP_Direcionamento_CCA": {
        "cliente": "_mrv.productOffer.clientCCA",
        "nome_cca": "_mrv.productOffer.nameCCA",
    },
    "MRV_FTP_Disp_Oferta_Parc": {"primeiro_nome": "person.name.firstName"},
    "MRV_FTP_Disp_Pesq_NPS": {"nome": "person.name.fullName"},
    "MRV_FTP_Disp_Pesq_Recl_Aqui": {"nome": "person.name.fullName"},
    "MRV_FTP_Disp_Relancamento": {"empreendimento": "_mrv.condominiumEvent.buildingName"},
    "MRV_FTP_Disparo_Divulg_Armario": {
        "primeiro_nome": "person.name.firstName",
        "empreendimento": "_mrv.condominiumEvent.buildingName",
    },
    "MRV_FTP_Disparo_Serv_Morador": {"primeiro_nome": "person.name.firstName"},
    "MRV_FTP_Semi_Aut_Lancamento": {
        "primeiro_nome": "person.name.firstName",
        "empreendimento": "_mrv.condominiumEvent.buildingName",
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
                continue
            if line.startswith("## 3."):
                in_table = False

            if in_table and line.startswith("|") and "---" not in line and "Campo CSV" not in line:
                parts = [p.strip() for p in line.split("|")]
                if len(parts) >= 6:
                    csv_field = parts[2].replace("`", "")
                    aep_field = parts[3].replace("`", "")
                    fg = parts[4]
                    tipo = parts[5]
                    obs = parts[6] if len(parts) >= 7 else ""
                    if csv_field and aep_field:
                        fields.append({
                            "csvField": csv_field, "aepField": aep_field,
                            "fg": fg, "type": tipo, "obs": obs,
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
def main():
    if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
        sys.stdout.reconfigure(encoding="utf-8")

    depara_list, depara_index = parse_de_para(DE_PARA_DIR)
    ajo_map = build_ajo_event_map(AJO_EVENTS_DIR)
    added = [k for k in PROPOSED_EVENTS if k not in ajo_map]
    for k in added:
        ajo_map[k] = PROPOSED_EVENTS[k]
    print(f"[ajo] +{len(added)} nomes propostos aplicados (lacunas sem evento real)")
    wpp_data = build_wpp(PAYLOADS_DIR, depara_index, ajo_map)
    infobip_data = build_infobip(INFOBIP_DIR)

    config = {
        "phoneXdm": PHONE_XDM,
        "botNumbers": BOT_NUMBERS,
    }

    OUT_DATA.parent.mkdir(parents=True, exist_ok=True)
    content = (
        "// GERADO por build_site.py — não editar à mão.\n"
        f"window.DEPARA_DATA = {json.dumps(depara_list, ensure_ascii=False)};\n"
        f"window.WPP_DATA = {json.dumps(wpp_data, ensure_ascii=False)};\n"
        f"window.INFOBIP_DATA = {json.dumps(infobip_data, ensure_ascii=False)};\n"
        f"window.SITE_CONFIG = {json.dumps(config, ensure_ascii=False)};\n"
    )
    OUT_DATA.write_text(content, encoding="utf-8")
    size_kb = OUT_DATA.stat().st_size / 1024
    print(f"OK -> {OUT_DATA} ({size_kb:.0f} KB)")


if __name__ == "__main__":
    main()
