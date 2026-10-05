import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'public');
const data=JSON.parse(await fs.readFile(path.join(root,'data/portfolio.json'),'utf8'));
const layout=await fs.readFile(path.join(root,'src/layout.html'),'utf8');
const production=process.argv.includes('--production');
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rich=value=>esc(value).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
const paragraphs=values=>values.map(value=>`<p>${rich(value)}</p>`).join('');
if(!data.publication?.ready && production)throw new Error('Public content has not been marked ready.');
if(data.productionUrl && !/^https:\/\//.test(data.productionUrl))throw new Error('The production origin must use HTTPS.');
const contactInfo=data.contact;
if(!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(contactInfo.email)||contactInfo.formAction!==`https://formsubmit.co/${contactInfo.email}`)throw new Error('The contact form must target the configured email through FormSubmit.');
if(contactInfo.phoneUri!==`tel:${contactInfo.phone.replace(/^00/,'+')}`||contactInfo.phoneDisplay.replace(/\s/g,'')!==contactInfo.phoneUri.slice(4))throw new Error('Contact phone links must preserve the supplied international number.');
const workProjects=data.about.projects.map((project,index)=>{
  const context=project.paragraphs[0].replace(/^I study (?:the security of )?/,'').replace(' that ',' ');
  return {...project,title:project.title.replace(/^[^—]+—\s*/,''),number:String(index+1).padStart(2,'0'),context:context.charAt(0).toUpperCase()+context.slice(1)};
});
if(workProjects.length!==4 || new Set(workProjects.map(project=>project.slug)).size!==4)throw new Error('Expected the four distinct About project profiles.');
for(const project of workProjects){
  if(!/^[a-z0-9-]+$/.test(project.slug)||!project.summary||project.focusAreas.length!==5)throw new Error('A project profile needs a safe slug, summary and focus areas.');
}
for(const photo of data.about.photos){
  if(!/^img\/about\/[a-z0-9-]+\.jpg$/.test(photo.src)||!Number.isInteger(photo.width)||!Number.isInteger(photo.height)||photo.width<1||photo.height<1)throw new Error('An About photo needs a local path and intrinsic dimensions.');
}
const assets=['css/bootstrap.min.css','css/animate.min.css','css/slick.css','css/meanmenu.css','css/default.css','css/waan.css','css/responsive.css','css/portfolio.css','css/curated.css','js/vendor/jquery.min.js','js/vendor/jquery.meanmenu.min.js','js/vendor/slick.min.js','js/vendor/gsap.min.js','js/vendor/ScrollTrigger.min.js','js/portfolio.js',...data.about.photos.map(photo=>photo.src)];
await fs.rm(out,{recursive:true,force:true});
await fs.mkdir(out,{recursive:true});
for(const file of assets){
  const destination=path.join(out,'assets',file);
  await fs.mkdir(path.dirname(destination),{recursive:true});
  await fs.copyFile(path.join(root,'assets',file),destination);
}
const pages=[],indexed=[];
const categories={enterprise:'Enterprise AI',chat:'Self-Hosted AI',knowledge:'RAG & Knowledge',integrations:'Models & Agents'};
if(workProjects.some(project=>!categories[project.category]))throw new Error('Unknown project filter category.');
function prefixFor(file){return '../'.repeat(file.split('/').length-1);}
function navigation(active,prefix){
  return '<ul>'+[['index.html','Home','home'],['projects.html','Selected Work','work'],['about.html','About','about'],['contact.html','Contact','contact']].map(([file,label,key])=>`<li><a href="${prefix}${file}"${key===active?' aria-current="page"':''}>${label}</a></li>`).join('')+'</ul>';
}
async function page(file,title,description,main,active,extra={}){
  const prefix=prefixFor(file);
  const canonical=data.productionUrl?new URL(extra.canonicalFile||file,data.productionUrl.replace(/\/$/,'')+'/').href:null;
  const indexable=data.publication.ready&&!extra.noindex;
  const variables={TITLE:esc(title),DESCRIPTION:esc(description),ROOT:prefix,FULL_NAME:esc(data.fullName),CONTACT_EMAIL:esc(contactInfo.email),CONTACT_PHONE_URI:esc(contactInfo.phoneUri),CONTACT_PHONE_DISPLAY:esc(contactInfo.phoneDisplay),PAGE_CLASS:'',ROBOTS:indexable?'index, follow':'noindex, follow',CANONICAL:canonical?`<link rel="canonical" href="${esc(canonical)}"><meta property="og:url" content="${esc(canonical)}">`:'',DRAFT_BANNER:'',NAVIGATION:navigation(active,prefix),MAIN:main};
  await fs.mkdir(path.dirname(path.join(out,file)),{recursive:true});
  await fs.writeFile(path.join(out,file),layout.replace(/\{\{([A-Z_]+)\}\}/g,(_,key)=>variables[key]??''));
  pages.push(file);if(indexable)indexed.push(file);
}
function heading(label,title,copy=''){
  return `<div class="section-title"><p class="eyebrow">${esc(label)}</p><h2 class="move-line-3d">${esc(title)}</h2>${copy?`<p class="section-intro">${esc(copy)}</p>`:''}</div>`;
}
function intro(label,title,copy,prefix=''){
  return `<section class="breadcrumb-area page-intro"><div class="container">${prefix?`<ol class="bread-crumb"><li><a href="${prefix}index.html">Home</a></li><li>${esc(label)}</li></ol>`:''}<p class="eyebrow">${esc(label)}</p><h1 class="move-line-3d">${esc(title)}</h1><p>${esc(copy)}</p></div></section>`;
}
function projectCard(project,prefix=''){
  return `<article class="case-card" data-filter-item data-categories="${esc(project.category)}"><header><span class="card-kicker">${project.number} / ${esc(categories[project.category])}</span><span class="status-label focus">Security focus</span></header><h3>${esc(project.title)}</h3><p>${esc(project.summary)}</p><ul class="topic-tags work-focus-tags" aria-label="Security focus areas">${project.focusAreas.map(area=>`<li>${esc(area)}</li>`).join('')}</ul><a class="card-link" href="${prefix}work/${project.slug}.html">View security focus</a></article>`;
}
function selectedWork(){
  return `<section id="selected-work" class="gallery-area section-space"><div class="container"><div class="section-head-row">${heading('Selected work','Security across four AI platforms.','Enterprise assistants, self-hosted chat, private knowledge workspaces, and multi-provider conversations.')}</div><div data-filter-region data-noun="projects"><div class="filter-layout"><div class="button-group filter-button-group" aria-label="Filter selected projects"><button type="button" data-category="*" class="active" aria-pressed="true">All projects</button>${Object.entries(categories).map(([key,label])=>`<button type="button" data-category="${key}" aria-pressed="false">${esc(label)}</button>`).join('')}</div><div><div class="portfolio-grid curated-work-grid">${workProjects.map(project=>projectCard(project)).join('')}</div><p data-result-count aria-live="polite" class="method-note mt-30">${workProjects.length} projects</p><p data-no-results hidden class="no-results">No projects match this filter.</p></div></div></div></div></section>`;
}
function contactDetails(){
  return `<address class="contact-details"><p class="contact-name">${esc(data.fullName)}</p><dl><div><dt>Email</dt><dd><a href="mailto:${esc(contactInfo.email)}">${esc(contactInfo.email)}</a></dd></div><div><dt>Mobile phone</dt><dd><a href="${esc(contactInfo.phoneUri)}">${esc(contactInfo.phoneDisplay)}</a></dd></div></dl></address>`;
}
function contactBlock(){
  return `<section id="contact" class="contact-area3 after-none contact-bg section-space"><div class="container"><div class="contact-layout"><div class="contact-copy">${heading('Connect','Let’s talk about AI security.','Have a project, a question, or a collaboration in mind? Send me a message.')}${contactDetails()}<a class="text-link external-link" href="${esc(data.github)}" target="_blank" rel="noopener noreferrer">GitHub profile</a></div><div class="contact-form-panel"><h3 id="contact-form-heading">Send a message</h3><p id="contact-form-help" class="contact-form-help">Fields marked * are required.</p><form class="contact-form" action="${esc(contactInfo.formAction)}" method="POST" data-contact-form data-thank-you-path="thank-you.html" aria-labelledby="contact-form-heading" aria-describedby="contact-form-help contact-form-provider"><input type="hidden" name="_subject" value="Portfolio message for ${esc(data.fullName)}"><input type="hidden" name="_template" value="table"><div class="form-honeypot" hidden aria-hidden="true"><label for="contact-website">Leave this field empty</label><input id="contact-website" name="_honey" type="text" tabindex="-1" autocomplete="off"></div><div class="contact-form-grid"><div class="contact-field"><label for="contact-name">Name *</label><input id="contact-name" name="name" type="text" autocomplete="name" maxlength="100" required></div><div class="contact-field"><label for="contact-email">Email *</label><input id="contact-email" name="email" type="email" autocomplete="email" maxlength="254" required></div><div class="contact-field contact-field-wide"><label for="contact-subject">Subject</label><input id="contact-subject" name="subject" type="text" maxlength="160"></div><div class="contact-field contact-field-wide"><label for="contact-message">Message *</label><textarea id="contact-message" name="message" rows="5" maxlength="5000" required></textarea></div></div><button class="btn" type="submit">Send message</button><p id="contact-form-provider" class="contact-form-provider">Messages are processed by <a class="external-link" href="https://formsubmit.co/" target="_blank" rel="noopener noreferrer">FormSubmit</a>.</p></form></div></div></div></section>`;
}
function hero(variant){
  let content=`<p class="eyebrow">AI application & product security</p><h1 class="move-line-3d"><span class="name">${esc(data.fullName)}</span>AI Security<br>Engineer<span class="hero-accent">.</span></h1><p class="hero-subtitle">Authorization · Retrieval · Agent Security</p><p class="hero-intro fade-slide bottom">${esc(data.intro)}</p><div class="slider-btn"><a class="btn" href="projects.html">Explore Selected Work</a><a class="btn btn-secondary" href="about.html">About Ahmed</a></div>`;
  if(variant==='slider'){
    const alternatives=[['Application security','Who can access it?','A focus on the permissions attached to application objects and retrieved information.'],['Agent security','What can it do?','A focus on the authority granted for a tool action.']];
    content=`<div class="slider-active" data-hero-carousel><div class="hero-slide">${content}</div>${alternatives.map(([label,title,copy])=>`<div class="hero-slide"><p class="eyebrow">${label}</p><h2 class="hero-slide-title">${title}</h2><p class="hero-intro">${copy}</p><a class="btn" href="projects.html">Explore Selected Work</a></div>`).join('')}</div><div class="hero-slider-controls"><button type="button" data-hero-prev aria-label="Previous hero slide">Previous</button><button type="button" data-hero-next aria-label="Next hero slide">Next</button><p data-hero-slide-status aria-live="polite">Slide 1 of 3</p></div>`;
  }
  return `<section id="home-intro" class="slider-area hero-section fix p-relative${variant==='video'?' slider-video':''}"><div class="single-slider slider-bg2 d-flex align-items-center"><div class="container"><div class="row align-items-center"><div class="col-lg-8"><div class="hero-content slider-content s-slider-content">${content}</div></div><div class="col-lg-4"><aside class="hero-scope fade-slide bottom"><p class="scope-kicker">Security focus</p><h2>Access.<br>Data.<br>Actions.</h2><ol class="scope-list"><li><code>01</code><span>Identity & ownership</span></li><li><code>02</code><span>Retrieval permissions</span></li><li><code>03</code><span>Delegated authority</span></li></ol><div class="scope-foot"><a class="text-link" href="projects.html">Selected work</a><span>Security focus</span></div></aside></div></div><div class="hero-bottom"><p>AI application security</p><p>Security across trust boundaries</p><a class="text-link external-link" href="${esc(data.github)}" target="_blank" rel="noopener noreferrer">GitHub profile</a></div></div></div></section>`;
}
const aboutBlock=`<section id="home-about" class="about-area section-space"><div class="container"><div class="row"><div class="col-lg-6 about-content">${heading('About',data.fullName)}${paragraphs(data.about.homeSummary)}<a class="text-link" href="about.html">More about Ahmed</a></div><div class="col-lg-6"><div class="focus-grid curated-focus-grid">${data.focus.map((focus,i)=>`<article class="sr-box-about fade-slide bottom"><span class="cluster-number">${String(i+1).padStart(2,'0')} / Focus</span><h3>${esc(focus.title)}</h3><p>${esc(focus.summary)}</p></article>`).join('')}</div></div></div></div></section>`;
const home=variant=>hero(variant)+selectedWork()+aboutBlock+contactBlock();
const projects=intro('Selected work','AI platforms & security engineering.','Four project profiles covering identity, data, retrieval, tools and trust boundaries.')+selectedWork();
const carousel=`<section class="testimonial-area section-space"><div class="container">${heading('Focus','The questions behind the work.')}<div class="testimonial-active">${[['Identity','Who is allowed to access this object?'],['Information','Does retrieval preserve the caller’s permissions?'],['Actions','Does this tool action stay within the authority granted?']].map(([label,copy])=>`<div class="single-testimonial"><div class="text-box"><h3>${label}</h3><p>${copy}</p></div></div>`).join('')}</div><div class="carousel-footer"><p>Application and agent security focus areas.</p><div class="carousel-controls"><button type="button" data-evidence-prev aria-label="Previous focus question">Previous</button><button type="button" data-evidence-next aria-label="Next focus question">Next</button></div></div></div></section>`;
const portrait=data.about.photos.find(photo=>photo.placement==='portrait');
function photoFigure(photo,portraitPhoto=false){
  return `<figure class="about-photo${portraitPhoto?' about-portrait':' about-award'}"><a class="about-photo-link" href="assets/${esc(photo.src)}" aria-label="View full photo: ${esc(photo.caption)}"><div class="${portraitPhoto?'about-portrait-frame':'about-award-media'}"><img src="assets/${esc(photo.src)}" width="${photo.width}" height="${photo.height}" alt="${esc(photo.alt)}" loading="${portraitPhoto?'eager':'lazy'}" decoding="async"></div></a><figcaption>${esc(photo.caption)}</figcaption></figure>`;
}
const aboutBiography=`<section class="about-area section-space about-biography"><div class="container"><div class="about-bio-grid"><div class="about-bio-copy">${heading('AI security','Securing the boundaries of AI.')}${paragraphs(data.about.biography)}</div>${photoFigure(portrait,true)}</div><div class="about-recognition">${heading('Recognition','Rising Star (Individual).')}<div class="about-recognition-gallery">${data.about.photos.filter(photo=>photo.placement==='recognition').map(photo=>photoFigure(photo)).join('')}</div></div></div></section>`;
const aboutProjects=`<section class="section-space about-projects"><div class="container">${heading('Projects','AI systems I study.')}<div class="about-project-grid">${data.about.projects.map(project=>`<article id="about-${esc(project.slug)}" class="about-project"><h3>${esc(project.title)}</h3>${paragraphs(project.paragraphs)}</article>`).join('')}</div></div></section>`;
const approach=data.about.approach;
const aboutApproach=`<section id="security-approach" class="about-area section-space about-approach"><div class="container"><div class="about-approach-copy">${heading('Engineering',approach.title)}<p>${esc(approach.focusLead)}</p><p class="about-security-focus"><strong>${esc(approach.focus.join(' · '))}</strong></p><p>${esc(approach.methodologyLead)}</p><p class="about-methodology"><strong>${esc(approach.methodology.join(' → '))}</strong></p><p>${esc(approach.evidence)}</p><p class="about-goal">${rich(approach.goal)}</p></div></div></section>`;
const about=intro('About',data.fullName,'Self-taught AI Security Engineer · GITEX AFRICA 2026 Rising Star')+aboutBiography+aboutProjects+aboutApproach+carousel+`<section class="section-space"><div class="container"><div class="faq-list"><details><summary>How does Selected Work connect to my approach?</summary><p>The four platform profiles apply the same focus on identity, sensitive data, retrieval, tool authority and trust boundaries to different AI application contexts.</p></details><details><summary>Where can I connect?</summary><p>Find my email, mobile phone and message form on the <a class="text-link" href="contact.html">Contact page</a>, or explore my <a class="text-link external-link" href="${esc(data.github)}" target="_blank" rel="noopener noreferrer">GitHub profile</a>.</p></details></div></div></section>`;
const contact=intro('Contact','Get in touch.','Contact Ahmed Amhdour about AI security, projects and collaboration.')+contactBlock();
const thankYou=intro('Contact','Thank you for getting in touch.','You can also reach me directly by email or phone.')+`<section class="contact-area3 after-none contact-bg section-space"><div class="container">${contactDetails()}<a class="btn" href="index.html">Back to home</a></div></section>`;
const credits=intro('Site credits','Design and asset attribution.','Source notices are retained with the distributed assets.')+`<section class="section-space"><div class="container"><div class="text-prose"><p>This website adapts a supplied HTML template. Third-party copyright and license notices remain in the relevant asset files.</p><p>No template demonstration portraits, company endorsements or customer testimonials are presented as personal work.</p><p>The project profiles describe platform contexts and security focus areas.</p></div></div></section>`;
function projectDetail(project,prefix='../'){
  return intro('Security project',project.title,project.summary,prefix)+`<section class="project-detail section-space"><div class="container"><div class="detail-layout"><div class="text-prose"><div class="project-context"><h2>Platform context</h2><p>${esc(project.context)}</p></div><div class="project-security-focus"><h2>Security focus</h2><p>${esc(project.paragraphs[1])}</p><ul class="topic-tags">${project.focusAreas.map(area=>`<li>${esc(area)}</li>`).join('')}</ul></div></div><aside class="detail-sidebar"><span class="status-label focus">Security focus</span><h2 class="mt-30">${esc(categories[project.category])}</h2><p>Project ${project.number} · ${esc(project.title)}</p><p><a class="text-link" href="${prefix}about.html#about-${esc(project.slug)}">Project profile in About</a></p><p><a class="text-link" href="${prefix}about.html#security-approach">My engineering approach</a></p><a class="text-link" href="${prefix}projects.html">All selected projects</a></aside></div></div></section>`;
}
await page('index.html',`${data.fullName} | AI Security Engineer`,'Ahmed Amhdour, AI Security Engineer focused on securing AI applications, RAG systems and autonomous agents.',home(),'home');
await page('projects.html',`Selected Work | ${data.fullName}`,'Security focus across enterprise AI assistants, self-hosted chat, private knowledge workspaces and multi-provider AI platforms.',projects,'work');
await page('about.html','About Ahmed Amhdour | AI Security Engineer','Ahmed Amhdour, self-taught AI Security Engineer and GITEX AFRICA 2026 Rising Star (Individual) award recipient.',about,'about');
await page('contact.html',`Contact | ${data.fullName}`,'Email, call or send a message to Ahmed Amhdour about AI security and collaboration.',contact,'contact');
await page('credits.html','Site Credits | Ahmed','Design and asset attribution.',credits,'about',{noindex:true});
for(const project of workProjects)await page(`work/${project.slug}.html`,`${project.title} | ${data.fullName}`,project.summary,projectDetail(project),'work');
// Preserve existing project URLs as noindex equivalents of the matching platform profile.
const legacyWorkRoutes={'authorization':'enterprise-ai-assistant','retrieval-permissions':'private-ai-knowledge','tool-authorization':'multi-provider-ai-conversation'};
for(const [slug,target] of Object.entries(legacyWorkRoutes)){
  const project=workProjects.find(project=>project.slug===target);
  await page(`work/${slug}.html`,`${project.title} | ${data.fullName}`,project.summary,projectDetail(project),'work',{noindex:true,canonicalFile:`work/${target}.html`});
}
// Original template routes remain available as generic portfolio equivalents.
const aliases={
 'index-2.html':{main:home('slider'),target:'index.html',active:'home'},'index-3.html':{main:home('video'),target:'index.html',active:'home'},
 'services.html':{main:about,target:'about.html',active:'about'},'single-service.html':{main:about,target:'about.html',active:'about'},
 'single-projects.html':{main:projectDetail(workProjects[0],''),target:'work/enterprise-ai-assistant.html',active:'work'},
 'team.html':{main:about,target:'about.html',active:'about'},'team-single.html':{main:about,target:'about.html',active:'about'},
 'blog.html':{main:projects,target:'projects.html',active:'work'},'blog-details.html':{main:projectDetail(workProjects[0],''),target:'work/enterprise-ai-assistant.html',active:'work'},
 'faq.html':{main:about,target:'about.html',active:'about'},'pricing.html':{main:about,target:'about.html',active:'about'},
 'shop.html':{main:projects,target:'projects.html',active:'work'},'shop-details.html':{main:projectDetail(workProjects[3],''),target:'work/multi-provider-ai-conversation.html',active:'work'},
 'thank-you.html':{main:thankYou,target:'contact.html',active:'contact'}
};
for(const [file,alias] of Object.entries(aliases))await page(file,'Ahmed | AI Security Engineering',data.intro,alias.main,alias.active,{noindex:true,canonicalFile:alias.target});
await fs.writeFile(path.join(out,'robots.txt'),`User-agent: *\n${data.publication.ready?'Allow: /':'Disallow: /'}\n${data.productionUrl?`Sitemap: ${data.productionUrl.replace(/\/$/,'')}/sitemap.xml\n`:''}`);
if(data.productionUrl)await fs.writeFile(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${indexed.map(file=>`<url><loc>${esc(new URL(file,data.productionUrl.replace(/\/$/,'')+'/').href)}</loc></url>`).join('')}</urlset>`);
await fs.writeFile(path.join(root,'docs/build-manifest.json'),JSON.stringify({mode:production?'production':'preview',publication:'curated',primaryNavigation:['Home','Selected Work','About','Contact'],contactForms:{provider:'FormSubmit',recipient:contactInfo.email,pages:['index.html','index-2.html','index-3.html','contact.html'],activation:'requires first-submission email confirmation; unverified'},aboutProjects:data.about.projects.length,aboutPhotos:data.about.photos.length,selectedProjects:workProjects.map(project=>({slug:project.slug,title:project.title,presentation:'Security focus'})),legacyProjectRoutes:Object.entries(legacyWorkRoutes).map(([slug,target])=>({file:`work/${slug}.html`,target:`work/${target}.html`})),researchDownloads:false,assets:assets.map(file=>'assets/'+file),pages,indexedPages:indexed,productionBlockers:[]},null,2)+'\n');
console.log(`Built ${pages.length} pages; four primary pages and four AI platform profiles. Research data is excluded from the output.`);
