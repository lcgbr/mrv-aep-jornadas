/* MRV AEP — Jornadas · app único (visão DE-PARA + visão WhatsApp SFMC→AJO)
   Dados em data.js (window.DEPARA_DATA, window.WPP_DATA, window.SITE_CONFIG). */

const DEPARA = window.DEPARA_DATA || [];
const WPP = window.WPP_DATA || {};
const CFG = window.SITE_CONFIG || {};
const AJO_EVENT_PREFIX = CFG.ajoEventPrefix || '';
const BOT_NUMBERS = CFG.botNumbers || { PRD: {}, QAS: {} };
const PHONE_XDM = CFG.phoneXdm || '_mrv.identityEvents.phone';

let currentView = 'depara';   // 'depara' | 'whatsapp'
let currentBotEnv = 'PRD';    // 'PRD' | 'QAS'
let selectedDeParaId = null;
let selectedWpp = null;       // { journeyId, activityId }
let currentAjoStr = '';

// ============================ Util ============================
function escapeHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function isXdmPath(v) {
    return typeof v === 'string' && /^[A-Za-z_][\w]*(\.[\w]+)+/.test(v.trim());
}

function showToast() {
    const toast = document.getElementById('toast');
    toast.classList.remove('opacity-0');
    setTimeout(() => toast.classList.add('opacity-0'), 2000);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(showToast).catch(err => {
        console.error('Falha ao copiar:', err);
        alert('Erro ao copiar para a área de transferência.');
    });
}
function copyCurrent() { copyToClipboard(currentAjoStr); }

// ============================ Conversão de variáveis SFMC → AJO ============================
// 3 fontes possíveis no SFMC: DEAudience, AutomationAud, APIEvent.
const SF_VAR_RE = /\{\{Event\.(?:DEAudience|AutomationAud|APIEvent)-[^.}]+\.([^}]+)\}\}/g;
const PHONE_FIELDS = new Set(['telefone', 'celular']); // regra global confirmada

function resolveXdm(field, deParaFields) {
    const key = (field || '').trim().toLowerCase();
    if (PHONE_FIELDS.has(key)) return PHONE_XDM;        // 1. regra global de telefone
    const v = deParaFields ? deParaFields[key] : null;   // 2. de-para da jornada
    return v || null;                                    // 3. sem destino -> fallback
}

function convertVar(str, deParaFields, warnings) {
    if (!str) return str;
    return str.replace(SF_VAR_RE, function (full, field) {
        const xdm = resolveXdm(field, deParaFields);
        if (xdm) return '{{' + AJO_EVENT_PREFIX + xdm + '}}';
        if (warnings && warnings.indexOf(full) === -1) warnings.push(full);
        return full; // fallback: mantém {{Event...}} original
    });
}

// Transformação espelhando o send-message.ts do com_sf_custom_activity
function mapToAjoFormat(journey, act) {
    const sfmc = act.payload || {};
    const deParaFields = (journey && journey._deParaFields) || {};
    const warnings = [];

    const botName = sfmc.botName || '';
    const botNumber = (BOT_NUMBERS[currentBotEnv] || {})[botName] || '';

    const components = [];

    const texts = sfmc.templateText || [];
    if (texts.length > 0) {
        components.push({
            type: 'body',
            parameters: texts.map(t => ({ type: 'text', text: convertVar(t, deParaFields, warnings) }))
        });
    }

    (sfmc.templateMedia || []).forEach(m => {
        const pt = m.parameterType;
        if (pt === 'image' || pt === 'video' || pt === 'document') {
            const param = { type: pt };
            param[pt] = { link: convertVar(m.link, deParaFields, warnings) };
            components.push({ type: m.componentType, parameters: [param] });
        }
    });

    (sfmc.templateButton || []).forEach(b => {
        const parameter = { type: b.type };
        if (b.text) parameter.text = convertVar(b.text, deParaFields, warnings);
        if (b.payload) parameter.payload = convertVar(b.payload, deParaFields, warnings);
        components.push({
            type: 'button',
            buttonIndex: b.buttonIndex,
            buttonSubtype: b.buttonSubtype,
            parameters: [parameter]
        });
    });

    const payload = {
        templateName: sfmc.templateName || '',
        namespaceId: sfmc.namespaceId || '',
        attachedBot: botName,
        botNumber: botNumber,
        userNumber: convertVar(sfmc.userNumber || '', deParaFields, warnings),
        components: components
    };
    const hasDePara = !!(deParaFields && Object.keys(deParaFields).length);
    return { payload, warnings, hasDePara };
}

// Realça {{...}} no JSON renderizado (verde p/ convertido AJO, vermelho p/ original SFMC)
function highlightVars(jsonStr) {
    let out = escapeHtml(jsonStr);
    out = out.replace(/\{\{[^}]+\}\}/g, function (m) {
        const isOriginal = /Event\.(DEAudience|AutomationAud|APIEvent)-/.test(m);
        const cls = isOriginal ? 'var-warn' : 'var-ok';
        return '<span class="' + cls + '">' + m + '</span>';
    });
    return out;
}

// ============================ Sidebar (por visão) ============================
function buildSidebar(term) {
    const container = document.getElementById('sidebar-content');
    container.innerHTML = '';
    const q = (term || '').trim().toLowerCase();
    let count = 0;

    if (currentView === 'depara') {
        const filtered = DEPARA.filter(j =>
            !q || j.title.toLowerCase().includes(q) || (j.bu || '').toLowerCase().includes(q) ||
            (j.sourceEventType || '').toLowerCase().includes(q));
        const grouped = {};
        filtered.forEach(j => { (grouped[j.bu] = grouped[j.bu] || []).push(j); });
        Object.keys(grouped).sort().forEach(bu => {
            container.appendChild(buGroup(bu));
            grouped[bu].sort((a, b) => a.title.localeCompare(b.title)).forEach(j => {
                count++;
                container.appendChild(sidebarItem(
                    j.title, 'fa-file-lines',
                    selectedDeParaId === j.id,
                    () => selectDePara(j.id)
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
                    const hay = (label + ' ' + (journey.journeyName || '') + ' ' + bu).toLowerCase();
                    if (!q || hay.includes(q)) matches.push({ journey, act, label });
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

    const rows = (j.fields || []).map((f, i) => {
        const warn = !isXdmPath(f.aepField);
        return '<tr class="' + (i % 2 ? 'bg-slate-50' : 'bg-white') + '">' +
            '<td class="px-3 py-2 align-top"><span class="code-chip">' + escapeHtml(f.csvField) + '</span></td>' +
            '<td class="px-3 py-2 align-top font-mono text-xs ' + (warn ? 'text-lima-orange' : 'text-lima-teal') + '">' +
            (warn ? '<i class="fa-solid fa-triangle-exclamation mr-1"></i>' : '') + escapeHtml(f.aepField) + '</td>' +
            '<td class="px-3 py-2 align-top">' + (f.fg && f.fg !== '—'
                ? '<span class="bg-lima-light text-lima-teal text-xs font-semibold px-2 py-0.5 rounded-full">' + escapeHtml(f.fg) + '</span>'
                : '<span class="text-slate-300">—</span>') + '</td>' +
            '<td class="px-3 py-2 align-top text-xs text-slate-600">' + escapeHtml(f.type || '—') + '</td>' +
            '<td class="px-3 py-2 align-top text-xs text-slate-500">' + escapeHtml(f.obs || '') + '</td>' +
            '</tr>';
    }).join('');

    document.getElementById('main-content').innerHTML =
        '<div class="fade-in max-w-6xl mx-auto">' +
        '<h2 class="text-2xl font-bold text-slate-900 mb-1">' + escapeHtml(j.title) + '</h2>' +
        '<p class="text-slate-500 mb-6">Mapeamento de dados (DE-PARA) para o Adobe Experience Platform.</p>' +
        '<div class="grid gap-4 mb-6" style="grid-template-columns:repeat(auto-fit,minmax(230px,1fr))">' +
            card('fa-building', 'Business Unit', j.bu) +
            card('fa-bolt', 'eventType', j.eventType) +
            card('fa-fingerprint', 'sourceEventType', j.sourceEventType) +
            card('fa-file-csv', 'Arquivo de origem', j.sourceFileName) +
        '</div>' +
        '<div class="bg-white rounded-xl shadow-md overflow-hidden">' +
        '<div class="flex items-center justify-between p-4 border-b border-slate-100">' +
        '<h3 class="font-bold text-lima-teal">Mapeamento de Campos (DE-PARA)</h3>' +
        '<span class="bg-lima-teal text-white text-xs font-semibold px-3 py-1 rounded-full">' + (j.fields || []).length + ' campos</span>' +
        '</div>' +
        '<div class="overflow-x-auto"><table class="min-w-full text-sm border-collapse">' +
        '<thead class="bg-lima-teal text-white"><tr>' +
        '<th class="px-3 py-2 text-left font-semibold">Campo Origem (CSV)</th>' +
        '<th class="px-3 py-2 text-left font-semibold">Destino AEP (XDM)</th>' +
        '<th class="px-3 py-2 text-left font-semibold">Field Group</th>' +
        '<th class="px-3 py-2 text-left font-semibold">Tipo</th>' +
        '<th class="px-3 py-2 text-left font-semibold">Observações</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table></div></div></div>';
}

// ============================ Render: WhatsApp ============================
function selectWpp(journey, act) {
    selectedWpp = { journeyId: journey.journeyId, activityId: act.activityId };
    buildSidebar(document.getElementById('searchInput').value);

    const result = mapToAjoFormat(journey, act);
    const rawStr = JSON.stringify(act.payload || {}, null, 2);
    const ajoStr = JSON.stringify(result.payload, null, 2);
    currentAjoStr = ajoStr;

    let warnHtml = '';
    if (result.warnings.length) {
        const items = result.warnings.map(w =>
            '<li class="font-mono text-xs break-all">' + escapeHtml(w) + '</li>').join('');
        warnHtml =
            '<div class="mb-4 bg-amber-50 border border-amber-300 rounded-lg p-4">' +
            '<div class="font-bold text-amber-800 mb-1"><i class="fa-solid fa-triangle-exclamation mr-2"></i>' +
            result.warnings.length + ' variável(is) sem de-para de evento — mantidas no formato SFMC, revisar manualmente:</div>' +
            '<ul class="list-disc list-inside text-amber-900 mt-1">' + items + '</ul></div>';
    }
    const noDeParaBadge = result.hasDePara ? '' :
        '<span class="ml-2 text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">sem de-para da jornada</span>';

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
            '<h3 class="font-bold text-lima-teal"><i class="fa-solid fa-wand-magic-sparkles mr-2"></i> Payload AJO (mapeado)' + noDeParaBadge + '</h3>' +
            '<button onclick="copyCurrent()" class="bg-lima-teal hover:bg-lima-dark text-white px-3 py-1.5 rounded-lg text-sm transition-colors">' +
            '<i class="fa-regular fa-copy mr-1"></i> Copiar</button></div>' +
            '<div class="p-4"><pre class="json-viewer">' + highlightVars(ajoStr) + '</pre></div></div>' +
        '</div></div>';
}

// ============================ Visão / toggles ============================
function setView(view) {
    currentView = view;
    updateViewTabs();
    document.getElementById('view-label').textContent = view === 'depara' ? 'DE-PARA' : 'WhatsApp';
    const envToggle = document.getElementById('env-toggle');
    envToggle.classList.toggle('hidden', view !== 'whatsapp');
    envToggle.classList.toggle('flex', view === 'whatsapp');
    document.getElementById('searchInput').value = '';
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
}

function setBotEnv(env) {
    currentBotEnv = env;
    updateEnvButtons();
    if (selectedWpp) {
        const journey = (WPP[Object.keys(WPP).find(bu =>
            (WPP[bu] || []).some(j => j.journeyId === selectedWpp.journeyId))] || [])
            .find(j => j.journeyId === selectedWpp.journeyId);
        const act = journey && (journey.whatsappActivities || []).find(a => a.activityId === selectedWpp.activityId);
        if (journey && act) selectWpp(journey, act);
    }
}

function updateEnvButtons() {
    const on = 'px-3 py-1.5 font-semibold transition-colors bg-white text-lima-teal';
    const off = 'px-3 py-1.5 font-semibold transition-colors bg-transparent text-white hover:bg-white/10';
    document.getElementById('btn-prd').className = (currentBotEnv === 'PRD') ? on : off;
    document.getElementById('btn-qas').className = (currentBotEnv === 'QAS') ? on : off;
}

// ============================ Init ============================
document.addEventListener('DOMContentLoaded', () => {
    if (AJO_EVENT_PREFIX.indexOf('__PREENCHER__') !== -1) {
        document.getElementById('prefix-banner').classList.remove('hidden');
    }
    updateEnvButtons();
    document.getElementById('searchInput').addEventListener('input', e => buildSidebar(e.target.value));
    setView('depara');
});
