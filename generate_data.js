const fs = require('fs');
const path = require('path');

const dir = path.join('d:', 'Projetos', 'clientes', 'MRV', 'AEP', 'docs_markdown', 'de_para_jornadas');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') && f !== '_INDICE.md');

const jornadas = [];

for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    const lines = content.split('\n');
    let title = '';
    let bu = '';
    let eventType = '';
    let sourceEventType = '';
    let sourceFileName = '';
    let evidence = '';
    const fields = [];
    let inFieldsTable = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('# DE-PARA')) {
            title = line.replace('# DE-PARA — ', '').trim();
        } else if (line.startsWith('| **BU** |')) {
            bu = line.split('|')[2].trim();
        } else if (line.startsWith('| **`eventType`** |')) {
            eventType = line.split('|')[2].replace(/`/g, '').trim();
        } else if (line.startsWith('| **`sourceEventType`** |')) {
            sourceEventType = line.split('|')[2].replace(/`/g, '').trim();
        } else if (line.startsWith('| **Arquivo de origem** |')) {
            sourceFileName = line.split('|')[2].trim();
        } else if (line.startsWith('| **Evidência** |')) {
            evidence = line.split('|')[2].trim();
        }

        if (line.startsWith('## 2. DE-PARA campo a campo')) {
            inFieldsTable = true;
            continue;
        }

        if (line.startsWith('## 3. Lacunas')) {
            inFieldsTable = false;
        }

        if (inFieldsTable) {
            if (line.startsWith('|') && !line.includes('---') && !line.includes('# | Campo CSV | Campo AEP')) {
                const parts = line.split('|').map(p => p.trim());
                if (parts.length >= 6) {
                    const csvField = parts[2].replace(/`/g, '');
                    const aepField = parts[3].replace(/`/g, '');
                    const fg = parts[4];
                    const type = parts[5];
                    const obs = parts.length >= 7 ? parts[6] : '';
                    if (csvField && aepField) {
                        fields.push({
                            csvField,
                            aepField,
                            fg,
                            type,
                            obs
                        });
                    }
                }
            }
        }
    }

    if (title && bu) {
        jornadas.push({
            id: sourceEventType,
            title,
            bu,
            eventType,
            sourceEventType,
            sourceFileName,
            evidence,
            fields
        });
    }
}

// Write to JS file (to avoid CORS issues when opening file:// directly)
const output = path.join('d:', 'Projetos', 'clientes', 'MRV', 'AEP', 'visualizador-de-para', 'data.js');
const jsContent = `const allJornadas = ${JSON.stringify(jornadas, null, 2)};`;
fs.writeFileSync(output, jsContent, 'utf8');
console.log(`Generated ${output} with ${jornadas.length} jornadas.`);
