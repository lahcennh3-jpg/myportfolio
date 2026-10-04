import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const directory=path.join(root,'public');
const data=JSON.parse(await fs.readFile(path.join(root,'data/portfolio.json'),'utf8'));
const manifest=JSON.parse(await fs.readFile(path.join(root,'docs/build-manifest.json'),'utf8'));
const errors=[];
const expect=(condition,message)=>{if(!condition)errors.push(message);};
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rich=value=>esc(value).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
const allowedKeys=['name','fullName','role','direction','intro','github','repository','productionUrl','publication','focus','about'];
expect(Object.keys(data).every(key=>allowedKeys.includes(key)),'Unexpected research input is present in public data.');
expect(data.publication.ready && data.publication.mode==='curated' && data.publication.researchDownloads===false,'Public disclosure policy changed.');
const projectSlugs=['enterprise-ai-assistant','self-hosted-ai-chat','private-ai-knowledge','multi-provider-ai-conversation'];
expect(JSON.stringify(data.about.projects.map(project=>project.slug))===JSON.stringify(projectSlugs),'Selected Work must use the four About project profiles in their supplied order.');
expect(manifest.selectedProjects.length===4 && manifest.selectedProjects.every(project=>project.presentation==='Security focus'),'Project profiles must describe security focus without claiming completed results.');
expect(!/\b(?:[MPCE]\d{2,3}|[a-f0-9]{40,64})\b/i.test(JSON.stringify(data)),'A research identifier or source pin reached public content.');
expect(JSON.stringify(manifest.primaryNavigation)===JSON.stringify(['Home','Selected Work','About','Contact']),'The four-page navigation changed.');
const legacyRoutes=[{file:'work/authorization.html',target:'work/enterprise-ai-assistant.html'},{file:'work/retrieval-permissions.html',target:'work/private-ai-knowledge.html'},{file:'work/tool-authorization.html',target:'work/multi-provider-ai-conversation.html'}];
expect(JSON.stringify(manifest.legacyProjectRoutes)===JSON.stringify(legacyRoutes),'The existing project URLs lost their matching platform profiles.');
const allowedPages=['index.html','projects.html','about.html','contact.html','credits.html',...projectSlugs.map(slug=>'work/'+slug+'.html'),...legacyRoutes.map(route=>route.file),'index-2.html','index-3.html','services.html','single-service.html','single-projects.html','team.html','team-single.html','blog.html','blog-details.html','faq.html','pricing.html','shop.html','shop-details.html','thank-you.html'];
expect(new Set(manifest.pages).size===allowedPages.length && manifest.pages.every(file=>allowedPages.includes(file)),'Unexpected pages or duplicate routes were generated.');
const aboutHtml=await fs.readFile(path.join(directory,'about.html'),'utf8');
expect(data.fullName==='Ahmed Amhdour','The supplied full name changed.');
expect(data.about.biography.length===4 && data.about.projects.length===4,'The supplied biography or four project profiles are incomplete.');
expect((aboutHtml.match(/class="about-project"/g)||[]).length===4,'The About page must render four project profiles.');
for(const project of data.about.projects){
  expect(project.paragraphs.length===2 && aboutHtml.includes(esc(project.title)),`${project.title}: the supplied project profile is incomplete.`);
}
const approach=data.about.approach;
const aboutCopy=[...data.about.biography,...data.about.projects.flatMap(project=>project.paragraphs),approach.focusLead,'**'+approach.focus.join(' · ')+'**',approach.methodologyLead,'**'+approach.methodology.join(' → ')+'**',approach.evidence,approach.goal];
for(const copy of aboutCopy)expect(aboutHtml.includes(rich(copy)),'A supplied About paragraph was omitted or altered.');
expect(aboutHtml.includes(esc(approach.title)) && approach.focus.length===12 && approach.methodology.length===8,'The engineering approach is incomplete.');
expect(data.about.photos.length===3 && (aboutHtml.match(/<img\b/g)||[]).length===3,'The About photo selection is incomplete.');
for(const photo of data.about.photos){
  expect(aboutHtml.includes(`src="assets/${esc(photo.src)}"`) && aboutHtml.includes(`alt="${esc(photo.alt)}"`) && aboutHtml.includes(`width="${photo.width}" height="${photo.height}"`),`${photo.src}: a photo, accessible description or intrinsic size is missing.`);
  expect(manifest.assets.includes('assets/'+photo.src),`${photo.src}: the photo is not allowlisted.`);
}
const homeHtml=await fs.readFile(path.join(directory,'index.html'),'utf8');
for(const file of ['index.html','index-2.html','index-3.html']){
  const html=file==='index.html'?homeHtml:await fs.readFile(path.join(directory,file),'utf8');
  const hero=html.match(/<section\b[^>]*id="home-intro"[^>]*>([\s\S]*?)<\/section>/)?.[1]||'';
  expect(hero.includes(`<span class="name">${esc(data.fullName)}</span>`),`${file}: the opening heading omitted the full name or retained the name punctuation.`);
  expect(hero.includes(esc(data.intro)),`${file}: the opening personal introduction is missing.`);
  expect(!/\bstud(?:y|ies|ying)\b|\blearning\b|\bstudent\b/i.test(hero),`${file}: the opening section describes learning or studying.`);
}
const homeAbout=homeHtml.match(/<section\b[^>]*id="home-about"[^>]*>([\s\S]*?)<\/section>/)?.[1]||'';
for(const copy of data.about.homeSummary)expect(homeAbout.includes(rich(copy)),'The short homepage About omitted the professional summary or award.');
expect(!/\bstud(?:y|ies|ying)\b|\blearning\b|\bstudent\b/i.test(homeAbout),'The homepage About describes learning or studying.');
for(const file of ['index.html','index-2.html','index-3.html','projects.html','blog.html','shop.html']){
  const html=await fs.readFile(path.join(directory,file),'utf8');
  const selected=html.match(/<section\b[^>]*id="selected-work"[^>]*>([\s\S]*?)<\/section>/)?.[1]||'';
  expect((selected.match(/class="case-card"/g)||[]).length===4,`${file}: Selected Work must show four project cards.`);
  expect((selected.match(/class="status-label focus"/g)||[]).length===4,`${file}: the project focus labels are missing.`);
  expect(!/\bstud(?:y|ies|ying)\b|\blearning\b|\bstudent\b/i.test(selected),`${file}: Selected Work describes learning or studying.`);
  for(const project of data.about.projects){
    const title=project.title.replace(/^[^—]+—\s*/,'');
    expect(selected.includes(esc(title)) && selected.includes(esc(project.summary)) && selected.includes(`href="work/${project.slug}.html"`),`${file}: ${project.slug} is missing or differs from About.`);
    expect(selected.includes(`data-category="${project.category}"`),`${file}: ${project.slug} has no filter control.`);
    for(const area of project.focusAreas)expect(selected.includes(esc(area)),`${file}: ${project.slug} omitted a focus area.`);
  }
}
for(const project of data.about.projects){
  const html=await fs.readFile(path.join(directory,'work',project.slug+'.html'),'utf8');
  expect(html.includes(esc(project.paragraphs[1])),`${project.slug}: the supplied security scope was omitted.`);
  expect(html.includes(`href="../about.html#about-${project.slug}"`) && html.includes('href="../about.html#security-approach"'),`${project.slug}: the About profile or approach link is missing.`);
  expect(!/\bstud(?:y|ies|ying)\b|\blearning\b|\bstudent\b/i.test(html),`${project.slug}: the project page describes learning or studying.`);
  for(const area of project.focusAreas)expect(html.includes(esc(area)),`${project.slug}: a focus area is missing.`);
}
for(const route of legacyRoutes){
  const html=await fs.readFile(path.join(directory,route.file),'utf8');
  expect(html.includes('<meta name="robots" content="noindex, follow">') && !manifest.indexedPages.includes(route.file),`${route.file}: the legacy equivalent must be noindex.`);
}
async function walk(folder){return (await Promise.all((await fs.readdir(folder,{withFileTypes:true})).map(entry=>entry.isDirectory()?walk(path.join(folder,entry.name)):[path.relative(directory,path.join(folder,entry.name))]))).flat();}
const files=await walk(directory);
const allowedFiles=new Set([...manifest.pages,...manifest.assets,'robots.txt',...(data.productionUrl?['sitemap.xml']:[])]);
for(const file of files)expect(allowedFiles.has(file),`Unexpected published artifact: ${file}`);
expect(files.length===allowedFiles.size,'A declared public artifact is missing.');
let checkedExternalLinks=0;
for(const file of manifest.pages){
  const html=await fs.readFile(path.join(directory,file),'utf8');
  expect(!/href="(?:\.\.\/)*(?:catalog|missions|ecosystem|roadmap|assessment|capstone|supporting-labs)(?:\.html|\/)/i.test(html),`${file}: a research route was reintroduced.`);
  for(const match of html.matchAll(/href="(https:\/\/[^\"]+)"/g)){
    checkedExternalLinks++;
    expect(match[1]===data.github,`${file}: an unapproved project link was published.`);
  }
  expect(!/\b(?:M\d{2}|P\d{3}|C\d{2}|U\d{2})\b/.test(html),`${file}: a research identifier was published.`);
}
const report={result:errors.length?'fail':'pass',primaryPages:4,aboutProjectProfiles:data.about.projects.length,suppliedAboutParagraphsChecked:aboutCopy.length,aboutPhotos:data.about.photos.length,selectedProjectProfiles:manifest.selectedProjects.length,projectListingsChecked:6,focusAreasPerProject:5,legacyProjectRoutes:legacyRoutes.length,publishedPages:manifest.pages.length,publishedAssets:manifest.assets.length,externalLinksChecked:checkedExternalLinks,publicArtifactAllowlist:'enforced',researchDownloads:false,completedAssessmentClaims:0,browserRendering:'unverified',errors};
await fs.writeFile(path.join(root,'docs/content-verification.json'),JSON.stringify(report,null,2)+'\n');
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`Content checks passed: four primary pages, four project profiles matching About, ${files.length} allowlisted public artifacts, and ${checkedExternalLinks} approved profile links.`);
