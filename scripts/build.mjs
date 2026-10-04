import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCatalog } from '../src/catalog.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public');
const data = JSON.parse(await fs.readFile(path.join(root, 'data/portfolio.json'), 'utf8'));
const layout = await fs.readFile(path.join(root, 'src/layout.html'), 'utf8');
const catalogSource = await fs.readFile(path.join(root, data.source.sourceFile), 'utf8');
const catalog = createCatalog(data, catalogSource);
const production = process.argv.includes('--production');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const range = (from, to) => Array.from({length: to - from + 1}, (_, i) => `M${String(from + i).padStart(2, '0')}`);
const domainNames = {application:'Application Security',identity:'Identity & Authorization',rag:'LLM & RAG Security',agent:'Agent Security',mcp:'MCP & Tools',data:'Data Security',model:'Model Security',platform:'Platform & Sandbox', 'supply-chain':'Supply Chain',operations:'Detection & Operations',assurance:'AI Assurance',program:'Program Security'};
const evidence = [
  ['SRC','Source observation','A behavior or control observed in a stated source revision.'],
  ['DOC','Documentation observation','A behavior described by documentation, without treating that description as a runtime result.'],
  ['INF','Reasoned inference','A conclusion derived from stated observations, with its assumptions and limits preserved.'],
  ['PLAN','Planned experiment','A proposed security experiment or design. Its existence does not establish execution.'],
  ['RUN','Executed evidence','An observed execution within a stated environment and surface. Its claim stays within that scope.']
];
const missions = data.missions.length ? data.missions : range(1, 40).map(id => {
  const tracks = data.tracks.filter(track => track.missions.includes(id));
  const categories = [...new Set(tracks.map(track => track.category))];
  if (id === 'M37') categories.push('platform');
  if (id === 'M38') categories.push('agent');
  return {id, title:null, problem:null, surface:null, responsibility:null, deliverables:[], domains:categories,
    tracks:tracks.map(track => track.id), classification:null, status:'Catalog record pending', sourceRefs:[]};
});
if (missions.length !== 40 || new Set(missions.map(m => m.id)).size !== 40 ||
    range(1,40).some(id => !missions.some(m => m.id === id))) throw new Error('M01–M40 must each be represented exactly once.');
if (data.tracks.length !== 8 || new Set(data.tracks.map(t => t.id)).size !== 8) throw new Error('C01–C08 must each be represented once.');
const productionBlockers = [];
if (!data.source.catalogAvailable) productionBlockers.push('The required Onyx mission catalog has not been supplied.');
if (!data.source.catalogRevision) productionBlockers.push('The catalog source revision is not recorded.');
if (!data.source.publishReady) productionBlockers.push('Content verification has not marked this portfolio ready for publication.');
if (data.productionUrl && !/^https:\/\//.test(data.productionUrl)) productionBlockers.push('The configured production URL must use HTTPS.');
if (data.source.catalogAvailable) {
  for (const mission of missions) {
    if (!mission.title || !mission.problem || !mission.surface || !mission.responsibility || !mission.deliverables?.length ||
        !mission.sourceRefs?.length || !['SRC','DOC','INF','PLAN','RUN'].includes(mission.classification)) {
      productionBlockers.push(`${mission.id} does not yet have a complete source-backed record.`);
    }
  }
}
for (const lab of data.supportingLabs) {
  if (lab.classification === 'RUN' && (!lab.observedExecution || !lab.executionSurface || !lab.sourceRefs?.length)) {
    throw new Error(`Supporting lab ${lab.id} cannot claim RUN without observed execution, its surface, and source references.`);
  }
}
if (production && productionBlockers.length) {
  console.error('Production publication is blocked:\n' + productionBlockers.map(x => `- ${x}`).join('\n'));
  process.exit(1);
}
await fs.rm(out, {recursive:true, force:true});
await fs.mkdir(out, {recursive:true});
await fs.cp(path.join(root,'assets'),path.join(out,'assets'),{recursive:true});
const built = [];
const indexed = [];
function relative(file) { return '../'.repeat(file.split('/').length - 1); }
function nav(active, prefix) {
  return '<ul>' + [['index.html','Home','home'],['about.html','About','about'],['projects.html','Work','work'],
    ['missions.html','Missions','missions'],['evidence.html','Method','method'],['contact.html','Contact','contact']]
    .map(([url,name,key]) => `<li><a href="${prefix}${url}"${active === key ? ' aria-current="page"' : ''}>${name}</a></li>`).join('') + '</ul>';
}
async function page(file,title,description,main,active='work',extra={}) {
  const prefix=relative(file);
  const canonical=data.productionUrl ? new URL(extra.canonicalFile || file,data.productionUrl.replace(/\/$/,'')+'/').href : null;
  const ready=data.source.publishReady && data.source.catalogAvailable;
  const variables={TITLE:esc(title),DESCRIPTION:esc(description),ROOT:prefix,PAGE_CLASS:esc(extra.className || ''),
    ROBOTS:ready && !extra.noindex?'index, follow':'noindex, follow',
    CANONICAL:canonical?`<link rel="canonical" href="${esc(canonical)}"><meta property="og:url" content="${esc(canonical)}">`:'',
    DRAFT_BANNER:ready?'':`<div class="draft-banner">Review draft · content verification pending<a href="${prefix}credits.html#content-sources">Content sources</a></div>`,
    NAVIGATION:nav(active,prefix),MAIN:main};
  const html=layout.replace(/\{\{([A-Z_]+)\}\}/g,(_,key)=>variables[key]??'');
  await fs.mkdir(path.dirname(path.join(out,file)),{recursive:true});
  await fs.writeFile(path.join(out,file),html);
  built.push(file);
  if (ready && !extra.noindex) indexed.push(file);
}
function intro(kicker,title,copy,crumb='') {
  return `<section class="breadcrumb-area page-intro"><div class="container">${crumb?`<ol class="bread-crumb"><li><a href="${crumb}index.html">Home</a></li><li>${esc(kicker)}</li></ol>`:''}<p class="eyebrow">${esc(kicker)}</p><h1 class="move-line-3d">${esc(title)}</h1><p>${esc(copy)}</p></div></section>`;
}
function heading(kicker,title,copy='') {
  return `<div class="section-title"><p class="eyebrow">${esc(kicker)}</p><h2 class="move-line-3d">${esc(title)}</h2>${copy?`<p class="section-intro">${esc(copy)}</p>`:''}</div>`;
}
function tags(values) {return `<ul class="topic-tags">${values.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;}
function catalogNote() {
  return '<aside class="catalog-note"><strong>Source-backed plans · explicit evidence gates</strong><p>The complete 30 September 2026 catalog provides every mission and transfer route. Mission experiments remain planned; four catalog-recorded supporting recipes have a separate RUN scope. <a class="text-link" href="catalog.html">Explore the full research catalog</a>.</p></aside>';
}
function scopeMap() {
  return `<div class="surface-map fade-slide bottom"><header><h3>Onyx study scope</h3><span class="badge">Planned scope</span></header><ul>${[
    ['Identity','Authentication · sessions · tenants'],['Application','Projects · chats · files · uploads'],['Knowledge','Ingestion · ACLs · retrieval · memory'],
    ['Actions','MCP · tools · approvals · code execution'],['Platform','Sandbox · providers · telemetry · secrets']
  ].map(([label,detail])=>`<li><strong>${label}</strong><span>${detail}</span></li>`).join('')}</ul><footer>Catalog source observations at the pinned Onyx revision. Native runtime verification remains pending.</footer></div>`;
}
function caseCard(track,prefix='') {
  return `<article class="case-card" data-filter-item data-categories="${esc(track.category)}" data-search="${esc([track.id,track.title,...track.missions,...track.focus].join(' '))}"><header><span class="case-id">${track.id}</span><span class="status-label plan">PLAN · Candidate</span></header><h3>${esc(track.title)}</h3><p>${esc(track.short)}</p><div class="mission-line">${track.missions.join(' / ')}</div><a class="card-link" href="${prefix}case-studies/${track.id.toLowerCase()}.html">Explore study track</a></article>`;
}
function filterButtons(categories) {
  return `<div class="button-group filter-button-group" aria-label="Filter case-study tracks"><button type="button" data-category="*" class="active" aria-pressed="true">All tracks</button>${categories.map(key=>`<button type="button" data-category="${key}" aria-pressed="false">${esc(domainNames[key])}</button>`).join('')}</div>`;
}
function carousel() {
  return `<div class="testimonial-active">${evidence.map(([code,title,copy])=>`<div class="single-testimonial"><div class="text-box"><div class="evidence-code">${code}</div><h3>${title}</h3><p>${copy}</p></div></div>`).join('')}</div><div class="carousel-footer"><p>Execution, independent assessment, and professional experience are separate evidence gates.</p><div class="carousel-controls"><button type="button" data-evidence-prev aria-label="Previous evidence labels">Previous</button><button type="button" data-evidence-next aria-label="Next evidence labels">Next</button></div></div>`;
}
const practices=[
  ['Onyx AI application security','Architecture, application boundaries, and the proposed mission framework.','Study direction'],
  ['Authorization & data boundaries','Ownership, retrieval permissions, memory, and the data lifecycle.','Planned studies'],
  ['Agent & MCP security','Delegated authority, tool actions, effect boundaries, and multi-agent trust.','Planned studies'],
  ['Model security companion labs','Robustness, training security, and privacy experiments with explicit controls.','Planned labs'],
  ['Evidence & assessment system','Requirements, source references, raw evidence, retests, and review gates.','Design direction']
];
function practiceList() {return `<ol class="practice-list">${practices.map(([title,copy,state],i)=>`<li class="practice-item fade-slide bottom"><span class="practice-number">${String(i+1).padStart(2,'0')}.</span><div><h3>${title}</h3><p>${copy}</p></div><span class="status-label">${state}</span></li>`).join('')}</ol>`;}
function contactBlock() {
  return `<section id="contact" class="contact-area3 after-none contact-bg section-space p-relative"><div class="container"><div class="row align-items-center"><div class="col-lg-7 contact-copy">${heading('Connect','Start with the work.','My public GitHub profile is the contact route supplied for this portfolio.')}<a class="btn external-link" href="${data.github}" target="_blank" rel="noopener noreferrer">Visit my GitHub</a></div><div class="col-lg-5"><div class="contact-block"><h3>GitHub</h3><p><a class="external-link" href="${data.github}" target="_blank" rel="noopener noreferrer">github.com/lahcennh3-jpg</a></p><p class="contact-note">Research direction, source code, and portfolio updates. Additional contact details can be added when supplied.</p></div></div></div></div></section>`;
}
function supportingEmpty() {
  return `<p class="section-intro">Four checks recorded by the catalog’s artifact-verification process. Their results describe added local fixtures and one tiny trained model; personal assessment and native Onyx results remain separate.</p><div class="recipe-grid">${data.supportingLabs.map(lab=>catalog.labCard(lab)).join('')}</div>`;
}
function hero(variant=false) {
  return `<section id="home" class="slider-area hero-section fix p-relative"><div class="single-slider slider-bg2 d-flex align-items-center"><div class="container"><div class="row align-items-center"><div class="col-lg-8"><div class="hero-content slider-content s-slider-content"><p class="eyebrow">Engineering practice · 2026+</p><h1 class="move-line-3d"><span class="name">Ahmed<span class="hero-accent">.</span></span>AI Security<br>Engineer<span class="hero-accent">.</span></h1><p class="hero-subtitle">AI Application & Product Security · Agent Security<br>LLM/RAG Security · Model Security</p><p class="hero-intro fade-slide bottom">Building practical security engineering capability around modern AI products through source analysis, controlled labs, and evidence-driven testing.</p><div class="slider-btn fade-slide bottom"><a href="projects.html" class="btn">Explore Security Work</a><a href="missions.html" class="btn btn-secondary">View Onyx Missions</a></div></div></div><div class="col-lg-4"><aside class="hero-scope fade-slide bottom"><div class="scope-kicker">Primary application anchor</div><h2>Onyx<br>Security Lab</h2><p class="scope-note">A structured study of trust, data, and delegated authority in AI products.</p><ol class="scope-list"><li><code>01</code><span>Application boundaries</span></li><li><code>02</code><span>Retrieval & data permissions</span></li><li><code>03</code><span>Agents, MCP & tool actions</span></li><li><code>04</code><span>Evidence & retesting</span></li></ol><div class="scope-foot"><a class="text-link" href="onyx-lab.html">Explore the lab</a><span>Study scope</span></div></aside></div></div><div class="hero-bottom"><p><span>40 security missions</span> / source-backed plans</p><p><span>08 case-study tracks</span> / portfolio candidates</p><a class="text-link external-link" href="${data.github}" target="_blank" rel="noopener noreferrer">GitHub profile</a></div>${variant?'<p class="variant-note">WAAN’s alternate hero route is retained with the same evidence-aware portfolio content.</p>':''}</div></div></section>`;
}
function heroVariant(variant) {
  const base=hero();
  if(variant==='video') {
    if(!data.heroVideo) return base.replace('slider-area hero-section','slider-area slider-video hero-section');
    if(!/^assets\/[a-zA-Z0-9_./-]+\.mp4$/.test(data.heroVideo) || data.heroVideo.includes('..')) throw new Error('Hero video must be a supplied local MP4 asset.');
    return base.replace('slider-area hero-section','slider-area slider-video hero-section').replace('<div class="container"><div class="row align-items-center">',`<video class="portfolio-hero-video" controls muted loop playsinline preload="metadata" aria-label="Portfolio background video"><source src="${esc(data.heroVideo)}" type="video/mp4"></video><div class="container"><div class="row align-items-center">`);
  }
  if(variant!=='slider') return base;
  const secondary=[
    ['Agent · MCP · Tools','Keep authority at the boundary.','My proposed agent-security track asks how tool actions can remain within delegated authority when an AI system encounters untrusted instructions.','case-studies/c03.html','Explore the agent study track'],
    ['Evidence-driven practice','Trace a claim to its evidence.','The proposed workflow connects requirements, source controls, tests, raw evidence, remediation, and retests. A plan and a runtime result remain distinct.','methodology.html','Explore the methodology']
  ].map(([kicker,title,copy,url,cta])=>`<div class="hero-slide"><p class="eyebrow">${kicker}</p><h2 class="hero-slide-title">${title}</h2><p class="hero-intro">${copy}</p><div class="slider-btn"><a class="btn" href="${url}">${cta}</a><a class="btn btn-secondary" href="missions.html">View Onyx Missions</a></div></div>`).join('');
  const controls='<div class="hero-slider-controls"><button type="button" data-hero-prev aria-label="Previous hero slide">Previous</button><button type="button" data-hero-next aria-label="Next hero slide">Next</button><p data-hero-slide-status aria-live="polite">Slide 1 of 3</p></div>';
  return base.replace('<div class="hero-content slider-content s-slider-content">','<div class="hero-content slider-content s-slider-content"><div class="slider-active" data-hero-carousel><div class="hero-slide">')
    .replace('</div></div></div><div class="col-lg-4">',`</div></div>${secondary}</div>${controls}</div></div><div class="col-lg-4">`);
}
function home(variant=false) {
  const featured=data.tracks.filter(t=>['C01','C02','C03','C06'].includes(t.id));
  return heroVariant(variant)+
    `<section class="about-area about-p section-space"><div class="container"><div class="row align-items-start"><div class="col-lg-5"><div class="about-content s-about-content">${heading('The direction','Secure the product.<br>Understand the boundary.'.replace('<br>',' '))}<p>I’m building toward AI security engineering with an application and product security foundation: who can access data, what an agent can do, and which evidence supports a security decision.</p><div class="projects-about"><div class="text">AI engineering.<br>Security engineering.<br>Evidence-based conclusions.</div><a href="about.html" class="text-link">About my practice</a></div></div></div><div class="col-lg-7"><div class="focus-grid">${data.clusters.slice(0,4).map(c=>`<article class="sr-box-about fade-slide bottom"><span class="cluster-number">${c.number} / Focus</span><h3>${c.title}</h3><p>${c.summary}</p></article>`).join('')}</div></div></div></div></section>`+
    `<section class="features-area-two section-space p-relative"><div class="container"><div class="row align-items-center"><div class="col-lg-6 features-content">${heading('Onyx as the anchor','A lab built around real product boundaries.','The study scope connects identity, application objects, ingestion, retrieval, agents, and the platform around them.')}<p>The goal is a traceable path from security requirements to controlled experiments, remediation, and retests.</p><a class="text-link" href="onyx-lab.html">View the Onyx study scope</a></div><div class="col-lg-6">${scopeMap()}</div></div></div></section>`+
    `<section class="gallery-area section-space p-relative"><div class="container"><div class="section-head-row">${heading('Security work','Curated case-study tracks.')}<a class="text-link" href="projects.html">All eight tracks</a></div><div data-filter-region data-noun="tracks"><div class="filter-layout">${filterButtons(['application','rag','agent','model'])}<div><div class="portfolio-grid">${featured.map(t=>caseCard(t)).join('')}</div><p class="no-results" data-no-results hidden>No tracks match this filter.</p><p class="method-note mt-30" data-result-count aria-live="polite"></p></div></div></div><div class="p-cta"><p>Every track is a proposed portfolio candidate. Its evidence determines its status.</p><a class="text-link" href="evidence.html">Read the evidence standard</a></div></div></section>`+
    `<section class="testimonial-area section-space p-relative"><div class="container">${heading('Evidence, not endorsements','A precise language for security work.')}<div class="mt-40">${carousel()}</div></div></section>`+
    `<section class="team-area section-space p-relative"><div class="container"><div class="section-head-row">${heading('Engineering practice','A direction with structure.')}<a class="text-link" href="roadmap.html">Engineering roadmap</a></div>${practiceList()}</div></section>`+
    contactBlock()+
    `<section id="supporting-labs" class="blog-area section-space p-relative"><div class="container"><div class="section-head-row">${heading('Supporting work','Verified supporting labs & artifact checks.')}<a class="text-link" href="supporting-labs.html">Evidence register</a></div>${supportingEmpty()}</div></section>`;
}
await page('index.html','Ahmed | AI Security Engineer','AI security engineering practice focused on AI application security, agents, MCP, LLM/RAG security, model security, and evidence-driven research.',home(),'home');

const about=intro('About','An engineering-first security direction.','My 2026+ career direction is AI Security Engineer / AI Application & Product Security Engineer.')+
  `<section class="about-area section-space"><div class="container"><div class="row"><div class="col-lg-6 about-content">${heading('The work I am building toward','Understand how AI products trust, retrieve, and act.')}<p>I’m organizing my security practice around the boundaries that matter in an AI product: identity, object ownership, retrieval permissions, delegated tool authority, model behavior, and secure deployment.</p><p>The intended workflow combines source analysis, controlled lab design, raw evidence, and retests. Conclusions should remain proportional to the environment and evidence that produced them.</p></div><div class="col-lg-6"><h2 class="section-heading">A practical standard.</h2><p>A source observation can explain a control. A runtime experiment can test it. A separate assessment can challenge the evidence. Those are different steps.</p><p>The 30 September 2026 Onyx catalog supplies 40 mission plans, eight portfolio tracks and four narrowly recorded supporting checks. Native runtime evidence and independent demonstrations remain separate steps.</p><a href="evidence.html" class="text-link">Explore the evidence framework</a></div></div></div></section><section class="team-area section-space"><div class="container">${heading('Practice, not employment history','The planned engineering strands.')}<p class="section-intro">These entries describe research and laboratory directions. No employers or client engagements were supplied.</p>${practiceList()}</div></section>`;
await page('about.html','About Ahmed | AI Security Engineering','Ahmed’s engineering-first AI application and product security career direction for 2026 and beyond.',about,'about');

const focus=intro('Security focus','The boundaries I am building toward.','Six study clusters connect AI application security, LLM/RAG security, agents, model security, platform engineering, and operations.')+
  `<section class="services-area about-p section-space"><div class="container"><p class="method-note mb-40">These are areas of practice and planned study, with no invented proficiency percentages or expert ratings.</p><div class="skills-grid">${data.clusters.map(c=>`<article class="focus-card fade-slide bottom"><span class="cluster-number">${c.number} / Study cluster</span><h2>${c.title}</h2><p>${c.summary}</p>${tags(c.topics)}</article>`).join('')}</div></div></section>`;
await page('focus.html','Security Focus | Ahmed','AI application, RAG, agent, model, platform, and operational security study clusters.',focus);

const onyx=intro('Onyx security lab','One application anchor.<br>Many trust boundaries.'.replace('<br>',' '),'A structured AI application security laboratory, organized around the pinned source observations, edition gates and mission contracts in the Onyx catalog.')+
  `<section class="features-area-two section-space"><div class="container"><div class="row"><div class="col-lg-6 features-content">${heading('Architecture & security study','Follow the authority. Follow the data.')}<p>Onyx is the primary application anchor for the planned portfolio. The lab is intended to connect architecture context with concrete test design and transfer to other AI products.</p><p>The research baseline is commit e7240a64ed06fff6f665fdde2bd90c4a3052d004. Community and Enterprise functionality, Lite and Standard modes, and added fixtures have distinct gates. Native runtime verification remains pending.</p><a href="https://github.com/onyx-dot-app/onyx" class="text-link external-link" target="_blank" rel="noopener noreferrer">Official Onyx repository</a></div><div class="col-lg-6">${scopeMap()}</div></div><div class="mt-50">${heading('Planned surface coverage','From sessions to the execution environment.')}${tags(['Authentication & sessions','Projects / chats / files','Uploads & processing','Connector ingestion','RAG','Retrieval permissions','ACL propagation','Embeddings / search / reranking','MCP client security','MCP server security','Custom tools & actions','Memory','Code interpreter','Sandboxing','Craft','Tenant isolation','Quotas','Telemetry','Secrets','Supply chain','Model / provider boundaries'])}</div><div class="p-cta"><p>Mission numbers are stable identifiers. They do not establish that an experiment ran.</p><a class="text-link" href="missions.html">Explore M01–M40</a></div></div></section>`;
await page('onyx-lab.html','Onyx Security Lab | Ahmed','Planned Onyx application security study scope covering identity, retrieval, agents, MCP, and platform boundaries.',onyx);

const projects=intro('Case-study tracks','Eight ways to organize the security work.','C01–C08 follow the catalog’s portfolio allocation board. Each presents a scoped design, selected transfer targets and separate runtime and assessment gates.')+
  `<section class="gallery-area section-space"><div class="container"><div class="registry-summary"><p>Portfolio allocation C01–C08</p><span class="status-label plan">PLAN · Case Study Candidates</span></div><div data-filter-region data-noun="tracks"><div class="filter-layout">${filterButtons(Object.keys(domainNames))}<div><div class="portfolio-grid">${data.tracks.map(t=>caseCard(t)).join('')}</div><p class="no-results" data-no-results hidden>No tracks match this filter.</p><p class="method-note mt-30" data-result-count aria-live="polite"></p></div></div></div><div class="p-cta"><p>Design, execution, native verification, assessment, and professional work remain separate.</p><a class="text-link" href="evidence.html">Evidence & assessment gates</a></div></div></section>`;
await page('projects.html','Security Case-Study Tracks | Ahmed','C01–C08 proposed AI security portfolio tracks, with mission allocations and source-aware evidence status.',projects);

function missionCard(m) {
  const categoryNames=m.domains.map(d=>domainNames[d]).filter(Boolean);
  return `<article class="mission-card" data-filter-item data-categories="${esc(m.domains.join(' '))}" data-search="${esc([m.id,m.title,m.problem,m.surface,...m.tracks,...categoryNames].join(' '))}"><div class="registry-summary"><div class="mission-id">${m.id}</div><span class="status-label plan">PLAN · Planned Lab</span></div><h3>${esc(m.title)}</h3><p>${esc(m.problem)}</p><p class="method-note">${esc(categoryNames.join(' · '))}</p><p class="mission-line">${m.tracks.length?esc(m.tracks.join(' · ')):'Role-specific extension'}</p><a class="text-link" href="missions/${m.id.toLowerCase()}.html">Explore ${m.id} plan</a></article>`;
}
const missionPage=intro('Security missions','Forty missions. A traceable engineering system.','Search M01–M40 by security boundary, technology, ID or portfolio track. Each mission includes its complete A–P plan and a selected transfer route.')+
  `<section class="team-area section-space"><div class="container">${catalogNote()}<div data-filter-region data-noun="missions"><div class="search-tools"><div><label class="field-label" for="mission-search">Search titles, IDs, surfaces or tracks</label><input type="search" id="mission-search" placeholder="Try MCP, revocation, M31 or C03" autocomplete="off"></div><div><label class="field-label" for="mission-domain">Security domain</label><select id="mission-domain"><option value="*">All domains</option>${Object.entries(domainNames).map(([key,name])=>`<option value="${key}">${esc(name)}</option>`).join('')}</select></div></div><div class="registry-summary"><p data-result-count aria-live="polite">40 missions</p><span class="status-label plan">Runtime and assessment gates pending</span></div><div class="mission-grid">${missions.map(missionCard).join('')}</div><p class="no-results" data-no-results hidden>No missions match this search. Try a mission ID, track ID or another domain.</p></div></div></section>`;
await page('missions.html','Security Missions M01–M40 | Ahmed','Search 40 source-backed AI security mission plans, their full controls, deliverables, evidence gates and transfer routes.',missionPage,'missions');

function missionDetail(m,prefix='../') {
  return intro(m.id,m.title,m.problem,prefix)+
    `<section class="project-detail section-space"><div class="container"><div class="detail-layout"><div><p class="catalog-note"><strong>PLAN · Planned Lab</strong>Source-backed assignment. Mission experiment: NOT RUN. Independent learner assessment: NOT ASSESSED.</p><dl class="detail-dl">${[
      ['Security problem',m.problem],['Technology / surface',m.surface],['Core responsibility',m.responsibility],
      ['Major deliverables',m.deliverables.join('; ')],['Relevant security domains',m.domains.map(d=>domainNames[d]).join(' · ')],
      ['Availability / resource profile',m.availabilityAndProfile],['Prerequisites / review level',m.levelAndPrerequisites]
    ].map(([label,value])=>`<div><dt>${label}</dt><dd>${catalog.inline(value,prefix)}</dd></div>`).join('')}</dl>${catalog.missionExtras(m,prefix)}</div><aside class="detail-sidebar"><h2>Portfolio allocation</h2><p>${m.tracks.length?m.tracks.map(id=>`<a class="text-link" href="${prefix}case-studies/${id.toLowerCase()}.html">${id} · ${esc(data.tracks.find(t=>t.id===id).title)}</a>`).join('<br>'):'Role-specific extension; no compulsory portfolio slot.'}</p><h2 class="mt-30">Catalog sources</h2><ul class="source-list">${catalog.referenceLinks(m.sourceRefs)}</ul><a class="text-link" href="${prefix}missions.html">All 40 missions</a><br><a class="text-link" href="${prefix}evidence.html">Evidence and assessment gates</a></aside></div></div></section>`;
}
for (const mission of missions) await page(`missions/${mission.id.toLowerCase()}.html`,`${mission.id} · ${mission.title} | Ahmed`,`${mission.title}: planned security controls, scope, evidence gates and transfer route.`,missionDetail(mission),'missions');


function caseDetail(t,prefix='../') {
  const fields=catalog.caseFields(t);
  return intro(t.id,t.title,t.short,prefix)+`<section class="project-detail section-space"><div class="container"><div class="detail-layout"><div><p class="catalog-note"><strong>PLAN · Case Study Candidate</strong>${esc(t.contribution)} Native results and independent assessment remain pending.</p><ol class="case-fields">${fields.map(([label,copy,state])=>`<li class="case-field"><h2>${label}</h2><span class="field-state">${esc(state)}</span><p>${catalog.inline(copy,prefix)}</p></li>`).join('')}</ol></div><aside class="detail-sidebar"><h2>Track ${t.id}</h2><p>${esc(domainNames[t.category])}</p><span class="status-label plan">PLAN · Candidate</span>${tags(t.focus)}<h2 class="mt-30">Mission allocation</h2><p>${t.missions.map(id=>`<a class="text-link" href="${prefix}missions/${id.toLowerCase()}.html">${id}</a>`).join(' · ')}</p><a class="text-link" href="${prefix}projects.html">All case-study tracks</a><br><a class="text-link" href="${prefix}catalog/section-15.html">Publication and promotion gates</a>${t.id==='C08'?`<br><a class="text-link" href="${prefix}capstone.html">Integrated capstone plan</a>`:''}</aside></div></div></section>`;
}

for (const track of data.tracks) await page(`case-studies/${track.id.toLowerCase()}.html`,`${track.id} · ${track.title} | Ahmed`,`${track.title}: a proposed AI security case-study track with explicit boundaries, controls, and evidence status.`,caseDetail(track));

const evidenceRows=evidence.map(([code,title,copy])=>`<tr><th scope="row"><code>${code}</code></th><td>${title}</td><td>${copy}</td></tr>`).join('');
const evidencePage=intro('Evidence & assessment','Every claim should have a boundary.','A clean separation between source observations, documentation, inference, planned experiments, executed evidence, assessment, and professional operating experience.')+
  `<section class="testimonial-area section-space"><div class="container"><h2 class="section-heading">The evidence labels.</h2><table class="evidence-table"><caption class="visually-hidden">Evidence classification definitions preserved from the Onyx catalog</caption><thead><tr><th scope="col">Label</th><th scope="col">Meaning</th><th scope="col">Claim boundary</th></tr></thead><tbody>${evidenceRows}</tbody></table><h2 class="section-heading mt-60">Separate gates, separate claims.</h2><div class="roadmap-grid">${[
    ['Supporting recipe','A narrowly executed artifact or recipe check supports only that stated surface.'],['Local synthetic lab','A controlled local experiment establishes a result in that laboratory environment.'],
    ['Native/runtime evidence','A result observed in the actual scoped application or runtime requires its own evidence.'],['Independent assessment','External assessment remains a separate review step; it is not implied by self-recorded work.'],
    ['Professional operating experience','Employment, client work, and production operations require actual documented experience.'],['Case-study readiness','A candidate becomes a defensible case study only when the applicable evidence and limitations are available.']
  ].map(([title,text])=>`<article class="roadmap-card"><h3>${title}</h3><p>${text}</p></article>`).join('')}</div><div class="mt-60">${heading('Common questions','How to read the portfolio.')}<div class="faq-list"><details><summary>Does a mission plan mean the work was completed?</summary><p>No. Mission identifiers and plans organize the work. Execution requires observed evidence within the stated surface.</p></details><details><summary>Does a recipe check verify an Onyx security control?</summary><p>Only if the evidence actually establishes that control in the scoped native environment. A supporting recipe alone does not establish native Onyx behavior.</p></details><details><summary>Are the eight tracks completed client projects?</summary><p>No. C01–C08 are proposed portfolio candidates. The catalog supplies their allocation; results and status depend on scoped evidence.</p></details><details><summary>Which source is currently available?</summary><p>The complete 30 September 2026 catalog and WAAN template are available. All 640 A–P mission fields, 143 ecosystem rows and four recorded recipe outputs are accessible through the research catalog.</p></details><details><summary>Are transfer targets contributions or audits?</summary><p>No contribution or audit is implied. A transfer target is a proposed product on which to apply or compare security reasoning.</p></details></div></div><div class="p-cta"><p>Requirement → Source/Control → Test → Raw Evidence → Result → Remediation → Retest → Decision → Case Study</p><a class="text-link" href="methodology.html">Engineering workflow</a></div></div></section>`;
await page('evidence.html','Evidence & Assessment | Ahmed','SRC, DOC, INF, PLAN, and RUN classifications, with separate runtime, assessment, and professional-experience gates.',evidencePage,'method');

const methodSteps=[['Inspect','Establish the product context and authorized scope.'],['Trace','Follow identity, data, control flow, and authority.'],['Predict','State a hypothesis and expected boundary behavior.'],['Attempt','Design and run only the authorized scoped test.'],['Observe','Capture the raw result and appropriate controls.'],['Explain','Relate the observation to the boundary and its limits.'],['Improve','Propose or implement a proportionate mitigation.'],['Retest','Repeat the controls and preserve the new evidence.'],['Transfer','Apply the reasoning to a stated comparison surface.']];
const methodology=intro('Security engineering methodology','A workflow that can be inspected.','Inspect → Trace → Predict → Attempt → Observe → Explain → Improve → Retest → Transfer')+
  `<section class="features-area-two section-space"><div class="container">${heading('Method','From a question to a security decision.')}<p class="section-intro">This is the intended engineering workflow. An individual step is claimed as performed only when its evidence is recorded.</p><ol class="method-chain">${methodSteps.map(([title,copy],i)=>`<li><span>${String(i+1).padStart(2,'0')}</span><strong>${title}</strong><p>${copy}</p></li>`).join('')}</ol><h2 class="section-heading mt-60">The evidence chain.</h2><ol class="method-chain">${['Requirement','Source / Control','Test','Raw Evidence','Result','Remediation','Retest','Decision','Case Study'].map((title,i)=>`<li><span>${String(i+1).padStart(2,'0')}</span><strong>${title}</strong></li>`).join('')}</ol><p class="method-note">The case-study pages preserve the requested 24-part structure, including source/revision, controls, results, remediation, retest, containment, recovery, residual risk, transfer, and evidence classification.</p><a class="text-link" href="projects.html">Explore the case-study format</a></div></section>`;
await page('methodology.html','Security Engineering Methodology | Ahmed','A traceable security engineering workflow from requirements and controls to raw evidence, retests, and decisions.',methodology,'method');

const roadmap=intro('Engineering roadmap','A progression, not a readiness score.','Mission numbers are stable identifiers. They are not guaranteed months, a rigid calendar, or proof that experiments were completed.')+
  `<section class="team-area section-space"><div class="container"><div class="registry-summary"><p>Source-backed mission architecture</p><span class="status-label plan">PLAN · Roadmap</span></div><div class="roadmap-grid">${data.roadmap.map(r=>`<article class="roadmap-card"><h3>${r.title}</h3><p class="mission-line">${r.missions}</p><p>${r.text}</p></article>`).join('')}</div><div class="p-cta"><p>Independent assessment and professional operating experience remain separate from the roadmap.</p><a class="text-link" href="missions.html">Mission registry</a></div></div></section>`;
await page('roadmap.html','AI Security Engineering Roadmap | Ahmed','The proposed security mission progression across application, agent, model, inference platform, and security program work.',roadmap,'about');

const ecosystem=intro('Project ecosystem','One anchor. A complete transfer register.','141 original project inputs and two additional OpenHands component owners. Search planned mission associations, architecture roles and selected study depths.')+
  `<section class="gallery-area section-space"><div class="container"><aside class="catalog-note"><strong>Research snapshots, explicit practice roles</strong><p>Repository identity metadata was recorded by the catalog on 30 September 2026. Mission assignments and study depths are plans; they imply no contribution, audit or proficiency. <a class="text-link" href="catalog/section-09.html">Register provenance and gates</a>.</p></aside><div data-filter-region data-noun="ecosystem records"><div class="search-tools ecosystem-tools"><div><label class="field-label" for="project-search">Search names, project IDs, missions or roles</label><input type="search" id="project-search" placeholder="Try OpenHands, P018, M09 or collector" autocomplete="off"></div><div><label class="field-label" for="project-domain">Study area</label><select id="project-domain"><option value="*">All areas</option>${Object.entries(domainNames).map(([key,name])=>`<option value="${key}">${esc(name)}</option>`).join('')}</select></div><div><label class="field-label" for="project-depth">Planned study depth</label><select id="project-depth" data-filter-key="depth"><option value="*">All depths</option><option value="D">Deep</option><option value="W">Working</option><option value="R">Reference</option></select></div></div><div class="registry-summary"><p data-result-count aria-live="polite">143 ecosystem records</p><span class="status-label">20 Deep · 39 Working · 82 Reference original inputs</span></div><div class="ecosystem-grid">${data.ecosystem.map(p=>catalog.projectCard(p)).join('')}</div><p class="no-results" data-no-results hidden>No ecosystem records match these filters.</p></div></div></section>`;
await page('ecosystem.html','Project Ecosystem & Transfer Register | Ahmed','Search all 141 original ecosystem inputs and two additional component owners, with source pins, mission associations and planned study depths.',ecosystem);
for(const project of data.ecosystem) {
  const detail=intro(project.id,project.name,project.role,'../')+`<section class="project-detail section-space"><div class="container"><div class="detail-layout"><div>${catalog.projectDetail(project)}</div><aside class="detail-sidebar"><h2>Planned associations</h2><p>${project.missions.map(id=>`<a class="text-link" href="../missions/${id.toLowerCase()}.html">${id}</a>`).join(' · ')}</p><a class="text-link" href="../ecosystem.html">All 143 ecosystem records</a></aside></div></div></section>`;
  await page(`ecosystem/${project.slug}.html`,`${project.name} · Ecosystem Reference | Ahmed`,`${project.name}: catalog-selected practice role, source snapshot, mission associations and execution gates.`,detail);
  // Keep the ten project routes exposed by the earlier draft accessible.
  if(['Onyx','OpenHands','Cline','Dify','Open WebUI','LibreChat','AnythingLLM','pgvector','Haystack','LlamaIndex'].includes(project.name)) {
    const oldSlug=project.name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
    await page(`ecosystem/${oldSlug}.html`,`${project.name} · Ecosystem Reference | Ahmed`,`${project.name} catalog relationship.`,detail,'work',{noindex:true,canonicalFile:`ecosystem/${project.slug}.html`});
  }
}
const supporting=intro('Verified supporting labs / artifact checks','Four recorded checks. Four precise scopes.','The catalog records three local fixtures and one real tiny trained classifier. Their RUN evidence supports those artifacts; mission completion and learner assessment remain separate.')+`<section class="blog-area section-space"><div class="container">${supportingEmpty()}</div></section>`;
await page('supporting-labs.html','Verified Supporting Recipes | Ahmed','Four catalog-recorded local recipe checks with exact source hashes, captured outputs and bounded evidence scopes.',supporting);
for(const lab of data.supportingLabs) {
  await page(`supporting-labs/${lab.id.toLowerCase()}.html`,`${lab.id} · ${lab.title} | Ahmed`,`${lab.title}: catalog-recorded execution output, source hash, environment and scope limitations.`,intro(lab.id,lab.title,'Catalog-recorded supporting evidence · 30 September 2026','../')+`<section class="project-detail section-space"><div class="container"><div class="text-prose">${catalog.labDetail(lab)}</div></div></section>`);
}
const research=intro('Research & engineering notes','Inspect the source. Keep the claim precise.','A research baseline, complete assignment contracts and narrowly recorded supporting checks organize the portfolio.')+`<section class="blog-area section-space"><div class="container"><div class="roadmap-grid">${[
  ['Onyx architecture and edition boundaries','Source observations with runtime parity still pending.','catalog/section-01.html','SRC / DOC / INF'],
  ['First five source studies','Detailed plans for architecture, ownership, uploads, deployment and data minimization.','catalog/section-05.html','PLAN'],
  ['Recorded local checks','Inspect the exact fixture/model sources, hashes, outputs and limits.','supporting-labs.html','RUN · supporting artifacts'],
  ['Independent assessment designs','Twelve unseen-variant designs with assistance, ground truth and reviewer requirements.','assessment.html','PLAN · NOT ASSESSED'],
  ['Integrated secure-delivery capstone','One support-summary action through retrieval, approval, effects, evaluation and recovery.','capstone.html','PLAN · NOT BUILT'],
  ['Supervised professional-work bridge','Three proposed narrow scopes with explicit acceptance and supervision.','professional-practice.html','PLAN · scope templates']
].map(([title,copy,url,label])=>`<article class="roadmap-card"><span class="status-label">${label}</span><h2>${title}</h2><p>${copy}</p><a class="text-link" href="${url}">Read the engineering record</a></article>`).join('')}</div><div class="p-cta"><p>The full catalog includes all 20 sections and preserves the source’s evidence boundaries.</p><a class="text-link" href="catalog.html">Complete research catalog</a></div></div></section>`;
await page('research.html','Research & Engineering Notes | Ahmed','Source-backed Onyx architecture research, supporting recipe records, assessment designs and secure-delivery plans.',research);
const catalogIndex=intro('Research catalog','The complete source, made navigable.','All 20 sections of the supplied Onyx security mission catalog, edition 30 September 2026. Detailed research and plans remain accessible beside the concise portfolio.')+`<section class="section-space"><div class="container"><p class="method-note mb-40">Source SHA-256: <code>${data.source.sha256}</code>. <a class="text-link" href="assets/content/onyx-security-catalog.md">Read the original Markdown</a>. Observed source/documentation, planned assignments, four recorded supporting runs and pending assessment remain distinct.</p>${catalog.sectionCards()}</div></section>`;
await page('catalog.html','Complete Onyx Research Catalog | Ahmed','Explore all 20 catalog sections: missions, ecosystem, transfer, recipe evidence, assessments, portfolio allocation, capstone and professional-work templates.',catalogIndex,'method');
await fs.mkdir(path.join(out,'assets/content'),{recursive:true});
await fs.copyFile(path.join(root,data.source.sourceFile),path.join(out,'assets/content/onyx-security-catalog.md'));
for(const section of catalog.sections) {
  const label=section.id===11?'Catalog-recorded recipe RUN · native adapters planned':section.id===8?'Primary-source register · recorded check dates':'Source-backed research and plans · runtime and assessment gates preserved';
  await page(`catalog/section-${String(section.id).padStart(2,'0')}.html`,`${section.title} · Research Catalog | Ahmed`,`${section.title}, preserved from the supplied 30 September 2026 Onyx catalog.`,intro(`Catalog §${section.id}`,section.title,label,'../')+`<section class="section-space"><div class="container"><article class="catalog-prose">${catalog.markdown(section.body,'../')}</article><div class="p-cta"><p>Source edition 2026-09-30. These records do not establish an independently assessed learner pass.</p><a class="text-link" href="../catalog.html">All 20 catalog sections</a></div></div></section>`,'method',{noindex:true});
}
for(const [file,number,kicker,title,copy] of [
  ['assessment.html',14,'Assessment design','A fresh problem, a defensible answer.','Twelve practical assessment designs. An experienced reviewer must create an unseen variant and record actual assistance and results. Independent assessment is pending.'],
  ['capstone.html',17,'Integrated capstone','One feature. Multiple security boundaries.','A planned synthetic support-summary action spanning caller identity, authorized retrieval, exact approval, effect receipts, evaluation and recovery. Implementation and all 24 cases remain pending.'],
  ['professional-practice.html',16,'Professional-work bridge','A narrow responsibility, with the right review.','Three proposed supervised scopes connect demonstrated evidence to future authorized work. These are scope templates, with no completed client engagements claimed.']
]) {
  const section=catalog.sections.find(s=>s.id===number);
  await page(file,`${title} | Ahmed`,copy,intro(kicker,title,copy)+`<section class="section-space"><div class="container"><article class="catalog-prose">${catalog.markdown(section.body)}</article><div class="p-cta"><p>Keep scope, independent demonstration and actual accepted work separate.</p><a class="text-link" href="catalog.html">Full evidence system</a></div></div></section>`,'method');
}

const contact=intro('Contact','Explore the work. Connect through GitHub.','The supplied GitHub profile is the available public contact route for this portfolio.')+contactBlock();
await page('contact.html','Contact Ahmed | AI Security Engineering','Connect with Ahmed through the supplied public GitHub profile.',contact,'contact');
const credits=intro('Credits & sources','A portfolio with traceable inputs.','The visual foundation, research sources and evidence scope are explicit.')+`<section class="section-space"><div class="container"><div class="text-prose"><h2>Template foundation</h2><p>Adapted from the supplied WAAN Business Consulting HTML template by zcube. Its Bootstrap grid, theme spacing, responsive rules, hero composition, gallery filters, carousel, timeline rows, mobile navigation and scroll transitions form this portfolio’s foundation.</p><p>Third-party copyright and license notices remain in the retained vendor files. No blanket license is asserted over the template or its dependencies.</p><h2 id="content-sources">Content sources</h2><ul><li>The supplied portfolio brief defines Ahmed’s career direction, requested page structure and evidence rules.</li><li>The supplied WAAN archive includes waan.zip and Documentation.zip; its full inventory and adaptation decisions are recorded in the repository.</li><li>The complete Onyx security mission catalog, final 30 September 2026, supplies all 40 missions, 640 A–P fields, eight track allocations, 141 inputs, two additional component owners, 40 transfer routes and four narrowly recorded recipe checks.</li></ul><p><a class="text-link" href="catalog.html">Explore all 20 source sections</a> · <a class="text-link" href="assets/content/onyx-security-catalog.md">Original catalog Markdown</a> · <a class="text-link" href="catalog/section-08.html">Primary-source register</a></p><p>Catalog SHA-256: <code>${data.source.sha256}</code>.</p><h2>Evidence and authorship</h2><p>Catalog source/documentation observations retain their recorded dates. The pinned Onyx mission baseline is <code>${data.source.onyxRevision}</code>; the later ecosystem head does not repin it. This website import verifies source completeness and the four included script hashes, with no new native security assessment implied.</p><p>RUN is confined to catalog-recorded local artifact checks. Their execution is not attributed to Ahmed. All mission experiments, native integrations, independent assessment, capstone implementation and professional operating evidence retain their pending states. The portfolio implementation and presentation were created with AI assistance from Ahmed’s supplied brief and catalog.</p><h2>Asset adaptation</h2><p>Template portraits, demo companies, testimonials, stock claims and contact details have been replaced with source-backed portfolio content. The template’s member-only SplitText distribution is excluded; its reveal behavior is adapted through retained GSAP and CSS. System fonts avoid external font requests. Contact uses the supplied GitHub profile.</p><p><a class="text-link external-link" href="${data.repository}" target="_blank" rel="noopener noreferrer">Portfolio source and verification records</a></p></div></div></section>`;
await page('credits.html','Credits & Content Sources | Ahmed','WAAN attribution, complete catalog provenance, evidence boundaries and assistance attribution.',credits,'method');


// Preserve every original WAAN page route, adapting its purpose to the portfolio.
const aliases={
  'index-2.html':home('slider'),'index-3.html':home('video'),'services.html':focus,'single-service.html':onyx,
  'single-projects.html':caseDetail(data.tracks[0],''),'team.html':missionPage,'team-single.html':missionDetail(missions[0],''),
  'blog.html':research,'blog-details.html':methodology,'faq.html':evidencePage,'pricing.html':evidencePage,
  'shop.html':ecosystem,'shop-details.html':onyx,'thank-you.html':contact
};
const aliasTargets={'index-2.html':'index.html','index-3.html':'index.html','services.html':'focus.html',
  'single-service.html':'onyx-lab.html','single-projects.html':'case-studies/c01.html','team.html':'missions.html',
  'team-single.html':'missions/m01.html','blog.html':'research.html','blog-details.html':'methodology.html',
  'faq.html':'evidence.html','pricing.html':'evidence.html','shop.html':'ecosystem.html','shop-details.html':'onyx-lab.html','thank-you.html':'contact.html'};
for(const [file,main] of Object.entries(aliases)) await page(file,`Ahmed | AI Security Engineering`, 'Evidence-aware AI security engineering portfolio.',main,
  file.startsWith('index-')?'home':file.includes('team')?'missions':file==='thank-you.html'?'contact':'work',{noindex:true,canonicalFile:aliasTargets[file]});
await fs.writeFile(path.join(out,'robots.txt'),data.source.publishReady?`User-agent: *\nAllow: /\n${data.productionUrl?`Sitemap: ${data.productionUrl.replace(/\/$/,'')}/sitemap.xml\n`:''}`:'User-agent: *\nDisallow: /\n');
if(data.productionUrl) await fs.writeFile(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${indexed.map(file=>`<url><loc>${esc(new URL(file,data.productionUrl.replace(/\/$/,'')+'/').href)}</loc></url>`).join('')}</urlset>`);
await fs.mkdir(path.join(root,'docs'),{recursive:true});
await fs.writeFile(path.join(root,'docs/build-manifest.json'),JSON.stringify({mode:production?'production':data.source.publishReady?'publication-ready':'review-draft',source:data.source,missionIdentifiers:missions.map(m=>m.id),catalogRecordsImported:data.missions.length,caseStudyCandidates:data.tracks.map(t=>t.id),catalogRecordedSupportingRuns:data.supportingLabs.filter(l=>l.classification==='RUN').length,missionFields:missions.reduce((n,m)=>n+Object.keys(m.fields).length,0),ecosystemInputs:141,additionalComponentOwners:2,transferRoutes:40,catalogSections:20,pages:built,productionBlockers},null,2)+'\n');
console.log(`Built ${built.length} static pages; 40 mission identifiers; 8 proposed case-study tracks.`);
console.log(data.source.catalogAvailable?'Catalog records imported.':'Review draft: 0 catalog mission records imported; no executed labs asserted.');
