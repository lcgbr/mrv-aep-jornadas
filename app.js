/* MRV AEP — Jornadas · app único (visão DE-PARA + visão WhatsApp SFMC→AJO)
   Dados em data.js (window.DEPARA_DATA, window.WPP_DATA, window.SITE_CONFIG). */

const DEPARA = window.DEPARA_DATA || [];
const WPP = window.WPP_DATA || {};
// Jornadas Infobip (gestao-vendas-p) entram no WPP p/ reaproveitar lista/busca/seleção.
// Cada envio é uma pseudo-atividade com _infobip (payload no formato-alvo Infobip).
const INFOBIP_DATA = window.INFOBIP_DATA || {};
Object.keys(INFOBIP_DATA).forEach(function (bu) {
    WPP[bu] = (WPP[bu] || []).concat(INFOBIP_DATA[bu] || []);
});
const CFG = window.SITE_CONFIG || {};
const BOT_NUMBERS = CFG.botNumbers || { PRD: {}, QAS: {} };
const PHONE_XDM = CFG.phoneXdm || '_mrv.identityEvents.phone';
// Guia de Variáveis: specs de mapeamento das jornadas complexas (1 entrada/jornada).
const GUIDE = window.GUIDE_DATA || [];

let currentView = 'depara';   // 'depara' | 'whatsapp' | 'guia'
let currentBotEnv = 'PRD';    // 'PRD' | 'QAS'
let selectedDeParaId = null;
let selectedWpp = null;       // { journeyId, activityId }
let selectedGuideId = null;   // id da spec selecionada na visão Guia
let currentGuideFormulas = []; // fórmulas da spec aberta (p/ copiar por índice)
let currentAjoStr = '';        // payload AJO como JSON identado (visualização)
let currentAjoPayload = null;  // objeto do payload AJO atual (p/ copiar como string ou JSON)

// Overrides globais aplicados a TODOS os payloads quando currentBotEnv === 'QAS'.
// Campo vazio = não sobrescreve. templateName vazio = mantém o automático _prd->_qas
// por jornada; preenchido = força o MESMO nome em todos os payloads.
const QAS_OVERRIDES = { userNumber: '', namespaceId: '', templateName: '', suffixSwap: true };

// Sender Infobip (WhatsApp) por ambiente — os payloads salvos trazem o de PRD;
// em QAS o sender é trocado na renderização/cópia (conta Infobip de homologação).
const INFOBIP_SENDERS = { PRD: '553173000653', QAS: '553173000112' };

// Remove zero-width/BOM (achado: 14 payloads têm  grudado no namespaceId).
function cleanInvisible(s) {
    return String(s == null ? '' : s)
        .split('')
        .filter(function (ch) {
            var c = ch.charCodeAt(0);
            return !((c >= 0x200B && c <= 0x200F) || (c >= 0x202A && c <= 0x202E) || c === 0xFEFF);
        })
        .join('')
        .trim();
}

// ============================ Util ============================
function escapeHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function isXdmPath(v) {
    return typeof v === 'string' && /^[A-Za-z_][\w]*(\.[\w]+)+/.test(v.trim());
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (msg) toast.textContent = msg;
    toast.classList.remove('opacity-0');
    setTimeout(() => toast.classList.add('opacity-0'), 2000);
}

function copyToClipboard(text, msg) {
    navigator.clipboard.writeText(text).then(() => showToast(msg)).catch(err => {
        console.error('Falha ao copiar:', err);
        alert('Erro ao copiar para a área de transferência.');
    });
}

// Duas formas de copiar o payload AJO. Padrão = STRING: JSON compacto (1 linha, sem
// espaços) escapado e entre aspas, ex.: "{\"templateName\":...}". JSON.stringify já
// escapa qualquer controle; .trim() garante zero espaço/quebra de linha nas pontas.
// Escapa um trecho de texto para caber num literal de string do AJO ("...").
// Barra invertida primeiro, depois aspas (ordem importa p/ não re-escapar).
function escapeForAjoString(s) {
    return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

// Payload AJO (objeto) -> expressão concat([...]) p/ colar no jsonValue do Custom Action.
// Cada @event{...} vira uma ENTRADA sem aspas; o texto estático ao redor vira entrada
// string (aspas escapadas). Vars residuais {{Event...}} (SEM DESTINO) ficam DENTRO do
// literal — não são expressão AJO válida; resolver o de-para antes de usar.
function buildConcatExpression(payload) {
    const json = JSON.stringify(payload || {});   // JSON compacto (1 linha)
    const re = /@event\{[^}]+\}|#\{[^}]+\}/g;   // @event{} e #{dataSource} = entradas nuas
    const entries = [];
    let last = 0, m;
    while ((m = re.exec(json)) !== null) {
        const lit = json.slice(last, m.index);
        if (lit) entries.push('"' + escapeForAjoString(lit) + '"');
        entries.push(m[0]);                        // @event{...} sem aspas
        last = m.index + m[0].length;
    }
    const tail = json.slice(last);
    if (tail) entries.push('"' + escapeForAjoString(tail) + '"');
    if (entries.length === 0) entries.push('""');
    return 'concat([' + entries.join(',') + '])';
}

// Cópia principal p/ AJO: expressão concat([...]) (cada variável @event vira 1 entrada).
function copyAjoString() {
    copyToClipboard(buildConcatExpression(currentAjoPayload || {}).trim(), 'Copiado como concat!');
}
function copyAjoJson() {
    copyToClipboard((currentAjoStr || '').trim(), 'Copiado como JSON!');
}

// ============================ Conversão de variáveis SFMC → AJO ============================
// 3 fontes possíveis no SFMC: DEAudience, AutomationAud, APIEvent.
const SF_VAR_RE = /\{\{Event\.(?:DEAudience|AutomationAud|APIEvent)-[^.}]+\.([^}]+)\}\}/g;
const PHONE_FIELDS = new Set(['telefone', 'celular']); // regra global confirmada

// Jornadas de AUDIÊNCIA/batch (sem evento unitário): as variáveis vêm do PROFILE
// (#{ExperiencePlatform.ProfileFieldGroup.profile.<path>}), não de @event{}.
const PROFILE_DS = 'ExperiencePlatform.ProfileFieldGroup.';
const PROFILE_PHONE = 'profile.mobilePhone.number';
const PROFILE_FIELD_MAP = {};   // field_lower -> 'profile.<xdmPath>' (variáveis do corpo do template)
const PROFILE_JOURNEYS = new Set([
    '6b755002-02a8-4936-a38a-14b06377ac0a',   // Boas Vindas_FTP (Relacionamento) — mia_cadastroplataforma_prd
    '6fe3f1f6-81be-4d44-9080-326debd66207',   // Jornada Boas Vindas Whatsapp (Relacionamento, não-FTP) — mia_cadastroplataforma_prd
]);

function resolveXdm(field, deParaFields) {
    const key = (field || '').trim().toLowerCase();
    if (PHONE_FIELDS.has(key)) return PHONE_XDM;        // 1. regra global de telefone
    const v = deParaFields ? deParaFields[key] : null;   // 2. de-para da jornada
    return v || null;                                    // 3. sem destino -> fallback
}

// Jornada de audiência: campo SFMC -> caminho no profile (telefone é regra global).
function resolveProfile(field) {
    const key = (field || '').trim().toLowerCase();
    if (PHONE_FIELDS.has(key)) return PROFILE_PHONE;
    return PROFILE_FIELD_MAP[key] || null;
}

// Converte os merge fields SFMC -> @event{<NomeDoEvento>.<pathXDM>}.
// Sem evento AJO da jornada (ajoEvent null) OU campo sem path conhecido:
// mantém o {{Event...}} original e registra em warnings.
function convertVar(str, deParaFields, ajoEvent, warnings, profileMode) {
    if (!str) return str;
    return str.replace(SF_VAR_RE, function (full, field) {
        // Jornada de audiência/batch: variável vem do PROFILE -> #{...profile.<path>}.
        if (profileMode) {
            const pp = resolveProfile(field);
            if (pp) return '#{' + PROFILE_DS + pp + '}';
            if (warnings && warnings.indexOf(full) === -1) warnings.push(full);
            return full;
        }
        const xdm = ajoEvent ? resolveXdm(field, deParaFields) : null;
        // caminho XDM -> @event{}; valor não-XDM (ex.: texto do de-para) -> literal estático.
        if (xdm) return isXdmPath(xdm) ? ('@event{' + ajoEvent + '.' + xdm + '}') : xdm;
        if (warnings && warnings.indexOf(full) === -1) warnings.push(full);
        return full; // fallback: mantém {{Event...}} original
    });
}

// quick_reply carrega `payload`; url carrega `text`. Espelha buttonParamType de
// lima-payload-generator/src/utils/payloadGenerator.js — o tipo/campo do parâmetro
// é DITADO pelo buttonSubtype (contrato WhatsApp aprovado no Meta), não pelo `type`
// do dado SFMC (que vem errado para os botões url e omitido no mia_itbi_prd).
function buttonParamType(buttonSubtype) {
    return buttonSubtype === 'url' ? 'text' : 'payload';
}

// Transformação SFMC → AJO (botões normalizados pelo contrato WhatsApp)
function mapToAjoFormat(journey, act) {
    const sfmc = act.payload || {};
    const deParaFields = (journey && journey._deParaFields) || {};
    const ajoEvent = (journey && journey._ajoEvent) || null;  // nome do evento unitário AJO
    const profileMode = PROFILE_JOURNEYS.has((journey && journey.journeyId) || '');
    const warnings = [];

    const botName = sfmc.botName || '';
    const botNumber = (BOT_NUMBERS[currentBotEnv] || {})[botName] || '';

    const components = [];

    const texts = sfmc.templateText || [];
    if (texts.length > 0) {
        components.push({
            type: 'body',
            parameters: texts.map(t => ({ type: 'text', text: convertVar(t, deParaFields, ajoEvent, warnings, profileMode) }))
        });
    }

    (sfmc.templateMedia || []).forEach(m => {
        const pt = m.parameterType;
        if (pt === 'image' || pt === 'video' || pt === 'document') {
            const param = { type: pt };
            param[pt] = { link: convertVar(m.link, deParaFields, ajoEvent, warnings, profileMode) };
            components.push({ type: m.componentType, parameters: [param] });
        }
    });

    // Normaliza buttonIndex p/ 0-based (Meta exige). Dados SFMC misturam 0-based e
    // 1-based; se NENHUM botao do envio tem indice 0, o conjunto e 1-based -> -1
    // (ex.: chaves_va_reagendamento [1]->[0]; reneg_renegociar [2,1]->[1,0]).
    const rawButtons = sfmc.templateButton || [];
    const oneBasedBtns = rawButtons.length > 0 && rawButtons.every(b => (b.buttonIndex || 0) >= 1);
    rawButtons.forEach(b => {
        // O parâmetro segue o buttonSubtype: url → {type:'text', text}, quick_reply →
        // {type:'payload', payload}. Corrige dados SFMC que guardam a URL em `payload`
        // ou omitem `type` (ex.: botões url NPS/reclame, mia_itbi_prd).
        const paramType = buttonParamType(b.buttonSubtype);
        const rawValue = paramType === 'text'
            ? (b.text || b.payload || '')
            : (b.payload || b.text || '');
        const parameter = { type: paramType };
        const value = convertVar(rawValue, deParaFields, ajoEvent, warnings, profileMode);
        if (value) parameter[paramType] = value;
        components.push({
            type: 'button',
            buttonIndex: (b.buttonIndex || 0) - (oneBasedBtns ? 1 : 0),
            buttonSubtype: b.buttonSubtype,
            parameters: [parameter]
        });
    });

    const qas = currentBotEnv === 'QAS';

    // templateName: em QAS, troca sufixo _prd -> _qas (opcional, via checkbox).
    // O override global (campo na barra QAS) vence e força o mesmo nome em todos.
    let templateName = sfmc.templateName || '';
    if (qas && QAS_OVERRIDES.suffixSwap) templateName = templateName.replace(/_prd$/i, '_qas');
    if (qas && QAS_OVERRIDES.templateName.trim()) templateName = QAS_OVERRIDES.templateName.trim();

    // namespaceId: sempre sem zero-width; override QAS tem prioridade se preenchido.
    let namespaceId = cleanInvisible(sfmc.namespaceId);
    if (qas && QAS_OVERRIDES.namespaceId.trim()) namespaceId = QAS_OVERRIDES.namespaceId.trim();

    // userNumber: número de teste (PRD ou QAS) tem prioridade sobre o {{Event...}}.
    // Diferente dos outros overrides, este NÃO é gated em QAS — vale nos dois ambientes.
    let userNumber;
    if (QAS_OVERRIDES.userNumber.trim()) {
        userNumber = QAS_OVERRIDES.userNumber.trim();
    } else {
        userNumber = convertVar(sfmc.userNumber || '', deParaFields, ajoEvent, warnings, profileMode);
    }

    const payload = {
        templateName: templateName,
        namespaceId: namespaceId,
        attachedBot: botName,
        botNumber: botNumber,
        userNumber: userNumber,
        components: components
    };
    return { payload, warnings, ajoEvent };
}

// Realça variáveis no JSON: verde p/ @event{...} convertido, vermelho p/ {{Event...}} SFMC residual
function highlightVars(jsonStr) {
    let out = escapeHtml(jsonStr);
    out = out.replace(/@event\{[^}]+\}/g, m => '<span class="var-ok">' + m + '</span>');
    out = out.replace(/#\{[^}]+\}/g, m => '<span class="var-ok">' + m + '</span>');
    out = out.replace(/\{\{[^}]+\}\}/g, m => '<span class="var-warn">' + m + '</span>');
    return out;
}

// Busca por tokens: TODOS os termos (separados por espaço) devem aparecer no texto,
// em qualquer ordem/posição. Ex.: "disparo pesquisa nps" casa a jornada cujo nome tem
// "disparo pesquisa" e cujo template tem "nps" (mesmo não sendo contíguos).
function matchesQuery(haystack, q) {
    if (!q) return true;
    const hay = (haystack || '').toLowerCase();
    return q.toLowerCase().split(/\s+/).filter(Boolean).every(tok => hay.includes(tok));
}

// ============================ Sidebar (por visão) ============================
function buildSidebar(term) {
    const container = document.getElementById('sidebar-content');
    container.innerHTML = '';
    const q = (term || '').trim().toLowerCase();
    let count = 0;

    if (currentView === 'depara') {
        const filtered = DEPARA.filter(j => {
            // busca também pelos campos da jornada (nome da coluna CSV + destino XDM),
            // p/ achar quem possui, ex., "Empreendimento" ou "Tipo_Contrato".
            const fieldTokens = (j.fields || [])
                .map(f => (f.csvField || '') + ' ' + (f.aepField || '')).join(' ');
            return matchesQuery(
                (j.title || '') + ' ' + (j.bu || '') + ' ' + (j.sourceEventType || '') + ' ' + fieldTokens, q);
        });
        const grouped = {};
        filtered.forEach(j => { (grouped[j.bu] = grouped[j.bu] || []).push(j); });
        Object.keys(grouped).sort().forEach(bu => {
            container.appendChild(buGroup(bu));
            grouped[bu].sort((a, b) => a.title.localeCompare(b.title)).forEach(j => {
                count++;
                container.appendChild(sidebarItem(
                    j.title, 'fa-file-lines',
                    selectedDeParaId === j.id,
                    () => selectDePara(j.id),
                    j.missingCount ? ('⚠️ ' + j.missingCount + ' faltando') : null
                ));
            });
        });
    } else if (currentView === 'guia') {
        // Busca cobre nome da jornada, atividades, variáveis e fórmulas (searchIndex do build).
        const filtered = GUIDE.filter(g => matchesQuery(g.searchIndex || '', q));
        const grouped = {};
        filtered.forEach(g => { (grouped[g.bu] = grouped[g.bu] || []).push(g); });
        Object.keys(grouped).sort().forEach(bu => {
            container.appendChild(buGroup(bu));
            grouped[bu].sort((a, b) => a.title.localeCompare(b.title)).forEach(g => {
                count++;
                container.appendChild(sidebarItem(
                    guideBadge(g.complexity) + ' ' + g.title, 'fa-book-open',
                    selectedGuideId === g.id,
                    () => renderGuide(g.id),
                    g.pattern
                ));
            });
        });
    } else {
        Object.keys(WPP).sort().forEach(bu => {
            const journeys = WPP[bu] || [];
            const matches = [];
            journeys.forEach(journey => {
                (journey.whatsappActivities || []).forEach(act => {
                    const label = act.templateName || act.activityKey || '';
                    const hay = label + ' ' + (journey.journeyName || '') + ' ' + bu;
                    if (matchesQuery(hay, q)) matches.push({ journey, act, label });
                });
            });
            if (!matches.length) return;
            container.appendChild(buGroup(bu));
            matches.forEach(({ journey, act, label }) => {
                count++;
                const active = selectedWpp &&
                    selectedWpp.journeyId === journey.journeyId && selectedWpp.activityId === act.activityId;
                container.appendChild(sidebarItem(
                    label, 'fa-message',
                    active,
                    () => selectWpp(journey, act),
                    journey.journeyName
                ));
            });
        });
    }

    document.getElementById('count-badge').textContent = count;
    if (count === 0) {
        container.innerHTML = '<p class="text-center text-sm text-slate-400 mt-6">Nenhuma jornada encontrada.</p>';
    }
}

function buGroup(bu) {
    const div = document.createElement('div');
    div.className = 'mb-4';
    const title = document.createElement('div');
    title.className = 'text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mb-1';
    title.textContent = bu;
    div.appendChild(title);
    return div;
}

function sidebarItem(label, icon, active, onClick, subtitle) {
    const btn = document.createElement('button');
    btn.className = 'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-start gap-2 mb-0.5 border-l-2 ' +
        (active
            ? 'bg-lima-light border-lima-teal text-lima-teal font-semibold'
            : 'border-transparent text-slate-700 hover:bg-slate-50 hover:border-slate-300');
    const body = subtitle
        ? '<i class="fa-solid ' + icon + ' mt-0.5 ' + (active ? 'text-lima-teal' : 'text-lima-orange') + '"></i>' +
          '<span class="min-w-0"><span class="block truncate">' + escapeHtml(label) + '</span>' +
          '<span class="block truncate text-xs text-slate-400 font-normal">' + escapeHtml(subtitle) + '</span></span>'
        : '<i class="fa-solid ' + icon + ' mt-0.5 ' + (active ? 'text-lima-teal' : 'text-slate-400') + '"></i>' +
          '<span class="truncate">' + escapeHtml(label) + '</span>';
    btn.innerHTML = body;
    btn.onclick = onClick;
    return btn;
}

// ============================ Render: DE-PARA ============================
function selectDePara(id) {
    selectedDeParaId = id;
    buildSidebar(document.getElementById('searchInput').value);
    const j = DEPARA.find(x => x.id === id);
    if (!j) return;

    const card = (icon, label, value) =>
        '<div class="bg-white rounded-xl shadow-md p-4 flex items-center gap-3">' +
        '<div class="w-10 h-10 rounded-lg bg-lima-light text-lima-teal flex items-center justify-center flex-shrink-0">' +
        '<i class="fa-solid ' + icon + '"></i></div>' +
        '<div class="min-w-0"><div class="text-xs uppercase tracking-wide text-slate-400">' + label + '</div>' +
        '<div class="text-sm font-medium text-slate-800 break-words">' + escapeHtml(value || '—') + '</div></div></div>';

    const fieldStatus = f => f.status || (isXdmPath(f.aepField) ? 'ficha' : 'missing');
    const rows = (j.fields || []).map((f, i) => {
        const st = fieldStatus(f);
        const missing = st === 'missing', override = st === 'override';
        const icon = missing ? '<i class="fa-solid fa-triangle-exclamation mr-1"></i>'
            : override ? '<i class="fa-solid fa-arrow-up-right-dots mr-1"></i>' : '';
        const ovrBadge = override
            ? ' <span class="ml-1 text-[10px] bg-lima-light text-lima-teal px-1.5 py-0.5 rounded-full align-middle">atualizado</span>' : '';
        // Regra geral: toda coluna do cabeçalho é obrigatória. Só a exceção merece destaque.
        const optional = /^n[ãa]o/i.test((f.required || 'Sim').trim());
        const reqCell = optional
            ? '<span class="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">Opcional</span>'
            : '<span class="text-xs text-slate-400">Sim</span>';
        return '<tr class="' + (i % 2 ? 'bg-slate-50' : 'bg-white') + '">' +
            '<td class="px-3 py-2 align-top"><span class="code-chip">' + escapeHtml(f.csvField) + '</span></td>' +
            '<td class="px-3 py-2 align-top">' + reqCell + '</td>' +
            '<td class="px-3 py-2 align-top font-mono text-xs ' + (missing ? 'text-lima-orange' : 'text-lima-teal') + '">' +
            icon + escapeHtml(f.aepField) + ovrBadge + '</td>' +
            '<td class="px-3 py-2 align-top">' + (f.fg && f.fg !== '—'
                ? '<span class="bg-lima-light text-lima-teal text-xs font-semibold px-2 py-0.5 rounded-full">' + escapeHtml(f.fg) + '</span>'
                : '<span class="text-slate-300">—</span>') + '</td>' +
            '<td class="px-3 py-2 align-top text-xs text-slate-600">' + escapeHtml(f.type || '—') + '</td>' +
            '<td class="px-3 py-2 align-top text-xs text-slate-500">' + escapeHtml(f.obs || '') + '</td>' +
            '</tr>';
    }).join('');

    const nMiss = (j.fields || []).filter(f => fieldStatus(f) === 'missing').length;
    const gs = CFG.deparaStats || {};
    const globalNote = (gs.missing != null)
        ? ' · <span class="text-lima-orange font-semibold">' + gs.missing + '</span> atributos faltando em ' + gs.journeysWithMissing + ' jornadas (global)'
        : '';
    const missBadge = nMiss
        ? '<span class="bg-lima-orange text-white text-xs font-semibold px-3 py-1 rounded-full"><i class="fa-solid fa-triangle-exclamation mr-1"></i>' + nMiss + ' faltando</span>'
        : '<span class="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">completo</span>';
    document.getElementById('main-content').innerHTML =
        '<div class="fade-in max-w-6xl mx-auto">' +
        '<h2 class="text-2xl font-bold text-slate-900 mb-1">' + escapeHtml(j.title) + '</h2>' +
        '<p class="text-slate-500 mb-6">Mapeamento de dados (DE-PARA) para o AEP.' + globalNote + '</p>' +
        '<div class="grid gap-4 mb-6" style="grid-template-columns:repeat(auto-fit,minmax(230px,1fr))">' +
            card('fa-building', 'Business Unit', j.bu) +
            card('fa-bolt', 'eventType', j.eventType) +
            card('fa-fingerprint', 'sourceEventType', j.sourceEventType) +
            card('fa-file-csv', 'Arquivo de origem', j.sourceFileName) +
        '</div>' +
        '<div class="bg-white rounded-xl shadow-md overflow-hidden">' +
        '<div class="flex items-center justify-between p-4 border-b border-slate-100">' +
        '<h3 class="font-bold text-lima-teal">Mapeamento de Campos (DE-PARA)</h3>' +
        '<div class="flex items-center gap-2">' +
        '<span class="bg-lima-teal text-white text-xs font-semibold px-3 py-1 rounded-full">' + (j.fields || []).length + ' campos</span>' +
        missBadge + '</div>' +
        '</div>' +
        '<div class="overflow-x-auto"><table class="min-w-full text-sm border-collapse">' +
        '<thead class="bg-lima-teal text-white"><tr>' +
        '<th class="px-3 py-2 text-left font-semibold">Campo Origem (CSV)</th>' +
        '<th class="px-3 py-2 text-left font-semibold">Obrig.</th>' +
        '<th class="px-3 py-2 text-left font-semibold">Destino AEP (XDM)</th>' +
        '<th class="px-3 py-2 text-left font-semibold">Field Group</th>' +
        '<th class="px-3 py-2 text-left font-semibold">Tipo</th>' +
        '<th class="px-3 py-2 text-left font-semibold">Observações</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table></div></div></div>';
}

// ============================ Render: WhatsApp ============================
// Render do payload Infobip (WhatsApp) — formato próprio {messages:[...]}, diferente do
// MariaRosa. Variáveis (corpo, to, callbackData, mídia) são STRING CONSTANTE (nome do
// campo) por ora, até o de-para. Reaproveita as cópias concat/JSON (currentAjoPayload).
function renderInfobip(journey, act) {
    // Em QAS o sender Infobip vira o de homologação (payload salvo tem o de PRD).
    let msg = act._infobip;
    if (currentBotEnv === 'QAS') {
        msg = JSON.parse(JSON.stringify(msg));
        msg.sender = INFOBIP_SENDERS.QAS;
    }
    const payload = act._single ? msg : { messages: [msg] };
    currentAjoPayload = payload;
    currentAjoStr = JSON.stringify(payload, null, 2);
    const draftBadge = journey._status === 'Draft'
        ? '<span class="ml-2 align-middle text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">Draft</span>' : '';
    const review = act._review || [];
    const reviewHtml = review.length
        ? '<div class="mb-4 bg-orange-50 border border-orange-300 rounded-lg p-3 text-sm text-orange-900">' +
          '<div class="font-bold mb-1"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Revisar (' + review.length + '):</div>' +
          '<ul class="list-disc list-inside">' + review.map(function (r) { return '<li>' + escapeHtml(r) + '</li>'; }).join('') + '</ul></div>'
        : '';
    document.getElementById('main-content').innerHTML =
        '<div class="fade-in max-w-4xl mx-auto">' +
        '<h2 class="text-2xl font-bold text-slate-900 mb-1">' + escapeHtml(act.templateName || act.activityKey) +
        '<span class="ml-2 align-middle text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">Infobip · WhatsApp</span>' + draftBadge + '</h2>' +
        '<p class="text-slate-500 mb-4">' + escapeHtml(journey.bu + ' / ' + journey.journeyName) + '</p>' +
        reviewHtml +
        '<div class="mb-4 bg-amber-50 border border-amber-300 rounded-lg p-3 text-sm text-amber-900">' +
        '<i class="fa-solid fa-circle-info mr-1"></i> Variáveis (corpo, <code class="text-amber-700">to</code>, ' +
        '<code class="text-amber-700">callbackData</code> e mídia) estão como <b>string constante</b> (nome do campo) até o mapeamento de-para.</div>' +
        '<div class="bg-white rounded-xl shadow-md overflow-hidden border border-lima-teal/20">' +
        '<div class="p-4 border-b border-slate-100 flex items-center justify-between">' +
        '<h3 class="font-bold text-lima-teal"><i class="fa-brands fa-whatsapp mr-2"></i> Payload Infobip</h3>' +
        '<div class="flex items-center gap-2">' +
        '<button onclick="copyAjoString()" title="Copia a expressão concat([...]) do payload Infobip para colar no jsonValue do Custom Action" class="bg-lima-teal hover:bg-lima-dark text-white px-3 py-1.5 rounded-lg text-sm transition-colors">' +
        '<i class="fa-regular fa-copy mr-1"></i> Copiar concat</button>' +
        '<button onclick="copyAjoJson()" title="Copia o JSON identado" class="bg-white border border-lima-teal text-lima-teal hover:bg-lima-light px-3 py-1.5 rounded-lg text-sm transition-colors">' +
        '<i class="fa-regular fa-copy mr-1"></i> JSON</button>' +
        '</div></div>' +
        '<div class="p-4"><pre class="json-viewer">' + highlightVars(currentAjoStr) + '</pre></div></div></div>';
}

function selectWpp(journey, act) {
    selectedWpp = { journeyId: journey.journeyId, activityId: act.activityId };
    buildSidebar(document.getElementById('searchInput').value);
    if (act._infobip) return renderInfobip(journey, act);

    const result = mapToAjoFormat(journey, act);
    const rawStr = JSON.stringify(act.payload || {}, null, 2);
    const ajoStr = JSON.stringify(result.payload, null, 2);
    currentAjoStr = ajoStr;
    currentAjoPayload = result.payload;

    const N = result.warnings.length;
    let warnHtml = '';
    if (N) {
        const items = result.warnings.map(w =>
            '<li class="font-mono text-xs break-all">' + escapeHtml(w) + '</li>').join('');
        const msg = result.ajoEvent
            ? (N + ' variável(is) sem path de de-para — mantidas no formato SFMC, revisar manualmente:')
            : ('Jornada sem evento unitário AJO — ' + N + ' variável(is) mantidas no formato SFMC:');
        warnHtml =
            '<div class="mb-4 bg-amber-50 border border-amber-300 rounded-lg p-4">' +
            '<div class="font-bold text-amber-800 mb-1"><i class="fa-solid fa-triangle-exclamation mr-2"></i>' + msg + '</div>' +
            '<ul class="list-disc list-inside text-amber-900 mt-1">' + items + '</ul></div>';
    }
    const eventBadge = result.ajoEvent
        ? '<span class="ml-2 text-xs bg-lima-light text-lima-teal px-2 py-0.5 rounded-full font-mono">@event{' + escapeHtml(result.ajoEvent) + '}</span>'
        : '<span class="ml-2 text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">sem evento AJO</span>';

    document.getElementById('main-content').innerHTML =
        '<div class="fade-in max-w-7xl mx-auto">' +
        '<h2 class="text-2xl font-bold text-slate-900 mb-1">' + escapeHtml(act.templateName || act.activityKey) + '</h2>' +
        '<p class="text-slate-500 mb-6">' + escapeHtml(journey.bu + ' / ' + journey.journeyName) + '</p>' +
        warnHtml +
        '<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">' +
            '<div class="bg-white rounded-xl shadow-md overflow-hidden">' +
            '<div class="p-4 border-b border-slate-100 flex items-center"><h3 class="font-bold text-slate-700">' +
            '<i class="fa-brands fa-salesforce mr-2 text-[#00a1e0]"></i> Payload SFMC (original)</h3></div>' +
            '<div class="p-4"><pre class="json-viewer">' + highlightVars(rawStr) + '</pre></div></div>' +
            '<div class="bg-white rounded-xl shadow-md overflow-hidden border border-lima-teal/20">' +
            '<div class="p-4 border-b border-slate-100 flex items-center justify-between">' +
            '<h3 class="font-bold text-lima-teal"><i class="fa-solid fa-wand-magic-sparkles mr-2"></i> Payload AJO (mapeado)' + eventBadge + '</h3>' +
            '<div class="flex items-center gap-2">' +
            '<button onclick="copyAjoString()" title="Copia a expressão concat([...]) para colar no jsonValue do Custom Action AJO (cada @event vira uma entrada da lista)" class="bg-lima-teal hover:bg-lima-dark text-white px-3 py-1.5 rounded-lg text-sm transition-colors">' +
            '<i class="fa-regular fa-copy mr-1"></i> Copiar concat</button>' +
            '<button onclick="copyAjoJson()" title="Copia o JSON identado" class="bg-white border border-lima-teal text-lima-teal hover:bg-lima-light px-3 py-1.5 rounded-lg text-sm transition-colors">' +
            '<i class="fa-regular fa-copy mr-1"></i> JSON</button>' +
            '</div></div>' +
            '<div class="p-4"><pre class="json-viewer">' + highlightVars(ajoStr) + '</pre></div></div>' +
        '</div></div>';
}

// ============================ Render: Guia de Variáveis ============================
// Renderiza as specs de mapeamento (window.GUIDE_DATA, geradas de instrucao_mapeamento_*.md).
const GUIDE_CX = {
    critica: ['🔴🔴', 'Crítica', 'bg-red-100 text-red-700'],
    alta: ['🔴', 'Alta', 'bg-red-50 text-red-600'],
    media: ['🟡', 'Média', 'bg-amber-100 text-amber-700'],
    baixa: ['🟢', 'Baixa', 'bg-emerald-100 text-emerald-700'],
};
function guideBadge(cx) { return (GUIDE_CX[cx] || ['📄'])[0]; }

// Destaca os tokens buscados no HTML já renderizado (só em texto, nunca dentro de tags).
function highlightTerms(html, q) {
    const toks = (q || '').trim().toLowerCase().split(/\s+/).filter(t => t.length >= 3);
    if (!toks.length) return html;
    return html.split(/(<[^>]+>)/g).map(seg => {
        if (seg.startsWith('<')) return seg;
        let out = seg;
        toks.forEach(t => {
            const re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
            out = out.replace(re, '<mark>$1</mark>');
        });
        return out;
    }).join('');
}

// Guia fixo (igual p/ todas as jornadas): como usar as fórmulas no AJO.
function guideHowToHtml() {
    return '<details class="bg-lima-light border border-lima-teal/20 rounded-xl p-4 mb-6">' +
        '<summary class="cursor-pointer font-bold text-lima-teal text-sm"><i class="fa-solid fa-circle-question mr-1"></i> Como usar no AJO (sintaxe e onde colar)</summary>' +
        '<div class="mt-3 text-sm text-slate-700 space-y-2">' +
        '<p><strong>Campo do evento</strong>: <code class="guide-inline">@event{&lt;NomeDoEvento&gt;.&lt;pathXDM&gt;}</code> — lê o evento unitário que disparou a jornada. Em <code class="guide-inline">concat</code>, adicione <code class="guide-inline">, defaultValue: ""</code> para nunca virar null.</p>' +
        '<p><strong>Sempre o nome COMPLETO</strong>: escreva o evento e o path inteiros — <code class="guide-inline">@event{MRV_FTP_Email_Agend_VA._mrv.identityEvents.email}</code>, nunca abreviado com “…”.</p>' +
        '<p><strong>Variável + texto → use <code class="guide-inline">concat</code></strong>: uma variável sozinha vai direta; ao juntar com texto estático, use <code class="guide-inline">concat("Seu contato: ", @event{MRV_FTP_Email_Agend_VA._mrv.identityEvents.email})</code> — cada trecho de texto entre aspas e cada <code class="guide-inline">@event{…}</code> como argumento.</p>' +
        '<p><strong>Atributo de perfil</strong>: <code class="guide-inline">{{profile.&lt;pathXDM&gt;}}</code> (ex.: <code class="guide-inline">{{profile.personalEmail.address}}</code>) — usado nos canais Email/SMS.</p>' +
        '<p><strong>Payload do Custom Action (jsonValue)</strong>: cole a expressão <code class="guide-inline">concat([...])</code> no modo avançado — cada <code class="guide-inline">@event{…}</code> é uma entrada SEM aspas da lista; texto estático entra entre aspas com <code class="guide-inline">\\"</code> escapado.</p>' +
        '<p><strong>Decisão sobre campo do evento</strong> (routers Marca/Momento/ID_Mensagem_Email…): use um nó <em>Condition</em> com a expressão sobre <code class="guide-inline">@event{…}</code> — publicável direto.</p>' +
        '<p><strong>“Abriu o e-mail?”</strong>: NÃO é Condition de atributo — modele como <em>Reaction</em> (engajamento) ancorada no nó de mensagem + janela de espera.</p>' +
        '<p><strong>Limitação (jornadas Read Audience “PF - *”)</strong>: a Condition não faz join a outra DE (semântica EXISTS) — materialize o dado no perfil antes (ver spec da jornada).</p>' +
        '</div></details>';
}

function renderGuide(id) {
    selectedGuideId = id;
    const q = document.getElementById('searchInput').value;
    buildSidebar(q);
    const g = GUIDE.find(x => x.id === id);
    if (!g) return;
    currentGuideFormulas = g.formulas || [];

    const cx = GUIDE_CX[g.complexity];
    const chip = (icon, text, cls) =>
        '<span class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-semibold ' + (cls || 'bg-slate-100 text-slate-600') + '">' +
        (icon ? '<i class="fa-solid ' + icon + '"></i>' : '') + escapeHtml(text) + '</span>';

    const chips = [
        chip('fa-layer-group', g.pattern, 'bg-lima-light text-lima-teal'),
        chip('fa-building', g.bu),
        g.ajoEvent ? '<button onclick="copyToClipboard(\'' + g.ajoEvent + '\', \'Evento copiado!\')" title="Copiar nome do evento" class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-mono font-semibold bg-lima-teal text-white hover:bg-lima-dark transition-colors">@event{' + escapeHtml(g.ajoEvent) + '} <i class="fa-regular fa-copy"></i></button>' : '',
        cx ? chip(null, cx[0] + ' ' + cx[1], cx[2]) : '',
    ].filter(Boolean).join(' ');

    const formulasHtml = currentGuideFormulas.length
        ? '<div class="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden">' +
          '<div class="bg-lima-teal text-white px-4 py-2.5 text-sm font-bold"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i> Fórmulas para usar no AJO</div>' +
          '<div class="divide-y divide-slate-100">' +
          currentGuideFormulas.map((f, i) =>
              '<div class="px-4 py-3 flex items-start justify-between gap-3">' +
              '<div class="min-w-0"><code class="guide-inline block break-all">' + escapeHtml(f.expr) + '</code>' +
              (f.context ? '<div class="text-xs text-slate-500 mt-1">' + escapeHtml(f.context) + '</div>' : '') + '</div>' +
              '<button onclick="copyGuideFormula(' + i + ')" class="flex-shrink-0 bg-white border border-lima-teal text-lima-teal hover:bg-lima-light px-2.5 py-1 rounded-lg text-xs transition-colors"><i class="fa-regular fa-copy mr-1"></i>Copiar</button>' +
              '</div>').join('') +
          '</div></div>'
        : '';

    document.getElementById('main-content').innerHTML =
        '<div class="max-w-4xl mx-auto">' +
        '<div class="mb-4">' +
        '<h2 class="text-2xl font-extrabold text-lima-teal">' + escapeHtml(g.title) + '</h2>' +
        '<div class="flex items-center gap-2 mt-2 flex-wrap">' + chips + '</div>' +
        '<div class="text-xs text-slate-400 mt-1 font-mono">' + escapeHtml(g.file) + '</div>' +
        '</div>' +
        guideHowToHtml() +
        formulasHtml +
        '<div class="guide-body bg-white rounded-xl border border-slate-200 shadow-sm p-6">' +
        highlightTerms(g.sectionsHtml || '', q) +
        '</div></div>';
}

function copyGuideFormula(i) {
    const f = currentGuideFormulas[i];
    if (f) copyToClipboard(f.expr, 'Fórmula copiada!');
}

// ============================ Visão / toggles ============================
function setView(view) {
    currentView = view;
    updateViewTabs();
    document.getElementById('view-label').textContent =
        view === 'depara' ? 'DE-PARA' : view === 'guia' ? 'Guia de Variáveis' : 'WhatsApp';
    const envToggle = document.getElementById('env-toggle');
    envToggle.classList.toggle('hidden', view !== 'whatsapp');
    envToggle.classList.toggle('flex', view === 'whatsapp');
    document.getElementById('searchInput').value = '';
    updateQasPanel();
    buildSidebar('');
    resetMain();
}

function resetMain() {
    document.getElementById('main-content').innerHTML =
        '<div class="flex flex-col items-center justify-center h-full text-center text-slate-400">' +
        '<i class="fa-regular fa-map text-6xl mb-4 opacity-40"></i>' +
        '<h2 class="text-xl font-bold text-slate-600 mb-1">Selecione uma jornada</h2>' +
        '<p class="max-w-sm text-sm">Escolha uma jornada na barra lateral para visualizar o mapeamento.</p></div>';
}

function updateViewTabs() {
    const on = 'px-4 py-1.5 font-semibold transition-colors bg-white text-lima-teal';
    const off = 'px-4 py-1.5 font-semibold transition-colors bg-transparent text-white hover:bg-white/10';
    document.getElementById('tab-depara').className = (currentView === 'depara') ? on : off;
    document.getElementById('tab-whatsapp').className = (currentView === 'whatsapp') ? on : off;
    const tg = document.getElementById('tab-guia');
    if (tg) tg.className = (currentView === 'guia') ? on : off;
}

function setBotEnv(env) {
    currentBotEnv = env;
    updateEnvButtons();
    updateQasPanel();
    rerenderCurrentWpp();
}

// Seleção WhatsApp atual como { journey, act } (ou null).
function currentSelection() {
    if (!selectedWpp) return null;
    const bu = Object.keys(WPP).find(b => (WPP[b] || []).some(j => j.journeyId === selectedWpp.journeyId));
    const journey = bu && (WPP[bu] || []).find(j => j.journeyId === selectedWpp.journeyId);
    const act = journey && (journey.whatsappActivities || []).find(a => a.activityId === selectedWpp.activityId);
    return (journey && act) ? { journey, act } : null;
}

// Re-renderiza a jornada WhatsApp selecionada (reflete toggle PRD/QAS e overrides QAS).
function rerenderCurrentWpp() {
    const sel = currentSelection();
    if (sel) selectWpp(sel.journey, sel.act);
}

// Overrides globais QAS: grava o valor e re-renderiza o payload AJO na hora.
// Os inputs ficam na barra QAS (fora do main-content), então o foco não se perde.
function setQasOverride(key, value) {
    QAS_OVERRIDES[key] = value;
    rerenderCurrentWpp();
}

// Mostra/esconde a barra de overrides (só WhatsApp + QAS) e pré-preenche o namespace.
function updateQasPanel() {
    const el = document.getElementById('qas-overrides');
    if (!el) return;
    const wa = currentView === 'whatsapp';
    el.classList.toggle('hidden', !wa);            // barra aparece em PRD e QAS (visão WhatsApp)
    const qas = currentBotEnv === 'QAS';
    const only = document.getElementById('qas-only');   // templateName/namespaceId/sufixo só em QAS
    if (only) only.style.display = qas ? 'contents' : 'none';
    if (wa && qas) {
        const nsInput = document.getElementById('qas-ns');
        if (nsInput && !nsInput.value) {
            nsInput.value = firstNamespace();
            QAS_OVERRIDES.namespaceId = nsInput.value;
        }
    }
}

// Primeiro namespaceId dos payloads (já limpo), p/ pré-preencher o override.
function firstNamespace() {
    for (const bu in WPP) {
        for (const j of (WPP[bu] || [])) {
            for (const act of (j.whatsappActivities || [])) {
                const ns = act.payload && act.payload.namespaceId;
                if (ns) return cleanInvisible(ns);
            }
        }
    }
    return '';
}

function updateEnvButtons() {
    const on = 'px-3 py-1.5 font-semibold transition-colors bg-white text-lima-teal';
    const off = 'px-3 py-1.5 font-semibold transition-colors bg-transparent text-white hover:bg-white/10';
    document.getElementById('btn-prd').className = (currentBotEnv === 'PRD') ? on : off;
    document.getElementById('btn-qas').className = (currentBotEnv === 'QAS') ? on : off;
}

// ============================ Init ============================
document.addEventListener('DOMContentLoaded', () => {
    updateEnvButtons();
    document.getElementById('searchInput').addEventListener('input', e => buildSidebar(e.target.value));
    setView('depara');
});
