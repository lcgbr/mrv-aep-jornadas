# Vistoria Antecipada — variáveis e condições para o AJO

**Jornada de origem (SFMC):** `Jornada VA 03 - Jornada de Revistoria` — BU `mrv-assistencia-tecnica`
**Arquivo:** `AJO/mrv-sfmc-ajo-migration/NEW_RAW/mrv-assistencia-tecnica/a2fc65ea-0e17-4831-b8dc-f12f1a2d1485.json` (29 activities)
**Evento AJO:** `Vistoria_Antecipada` · schema `_mrv.earlyInspectionDetails.*` + `_mrv.identityEvents.*`
**Data:** 2026-07-08

> **Insight de migração:** no SFMC cada decisão tem 2 partes — `IdVistoria = Event.IdVIstoria` (+ `Email`) só para **fazer o lookup na Data Extension de estado `Controle_Status_VA`**, e depois o teste real (`StatusVA`/`UnidadeBloqueada`…). **No AJO isso NÃO é necessário**: o evento `Vistoria_Antecipada` já carrega o status no payload. As condições abaixo já vêm **simplificadas** (sem o lookup de `IdVistoria`/`Email`).

---

## 1. Sintaxe do editor de condições (AJO) — confirmada na doc

Estas expressões são para o **editor de expressão avançada** das decisões/condições (NÃO usam o wrapper `{%= %}`, que é só para conteúdo de mensagem).

| Operador/função | Sintaxe | Fonte |
|---|---|---|
| Igual | `A == "valor"` | Operators |
| Diferente | `A != "valor"` | Operators |
| Contém | `contains(A, "sub")` (3º arg opcional = case-sensitive) | String functions |
| E / OU / NÃO | `and` · `or` · `not` (minúsculos) | Operators |
| Campo do evento | `@event{Vistoria_Antecipada.<pathXDM>}` | Field references |
| Com default | `@event{Vistoria_Antecipada.<path>, defaultValue: ""}` | Field references |

> **Robustez (recomendado nos `!=`):** campo ausente retorna `null`. Para o teste ser determinístico, use `defaultValue: ""` — ex.: `@event{Vistoria_Antecipada._mrv.earlyInspectionDetails.inspectionStatus, defaultValue: ""} != "Cancelada"` (null vira `""`, então continua como "não cancelada").

---

## 2. Inventário de variáveis → `@event{}`

| Campo SFMC | Caminho XDM | Expressão AJO |
|---|---|---|
| `StatusVA` | `_mrv.earlyInspectionDetails.inspectionStatus` | `@event{Vistoria_Antecipada._mrv.earlyInspectionDetails.inspectionStatus}` |
| `UnidadeBloqueada` | `_mrv.earlyInspectionDetails.isUnitBlocked` | `@event{Vistoria_Antecipada._mrv.earlyInspectionDetails.isUnitBlocked}` |
| `Procurador` | `_mrv.earlyInspectionDetails.hasProxy` | `@event{Vistoria_Antecipada._mrv.earlyInspectionDetails.hasProxy}` |
| `Marca` | `_mrv.earlyInspectionDetails.brand` | `@event{Vistoria_Antecipada._mrv.earlyInspectionDetails.brand}` |
| `Empreendimento` ⚠️ | `_mrv.earlyInspectionDetails.property` | `@event{Vistoria_Antecipada._mrv.earlyInspectionDetails.property}` |
| `IdVIstoria` | `_mrv.earlyInspectionDetails.inspectionId` | `@event{Vistoria_Antecipada._mrv.earlyInspectionDetails.inspectionId}` |
| `DataAgendamento` | `_mrv.earlyInspectionDetails.scheduledDate` | `@event{Vistoria_Antecipada._mrv.earlyInspectionDetails.scheduledDate}` |
| (hora) | `_mrv.earlyInspectionDetails.scheduledTime` | `@event{Vistoria_Antecipada._mrv.earlyInspectionDetails.scheduledTime}` |
| `Email` | `_mrv.identityEvents.email` | `@event{Vistoria_Antecipada._mrv.identityEvents.email}` |
| `Celular` | `_mrv.identityEvents.phone` | `@event{Vistoria_Antecipada._mrv.identityEvents.phone}` |

⚠️ `Empreendimento` → mapeado para `property`. Se no schema o nome do empreendimento estiver em `productName`, troque o path. (A confirmar nos dados reais.)

**Demais campos do schema (disponíveis, não usados nesta jornada):**
`_mrv.earlyInspectionDetails.` → `isRescheduled`, `cancellationDate`, `cancellationReason`, `cancellationReasonDescription`, `blockReason`, `blockReasonDescription`, `productName`, `ingestedAt`, `updatedAt` ·
`_mrv.identityEvents.` → `cpfHash`, `phoneEmail`, `rg`, `ecid` ·
topo → `_id`, `eventType`, `timestamp`

---

## 3. Expressões completas — as 11 decisões

### 1) SENSIA? — marca/empreendimento Sensia  *(ConditionSet = OR)*
```
contains(@event{Vistoria_Antecipada._mrv.earlyInspectionDetails.brand}, "Sensia") or contains(@event{Vistoria_Antecipada._mrv.earlyInspectionDetails.property}, "Reserva Vila do Sol")
```
- **É Sensia** → expressão acima = `true`
- **É MRV** → `not (…)` da expressão acima

### 2) VA Cancelada? — ramo "NÃO cancelada / segue" (V2-2, V2-11)
```
@event{Vistoria_Antecipada._mrv.earlyInspectionDetails.inspectionStatus, defaultValue: ""} != "Cancelada"
```

### 3) VA Cancelada? — ramo "cancelada" (V2-7)
```
@event{Vistoria_Antecipada._mrv.earlyInspectionDetails.inspectionStatus} == "Cancelada"
```

### 4) Unidade bloqueada? (V2-1, V2-3, V2-6)
- **NÃO bloqueada (segue):**
```
@event{Vistoria_Antecipada._mrv.earlyInspectionDetails.isUnitBlocked} == "Não"
```
- **Bloqueada:**
```
@event{Vistoria_Antecipada._mrv.earlyInspectionDetails.isUnitBlocked, defaultValue: ""} != "Não"
```

### 5) Cliente reagendou vistoria? (V2-5)
```
@event{Vistoria_Antecipada._mrv.earlyInspectionDetails.inspectionStatus} == "AguardandoRevistoria"
```
- **Alternativa** (se preferir o booleano dedicado do schema):
```
@event{Vistoria_Antecipada._mrv.earlyInspectionDetails.isRescheduled} == "Sim"
```

### 6) Status VA — aguardando agendamento da revistoria (V2-4)
```
@event{Vistoria_Antecipada._mrv.earlyInspectionDetails.inspectionStatus} == "AguardandoAgendamentoRevistoria"
```

### 7) Vistoria Aprovada? (V2-23)
- **Aprovada:**
```
@event{Vistoria_Antecipada._mrv.earlyInspectionDetails.inspectionStatus} == "Aprovada"
```
- **Reprovada (outro ramo):**
```
@event{Vistoria_Antecipada._mrv.earlyInspectionDetails.inspectionStatus, defaultValue: ""} != "Aprovada"
```

### 8) Procurador? (V2-10)  *(SFMC testava "sem procurador")*
- **Sem procurador:**
```
@event{Vistoria_Antecipada._mrv.earlyInspectionDetails.hasProxy} == "Não"
```
- **Com procurador:**
```
@event{Vistoria_Antecipada._mrv.earlyInspectionDetails.hasProxy} == "Sim"
```

---

## 4. Valores possíveis (enums)

- **`inspectionStatus`** (`StatusVA`): `Aprovada` · `Cancelada` · `AguardandoRevistoria` · `AguardandoAgendamentoRevistoria` · `Reprovada` *(inferido: e-mail C09 "Reprovação" + template `chaves_va_reprovada_prd` + ramo "não aprovada")*
- **`isUnitBlocked`** (`UnidadeBloqueada`): `Não` · `Sim`
- **`hasProxy`** (`Procurador`): `Não` · `Sim`
- **`isRescheduled`**: `Não` · `Sim`
- **`brand`** (`Marca`): `Sensia` · `MRV` (teste com `contains`)
- **`property`** (`Empreendimento`): ex. `Reserva Vila do Sol` (teste com `contains`)

⚠️ Todos são **strings** (o schema tipa `isUnitBlocked`/`hasProxy`/`isRescheduled` como `string`, não boolean). Teste contra `"Não"`/`"Sim"`, **não** `true`/`false`.

---

## 5. Timers (WAIT por atributo)

- **"on DataAgendamento"** → aguardar até `@event{Vistoria_Antecipada._mrv.earlyInspectionDetails.scheduledDate}` (combinar com `scheduledTime` p/ hora).
- **"2 days before DataAgendamento"** → timer relativo a `scheduledDate` (−2 dias).

---

## 6. Envios da jornada

- **WhatsApp (REST-1/2/3):** template `chaves_va_reprovada_prd`, `userNumber` ← `@event{Vistoria_Antecipada._mrv.identityEvents.phone}`.
- **E-mails (8):** C04, C04_1, C05, C08 (aprovação), C09 (reprovação), C10 (agendamento revistoria), C11 (unidade liberada) ×2.

---

## Notas / a confirmar
1. `Empreendimento` → `property` vs `productName` (verificar `_event.json`).
2. `Reprovada` como valor de `inspectionStatus` é inferido — confirmar o valor exato que o sistema grava.
3. Reagendamento: a jornada SFMC detecta via `inspectionStatus == "AguardandoRevistoria"`; o schema também tem `isRescheduled` — escolher a fonte canônica com o time de dados.
