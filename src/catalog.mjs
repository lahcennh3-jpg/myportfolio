// Catalog content is rendered as escaped text with allowlisted links.
// Neither recorded Python recipes nor supplied markup are executed by the site.
export function createCatalog(data, sourceText) {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const refs = data.catalog.references;
  const projects = new Map(data.ecosystem.map(p => [p.id, p]));
  const missions = new Map(data.missions.map(m => [m.id, m]));
  const sourceLink = (url, title) => /^https:\/\//.test(url)
    ? `<a class="text-link external-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(title)}</a>` : esc(title);
  const projectHref = (id, prefix='') => `${prefix}ecosystem/${projects.get(id)?.slug}.html`;
  const sectionHref = (id, prefix='') => `${prefix}catalog/section-${String(id).padStart(2,'0')}.html`;
  const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

  function plain(value, prefix) {
    // F01 is also the capstone ID; only bracketed F/J references are citations.
    const matcher = /\b(?:M\d{2}|P\d{3}|E00[12]|[SDXE]\d{2}[a-z]?)\b/g;
    let html = '', last = 0;
    for (const m of value.matchAll(matcher)) {
      html += esc(value.slice(last, m.index));
      if (missions.has(m[0])) html += `<a class="text-link" href="${prefix}missions/${m[0].toLowerCase()}.html">${m[0]}</a>`;
      else if (projects.has(m[0])) html += `<a class="text-link" href="${projectHref(m[0], prefix)}">${m[0]}</a>`;
      else if (refs[m[0]]) html += sourceLink(refs[m[0]].url, m[0]);
      else html += esc(m[0]);
      last = m.index + m[0].length;
    }
    return html + esc(value.slice(last));
  }
  function inline(value, prefix='') {
    const text = String(value ?? '');
    const matcher = /`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|\[[SDFXJE]\d+[a-z]?\]/g;
    let html = '', last = 0;
    for (const m of text.matchAll(matcher)) {
      html += plain(text.slice(last, m.index), prefix);
      const token = m[0];
      if (token.startsWith('`')) html += `<code>${esc(token.slice(1,-1))}</code>`;
      else if (token.startsWith('**')) html += `<strong>${inline(token.slice(2,-2), prefix)}</strong>`;
      else if (token.includes('](')) {
        const [,title,url] = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        html += sourceLink(url, title);
      } else {
        const id = token.slice(1,-1);
        html += refs[id] ? sourceLink(refs[id].url, id) : esc(token);
      }
      last = m.index + token.length;
    }
    return html + plain(text.slice(last), prefix);
  }

  function markdown(content, prefix='') {
    const lines = content.replace(/\r\n/g,'\n').split('\n');
    const rendered = [];
    const usedIds = new Map();
    for (let i=0; i<lines.length;) {
      const line = lines[i];
      if (!line.trim() || /^\[[A-Z][^\]]*\]/.test(line)) {i++;continue;}
      const fence = line.match(/^(```|~~~)(\w*)/);
      if (fence) {
        const code = [];i++;
        while (i<lines.length && !lines[i].startsWith(fence[1])) code.push(lines[i++]);
        i++;
        const name = fence[2] || 'text';
        rendered.push(`<div class="code-block"><span class="code-language">${esc(name)}</span><pre tabindex="0" aria-label="${esc(name)} source"><code>${esc(code.join('\n'))}</code></pre></div>`);
        continue;
      }
      const heading = line.match(/^(#{1,6}) (.+)$/);
      if (heading) {
        const level = Math.min(4, Math.max(2, heading[1].length-1));
        const base = slug(heading[2]);
        const seen = usedIds.get(base) || 0; usedIds.set(base,seen+1);
        rendered.push(`<h${level} id="${base}${seen?'-'+seen:''}">${inline(heading[2],prefix)}</h${level}>`);i++;continue;
      }
      if (line.startsWith('|') && /^\|\s*:?-/.test(lines[i+1] || '')) {
        const cells = row => row.split(/(?<!\\)\|/).slice(1,-1).map(x=>x.trim());
        const headers = cells(line);i+=2;
        const body = [];
        while(i<lines.length && lines[i].startsWith('|')) body.push(cells(lines[i++]));
        rendered.push(`<div class="catalog-table-wrap" role="region" aria-label="Research reference table" tabindex="0"><table class="evidence-table catalog-table"><thead><tr>${headers.map(x=>`<th scope="col">${inline(x,prefix)}</th>`).join('')}</tr></thead><tbody>${body.map(row=>`<tr>${row.map((x,n)=>n===0?`<th scope="row">${inline(x,prefix)}</th>`:`<td>${inline(x,prefix)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);continue;
      }
      const list = line.match(/^(?:- |\d+\. )(.+)$/);
      if (list) {
        const ordered = /^\d+\./.test(line);const items=[];
        const pattern = ordered ? /^\d+\. (.+)$/ : /^- (.+)$/;
        while(i<lines.length && pattern.test(lines[i])) items.push(lines[i++].replace(pattern,'$1'));
        rendered.push(`<${ordered?'ol':'ul'}>${items.map(x=>`<li>${inline(x,prefix)}</li>`).join('')}</${ordered?'ol':'ul'}>`);continue;
      }
      const paragraph = [line];i++;
      while(i<lines.length && lines[i].trim() && !/^(?:#|\||```|~~~|- |\d+\. |\[[A-Z])/.test(lines[i])) paragraph.push(lines[i++]);
      rendered.push(`<p>${inline(paragraph.join(' '),prefix)}</p>`);
    }
    return rendered.join('\n');
  }

  const sectionMatches = [...sourceText.matchAll(/^## (\d+)\. (.+)$/gm)];
  const sections = sectionMatches.map((m,i)=>({id:Number(m[1]),title:m[2],
    body:sourceText.slice(m.index+m[0].length,sectionMatches[i+1]?.index ?? sourceText.length).trim()}));
  function sectionCards(prefix='') {
    return `<div class="roadmap-grid">${sections.map(s=>`<article class="roadmap-card"><span class="cluster-number">${String(s.id).padStart(2,'0')} / Research catalog</span><h2>${esc(s.title)}</h2><a class="text-link" href="${sectionHref(s.id,prefix)}">Read section ${s.id}</a></article>`).join('')}</div>`;
  }
  function projectLinks(text,prefix='') {
    const found = [...new Set(text.match(/\b(?:P\d{3}|E00[12])\b/g) || [])];
    return found.filter(id=>projects.has(id)).map(id=>`<a class="text-link" href="${projectHref(id,prefix)}">${id} · ${esc(projects.get(id).name)}</a>`).join(' · ');
  }
  function missionExtras(m,prefix='../') {
    const grouped = [['A','B','C','D'],['E','F','G','H'],['I','J','K','L'],['M','N','O','P']];
    const names = ['Product, owners and feasibility','Boundary, behavior and investigation','Failures, remediation and evaluation','Evidence, operations and transfer'];
    const labLinks = data.supportingLabs.filter(l=>l.missions.includes(m.id));
    return `<div class="mission-plan"><h2 class="section-heading">The full A–P mission plan</h2><p class="method-note">This is the catalog’s planned assignment. Counts are proposed test budgets. <a class="text-link" href="${sectionHref(3,prefix)}#common-mission-card-contracts">Shared scope, resource and evidence contracts</a> apply.</p>${grouped.map((group,index)=>`<details class="plan-group"${index===0?' open':''}><summary>${names[index]}</summary><dl class="detail-dl">${group.map(letter=>`<div id="field-${letter.toLowerCase()}"><dt>${letter} · ${esc(data.catalog.fieldNames[letter])}</dt><dd>${inline(m.fields[letter],prefix)}</dd></div>`).join('')}</dl></details>`).join('')}<h2 class="section-heading mt-50">Execution and transfer route</h2><dl class="detail-dl">${Object.entries(m.route).map(([key,value])=>`<div><dt>${esc({primary:'Primary surface',companion:'Mechanism companion',transfer:'Transfer destination',profile:'Profile and gates',oracle:'Authoritative oracle',deliverable:'Planned transfer deliverable'}[key])}</dt><dd>${inline(value,prefix)}</dd></div>`).join('')}</dl><p class="method-note">${projectLinks(Object.values(m.route).join(' '),prefix)}</p><h2 class="section-heading mt-50">Evidence ledger</h2><dl class="detail-dl">${Object.entries(m.ledger).map(([key,value])=>`<div><dt>${esc({sourceDesign:'Source and design',supportingObservation:'Supporting artifact observation',learnerDemonstration:'Learner demonstration',transferAssessmentReplay:'Transfer / assessment / replay',operatingExperience:'Operating experience'}[key])}</dt><dd>${inline(value,prefix)}</dd></div>`).join('')}</dl>${labLinks.length?`<p class="method-note">Catalog-recorded supporting checks: ${labLinks.map(l=>`<a class="text-link" href="${prefix}supporting-labs/${l.id.toLowerCase()}.html">${l.id}</a>`).join(' · ')}. Their RUN scope stays separate from this mission.</p>`:''}<p class="method-note">Catalog §4, line ${m.sourceLine}; Onyx research revision <code>${data.source.onyxRevision}</code>.</p></div>`;
  }
  function caseFields(t) {
    const selected = t.missions.map(id=>missions.get(id));
    const primary = selected[0];
    const support = data.supportingLabs.filter(l=>l.missions.some(id=>t.missions.includes(id)));
    const routeNames = [...new Set(selected.map(m=>m.route.transfer))];
    const firstSentence = value => value.match(/^.+?[.!?](?:\s|$)/)?.[0].trim() || value;
    const ops = selected.find(m=>['M25','M26','M27','M28','M34'].includes(m.id)) || primary;
    return [
      ['Problem',`${t.question} Planned contribution: ${t.contribution}`,'Design study'],
      ['Product context',t.catalogSurface,'Catalog §15.1'],
      ['Security boundary',t.boundary,'PLAN'],
      ['Threat model',t.threat+' '+firstSentence(primary.fields.F),'PLAN'],
      ['Scope',`Mission allocation: ${t.missions.join(' / ')}${t.id==='C08'?' plus the integrated support-summary capstone':''}. ${t.id==='C04'?'Select one executor boundary and one related artifact/control question. ':''}Use synthetic identities/data and the catalog’s component, edition and resource gates.`,'Scoped candidate'],
      ['Source / revision',`Onyx research commit: \`${data.source.onyxRevision}\`. Catalog edition: 2026-09-30; allocation §15.1 and mission cards §4. Repository metadata snapshots in §9 are separate from this retained mission baseline.`,'SRC / DOC recorded'],
      ['Hypothesis',`Test whether the declared boundary preserves current identity, data policy and effect authority. ${firstSentence(primary.fields.F)}`,'PLAN'],
      ['Security requirement',t.requirement,'PLAN'],
      ['Test design',`Select the applicable mission matrix, write predictions, retain valid/invalid outcomes and use the responsible service/store as the oracle. ${primary.id}: ${primary.fields.L} ${primary.id}: ${primary.route.oracle}`,'Planned cases'],
      ['Positive controls',t.positive+' Confirm the expected authorized workflow using the same scoped objects and configuration.','PLAN'],
      ['Negative / adversarial controls',t.negative+' Separate setup failures from denied access; an authentication error or missing fixture is inconclusive.','PLAN'],
      ['Evidence',support.length?`Catalog-recorded artifact observations: ${support.map(l=>`${l.id} — ${l.observedExecution} (${l.executionSurface})`).join('; ')}. These support preparation; they do not complete the mission matrices or establish Ahmed’s independent execution.`:'The catalog supplies source references, architecture observations and planned evidence contracts. No mission runtime or independent learner evidence is recorded for this candidate.','Scoped records'],
      ['Result / status',`Case Study Candidate. ${t.catalogStatus}. Mission experiments: NOT RUN. Independent assessment: NOT ASSESSED. Professional operating evidence: UNCONFIRMED.`,'PLAN / pending gates'],
      ['Root-cause reasoning',`No native defect is confirmed. The planned investigation follows caller, control, sink and state transitions, distinguishes configuration and extension defects, and checks alternative explanations. See ${primary.id} fields F/H and M22.`,'Hypothesis only'],
      ['Proposed / implemented mitigation',`${t.mitigation} ${firstSentence(primary.fields.J)} No mission mitigation is recorded as implemented or validated.`,'Proposed'],
      ['Tradeoffs',t.tradeoff+' Preserve legitimate behavior and record availability, privacy, compatibility and review costs for the selected boundary.','Design consideration'],
      ['Retest',`Replay the original denial and legitimate controls after a reviewed change; add a fresh transfer or held-out case. Record source/configuration parity and raw receipts. The applicable acceptance contract is ${primary.id} field K; no mission retest is recorded.`,'NOT RUN'],
      ['Detection',`Planned operational contract from ${ops.id}: ${firstSentence(ops.fields.N)} Correlate authoritative identities/decisions/effects while minimizing content and token values.`,'PLAN'],
      ['Containment',`Use the component owners and scoped stop/revocation actions in ${ops.id} field N. Preserve evidence and reconcile pending or completed effects before restarting; operator approval remains explicit.`,'PLAN'],
      ['Recovery',`Restore the approved safe state, reconcile data copies/action receipts, replay the required access and integrity controls, and record who owns rollback. ${ops.id} field N defines the scoped follow-through.`,'PLAN'],
      ['Residual risk','Native runtime/source parity, entitlement, actual model behavior and independently demonstrated competence remain separate gates. A fixture result cannot resolve an untested product or specialist boundary.','Open gates'],
      ['Transfer to another product',`Catalog-selected contrast: ${t.catalogSurface}. Candidate routes: ${routeNames.join('; ')}. Rebuild the destination’s identity/authority map and challenge inherited assumptions; corresponding features can be NOT APPLICABLE.`,'Transfer exercise planned'],
      ['Limitations','This is a source-backed study design and portfolio candidate. It records no completed penetration test, confirmed upstream finding, client engagement, employment or production operating history. Supporting recipe checks are attributed to the supplied catalog; independent learner assessment remains pending.','Explicit scope'],
      ['Evidence classification',`PLAN for the candidate and mission experiments; SRC/DOC for the catalog’s stated observations; INF for reasoned architecture connections. ${support.length?`RUN applies only to ${support.map(l=>l.id).join(', ')} within their recorded fixture/model scope.`:'No RUN evidence is assigned to this candidate.'}`,'PLAN / SRC / DOC / INF'],
    ];
  }
  function projectCard(p,prefix='') {
    return `<article class="ecosystem-card" data-filter-item data-categories="${esc(p.category)}" data-depth="${esc(p.depth.split(/[ ;]/)[0])}" data-search="${esc([p.id,p.name,p.canonicalName,p.role,p.missionExpression,p.specialty].join(' '))}"><div class="registry-summary"><span class="case-id">${p.id}</span><span class="status-label">${p.inputNumber?'Input '+String(p.inputNumber).padStart(3,'0'):'Component owner'}</span></div><h2>${esc(p.name)}</h2><p>${esc(p.role)}</p><p class="mission-line">${esc(p.missionExpression)}</p><span class="status-label plan">${p.id==='P001'?'Onyx anchor':'Planned reference / transfer'}</span><p class="method-note mt-20">${esc({D:'Deep',W:'Working',R:'Reference'}[p.depth.split(/[ ;]/)[0]] || p.depth)} study allocation · ${esc(p.specialty)}${p.archived?' · Archived snapshot':''}</p><a class="text-link" href="${projectHref(p.id,prefix)}">View ${p.id} relationship</a></article>`;
  }
  function projectDetail(p,prefix='../') {
    const rows = [
      ['Catalog relationship',p.role], ['Original input',`${p.id} · ${p.inputNumber?'input '+String(p.inputNumber).padStart(3,'0'):'additional component owner, outside the 141-input count'}`],
      ['Canonical repository',sourceLink(p.url,p.canonicalName)], ['Immutable research snapshot',sourceLink(p.snapshotUrl,p.sourceSha)],
      ['Metadata date / branch',`${p.checkDate} · ${p.branch}`], ['Original locator',sourceLink(p.originalUrl,p.name)],
      ['Planned mission associations',inline(p.missionExpression,prefix)], ['Study depth / specialty',`${p.depth} / ${p.specialty} — planned allocation, no proficiency claim`],
      ['Execution gates',p.gates], ['Archive / license metadata',`${p.archived?'Archived':'Not archived in catalog snapshot'} · ${p.licenseMetadata}; verify pinned terms and dependencies before use.`],
      ['Security policy',sourceLink(p.policyUrl,'Policy locator')+' · contents NOT REVIEWED in the catalog'],
      ['Evidence status','SRC for recorded repository identity metadata; PLAN for category, study depth and proposed use. Installed version, compatibility and runtime behavior remain unconfirmed.']
    ];
    const htmlKeys = new Set(['Canonical repository','Immutable research snapshot','Original locator','Planned mission associations','Security policy']);
    const note = p.id==='P001'?`<aside class="catalog-note"><strong>Two distinct Onyx snapshots</strong><p>The mission research baseline remains <code>${data.source.onyxRevision}</code>. The newer §9 repository head above supports maintenance analysis and does not repin the missions.</p></aside>`:'';
    return `${note}<dl class="detail-dl">${rows.map(([key,value])=>`<div><dt>${key}</dt><dd>${htmlKeys.has(key)?value:esc(value)}</dd></div>`).join('')}</dl><div class="p-cta"><p>This reference does not claim a contribution, audit, vulnerability finding or compromise of ${esc(p.name)}.</p><a class="text-link" href="${sectionHref(9,prefix)}">Register provenance and component gates</a></div>`;
  }
  function labCard(l,prefix='') {
    return `<article class="recipe-card"><header><span class="case-id">${l.id}</span><span class="status-label run">RUN · Supporting check</span></header><h3>${esc(l.title)}</h3><p class="recipe-outcome">${esc(l.observedExecution)}</p><p>${esc(l.limitations)}</p><a class="text-link" href="${prefix}supporting-labs/${l.id.toLowerCase()}.html">Inspect ${l.id} record</a></article>`;
  }
  function labDetail(l,prefix='../') {
    return `<p class="catalog-note"><strong>Supporting Recipe Verified · catalog-recorded</strong>Recorded 30 September 2026 by the supplied catalog’s artifact-verification process. Personal independent execution and native product verification remain separate.</p><dl class="detail-dl">${[
      ['Execution surface',l.executionSurface],['Observed outcome',l.observedExecution],['Interpreter / platform',l.pythonAndPlatform],
      ['Elapsed / peak RSS',`${l.elapsedSeconds} seconds / ${l.peakRss} KiB (MiB); measurements of the catalog container, including its stated wrapper`],
      ['Script SHA-256',l.scriptSha256],['Limitations',l.limitations]
    ].map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><div class="text-prose mt-40">${markdown(l.context,prefix)}<h2>Captured output</h2><p>The record below is transcribed from the catalog. It is not a fresh execution by this website.</p><div class="code-block"><pre tabindex="0" aria-label="${l.id} catalog recorded output"><code>${esc(JSON.stringify(l.recordedOutput,null,2))}</code></pre></div><h2>Exact recipe source</h2><p>Source bytes match the catalog’s recorded SHA-256. View-only code; the portfolio does not execute it.</p><details class="plan-group"><summary>Inspect ${l.id} Python source</summary><div class="code-block"><pre tabindex="0" aria-label="${l.id} Python source"><code>${esc(l.script)}</code></pre></div></details><h2>Next independent variation</h2>${markdown(l.nextVariation,prefix)}<p>Related planned missions: ${l.missions.map(id=>`<a class="text-link" href="${prefix}missions/${id.toLowerCase()}.html">${id}</a>`).join(' · ')}.</p><a class="text-link" href="${sectionHref(11,prefix)}">Full setup, reset, resource and adapter contracts</a></div>`;
  }
  function referenceLinks(ids) {
    return ids.filter(id=>refs[id]).map(id=>`<li>${sourceLink(refs[id].url,id+' · '+(refs[id].title || 'Primary source'))}</li>`).join('');
  }
  return {esc,inline,markdown,sections,sectionHref,sectionCards,projectLinks,projectHref,missionExtras,caseFields,
    projectCard,projectDetail,labCard,labDetail,referenceLinks,sourceLink};
}
