// allJornadas is now loaded from data.js

document.addEventListener('DOMContentLoaded', () => {
    try {
        // Hide loader
        setTimeout(() => {
            document.getElementById('loader').style.opacity = '0';
            setTimeout(() => document.getElementById('loader').style.display = 'none', 500);
        }, 500);

        renderSidebar(allJornadas);
        setupSearch();

    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('loader').innerHTML = '<p style="color: #ef4444;">Erro ao carregar dados. Verifique o console.</p>';
    }
});

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allJornadas.filter(j => 
            j.title.toLowerCase().includes(term) || 
            j.bu.toLowerCase().includes(term) ||
            j.sourceEventType.toLowerCase().includes(term)
        );
        renderSidebar(filtered);
    });
}

function renderSidebar(jornadasList) {
    const container = document.getElementById('sidebarContent');
    container.innerHTML = '';

    // Group by BU
    const grouped = jornadasList.reduce((acc, curr) => {
        if (!acc[curr.bu]) acc[curr.bu] = [];
        acc[curr.bu].push(curr);
        return acc;
    }, {});

    const sortedBUs = Object.keys(grouped).sort();

    if (sortedBUs.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; margin-top: 20px;">Nenhuma jornada encontrada.</p>';
        return;
    }

    sortedBUs.forEach(bu => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'bu-group';
        
        const title = document.createElement('div');
        title.className = 'bu-group-title';
        title.textContent = bu;
        groupDiv.appendChild(title);

        const sortedJornadas = grouped[bu].sort((a, b) => a.title.localeCompare(b.title));

        sortedJornadas.forEach(j => {
            const item = document.createElement('div');
            item.className = 'journey-item';
            item.onclick = () => selectJourney(j.id, item);
            
            const icon = document.createElement('i');
            icon.className = 'fa-solid fa-file-lines journey-icon';
            
            const name = document.createElement('span');
            name.className = 'journey-name';
            name.textContent = j.title;
            
            item.appendChild(icon);
            item.appendChild(name);
            groupDiv.appendChild(item);
        });

        container.appendChild(groupDiv);
    });
}

function selectJourney(id, element) {
    // Update active class in sidebar
    document.querySelectorAll('.journey-item').forEach(el => el.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    }

    const journey = allJornadas.find(j => j.id === id);
    if (!journey) return;

    // Hide empty state, show details
    const header = document.getElementById('mainHeader');
    header.innerHTML = `
        <h1>${journey.title}</h1>
        <p>Mapeamento de dados (DE-PARA) para integração Adobe Experience Platform.</p>
    `;
    
    document.getElementById('journeyDetails').style.display = 'block';

    // Populate metadata
    document.getElementById('valBU').textContent = journey.bu;
    document.getElementById('valEventType').textContent = journey.eventType;
    document.getElementById('valSourceEvent').textContent = journey.sourceEventType;
    document.getElementById('valSourceFile').textContent = journey.sourceFileName || 'N/A';

    // Populate Fields Table
    const tbody = document.getElementById('fieldsTableBody');
    tbody.innerHTML = '';
    
    document.getElementById('fieldsCount').textContent = `${journey.fields.length} campos`;

    journey.fields.forEach(field => {
        const tr = document.createElement('tr');
        
        // CSV Field
        const tdCsv = document.createElement('td');
        tdCsv.innerHTML = `<span class="field-csv">${field.csvField}</span>`;
        
        // AEP Field
        const tdAep = document.createElement('td');
        const isWarning = field.aepField.includes('SEM DESTINO');
        tdAep.innerHTML = `<span class="field-aep ${isWarning ? 'warning' : ''}">${field.aepField}</span>`;
        
        // FG
        const tdFg = document.createElement('td');
        tdFg.innerHTML = field.fg && field.fg !== '—' ? `<span class="fg-tag">${field.fg}</span>` : '<span style="color: var(--text-muted)">—</span>';
        
        // Type
        const tdType = document.createElement('td');
        tdType.textContent = field.type || '—';
        if(field.type === '—') tdType.style.color = 'var(--text-muted)';
        
        // Obs
        const tdObs = document.createElement('td');
        tdObs.textContent = field.obs || '';
        
        tr.appendChild(tdCsv);
        tr.appendChild(tdAep);
        tr.appendChild(tdFg);
        tr.appendChild(tdType);
        tr.appendChild(tdObs);
        
        tbody.appendChild(tr);
    });
}
