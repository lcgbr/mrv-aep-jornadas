"""
Gerador único do site estático MRV AEP — Jornadas (DE-PARA + WhatsApp SFMC→AJO).
Lê os .md de de-para e os payloads WhatsApp e escreve data.js (raiz do site).
Aposenta o antigo generate_data.js (Node).

Rode localmente (onde as pastas-fonte existem) e faça commit dos arquivos do site.
    python build_site.py
"""
import json
import re
import sys
from pathlib import Path

# ============================================================================
# ⚠️  PREENCHER: prefixo do evento AJO (FIXO p/ todas as jornadas).
# Variável final = {{ <AJO_EVENT_PREFIX><pathXDM> }}
# Enquanto contiver "__PREENCHER__", o site mostra um aviso no topo.
# ============================================================================
AJO_EVENT_PREFIX = "Event.__PREENCHER__."
PHONE_XDM = "_mrv.identityEvents.phone"
BOT_NUMBERS = {
    "PRD": {"MariaRosa": "553199009000", "BotComercial": "558007289000"},
    "QAS": {"MariaRosa": "553173160076", "BotComercial": "553173160076"},
}

# ----------------------------------------------------------------------------
# Fontes (ajuste se rodar fora da máquina de origem)
# ----------------------------------------------------------------------------
DE_PARA_DIR = Path(r"d:\Projetos\clientes\MRV\AEP\docs_markdown\de_para_jornadas")
PAYLOADS_DIR = Path(r"d:\Projetos\clientes\MRV\AJO\mrv-sfmc-ajo-migration\whatsapp_payloads")
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
        index.append({"journeyName": journey_name, "buLabel": bu, "fields_map": fields_map})

    print(f"[de-para] {len(jornadas)} jornadas carregadas")
    return jornadas, index


def _norm_bu(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def match_de_para(bu: str, journey_name: str, index: list) -> dict:
    jn = (journey_name or "").strip().lower()
    cands = [e for e in index if e["journeyName"].strip().lower() == jn]
    if not cands:
        return {}
    if len(cands) == 1:
        return cands[0]["fields_map"]
    pbu = _norm_bu(bu)
    for e in cands:
        ebu = _norm_bu(e["buLabel"])
        if ebu and ebu in pbu:
            return e["fields_map"]
    return {}


# ----------------------------------------------------------------------------
# WhatsApp — payloads + de-para por jornada
# ----------------------------------------------------------------------------

def build_wpp(payloads_dir: Path, de_para_index: list):
    index_path = payloads_dir / "_indice_whatsapp.json"
    if not index_path.exists():
        print(f"[wpp] índice não encontrado: {index_path}")
        return {}

    with open(index_path, "r", encoding="utf-8") as f:
        index_data = json.load(f)

    data_by_bu = {}
    matched = 0
    for j in index_data.get("jornadas", []):
        bu, jid = j["bu"], j["journeyId"]
        file_path = payloads_dir / bu / f"{jid}.json"
        if not file_path.exists():
            continue
        with open(file_path, "r", encoding="utf-8") as f:
            journey = json.load(f)
        fields = match_de_para(journey.get("bu", bu), journey.get("journeyName", ""), de_para_index)
        journey["_deParaFields"] = fields
        if fields:
            matched += 1
        data_by_bu.setdefault(bu, []).append(journey)

    total = sum(len(v) for v in data_by_bu.values())
    print(f"[wpp] {total} jornadas; com de-para resolvido: {matched}/{total}")
    return data_by_bu


# ----------------------------------------------------------------------------
def main():
    if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
        sys.stdout.reconfigure(encoding="utf-8")

    depara_list, depara_index = parse_de_para(DE_PARA_DIR)
    wpp_data = build_wpp(PAYLOADS_DIR, depara_index)

    config = {
        "ajoEventPrefix": AJO_EVENT_PREFIX,
        "phoneXdm": PHONE_XDM,
        "botNumbers": BOT_NUMBERS,
    }

    OUT_DATA.parent.mkdir(parents=True, exist_ok=True)
    content = (
        "// GERADO por build_site.py — não editar à mão.\n"
        f"window.DEPARA_DATA = {json.dumps(depara_list, ensure_ascii=False)};\n"
        f"window.WPP_DATA = {json.dumps(wpp_data, ensure_ascii=False)};\n"
        f"window.SITE_CONFIG = {json.dumps(config, ensure_ascii=False)};\n"
    )
    OUT_DATA.write_text(content, encoding="utf-8")
    size_kb = OUT_DATA.stat().st_size / 1024
    print(f"OK -> {OUT_DATA} ({size_kb:.0f} KB)")


if __name__ == "__main__":
    main()
