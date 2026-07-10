# Instrução de mapeamento — "Jornada Síndico" · AJO **evento FTP** (e-mail, régua de manutenção + engajamento)

> A **mais complexa** da leva de Assistência Técnica: régua de **e-mails de manutenção** para síndicos,
> com **reenvio condicionado a engajamento** (abertura). NÃO tem discriminador de dado (a de-para traz só
> identidade) — o roteamento é por **sequência + reação (abriu?)**, não por campo do registro.

## Identificação
| | |
|---|---|
| Jornada SFMC | **Jornada Síndico** (`fb6f8fce-ac5e-4e36-b170-386ea2d5c152`, BU `mrv-assistencia-tecnica`) |
| Entrada | `AutomationAudience` → automation **`jornada_sindico`** (`AutomationAud-8f34ba28…`) → **FTP file import** |
| `sourceEventType` | `assistenciaTecnicaSindico` · `eventType = assistenciaTecnica.ftpFileImport` |
| Evento AJO | **`MRV_FTP_Jor_Sindico`** |
| Canal | **só e-mail** · 11 envios (8 tópicos distintos) · 3 splits de engajamento · 11 waits |

## Estrutura — régua de manutenção (8 tópicos)
| Tópico (asset) | emailId | Reenvio p/ engajamento? |
|---|---|---|
| `manutencao_sindico_telhado` | 43613 | ✅ split "Open telhado" (`ENGAGEMENTSPLITV2-2`, ref EMAILV2-1) |
| `manutencao_sindico_limpeza_caixa` | 43618 | ✅ split "Open limpeza_caixa" (`ENGAGEMENTSPLITV2-3`, ref EMAILV2-4) |
| `manutencao_sindico_portao_motor_cancela` | 43620 | ✅ split "Open portao_motor_cancela" (`ENGAGEMENTSPLITV2-4`, ref EMAILV2-7) |
| `manutencao_sindico_eee_eta_ete` | 43619 | — |
| `manutencao_sindico_casa_bombas` | 43621 | — |
| `manutencao_sindico_castelodagua` | 43626 | — |
| `manutencao_sindico_reservatorio_inferior` | 43627 | — |
| `manutencao_sindico_portas_fechaduras_pinturas` | 43630 | — |

Padrão dos 3 tópicos com engajamento: envia o e-mail → **split "abriu?"** → se **não abriu**, reenvia
(a duplicata do mesmo asset: EMAILV2-3/-5/-8) após espera; se abriu, segue. Os demais 5 tópicos são
envios sequenciais com waits entre eles.

## Fluxo AJO equivalente
```
Evento MRV_FTP_Jor_Sindico
  └─ sequência de nós Email (8 tópicos de manutenção), com waits entre eles
       para telhado / limpeza_caixa / portao:
         Email → Reaction "abriu?" (janela) → [não abriu] reenvio → [abriu] segue
```
- Os 3 splits de engajamento viram **condições de Reação** (abertura do e-mail do tópico) no AJO —
  ancoradas no nó de mensagem da própria jornada + janela de espera. **Não** são Optimize de atributo.
- Sem discriminador de dado → não há Condition sobre `@event{}`; o fluxo é sequência + reação.
- Conteúdo **estático por tópico** (a de-para só traz identidade; personalização = Nome do perfil, se o asset usar).

## De-para (CSV → XDM)
| Coluna | XDM |
|---|---|
| `Nome` | `person.name.fullName` |
| `Cpf` | `_mrv.identityEvents.cpfHash` (PK) |
| `e-mail` | `_mrv.identityEvents.email` → canal e-mail |
| `locale` | `_mrv.ftpFileImport.locale` |

## Pendências
- [ ] Mapear a **ordem/sequência exata** dos 11 nós no canvas (waits entre tópicos) — o dump lista os assets, mas o encadeamento precisa do canvas.
- [ ] Modelar os **3 reenvios** como Reaction (abertura) + janela de espera no AJO.
- [ ] Migrar os **8 assets** de e-mail de manutenção.
- [ ] Confirmar se há segmentação por empreendimento/tipo de equipamento (a de-para atual não traz — checar se todos os síndicos recebem todos os tópicos).
- ⚠️ **Maior complexidade da leva** (11 envios + 3 engajamentos + 11 waits).
