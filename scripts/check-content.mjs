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
const allowedKeys=['name','fullName','role','direction','intro','github','repository','productionUrl','publication','focus','studies','about'];
expect(Object.keys(data).every(key=>allowedKeys.includes(key)),'Unexpected research input is present in public data.');
expect(data.publication.ready && data.publication.mode==='curated' && data.publication.researchDownloads===false,'Public disclosure policy changed.');
expect(data.studies.length===3,'Expected three selected study designs.');
expect(!/\b(?:[MPCE]\d{2,3}|[a-f0-9]{40,64})\b/i.test(JSON.stringify(data)),'A research identifier or source pin reached public content.');
expect(JSON.stringify(manifest.primaryNavigation)===JSON.stringify(['Home','Selected Work','About','Contact']),'The four-page navigation changed.');
const allowedPages=['index.html','projects.html','about.html','contact.html','credits.html',...data.studies.map(study=>'work/'+study.slug+'.html'),'index-2.html','index-3.html','services.html','single-service.html','single-projects.html','team.html','team-single.html','blog.html','blog-details.html','faq.html','pricing.html','shop.html','shop-details.html','thank-you.html'];
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
for(const copy of data.about.biography.slice(0,2))expect(homeHtml.includes(rich(copy)),'The homepage About preview omitted the supplied introduction or award.');
for(const study of data.studies){
  expect(study.status==='Planned study' && study.result==='Execution and runtime results remain pending.',`${study.slug}: evidence status was promoted.`);
  const html=await fs.readFile(path.join(directory,'work',study.slug+'.html'),'utf8');
  expect((html.match(/class="case-field"/g)||[]).length===7,`${study.slug}: concise study fields are incomplete.`);
  for(const key of ['problem','boundary','scope','approach','mitigation','result','limitations'])expect(html.includes(esc(study[key])),`${study.slug}: ${key} was omitted.`);
  expect(html.includes('Planned study'),`${study.slug}: status label is absent.`);
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
const report={result:errors.length?'fail':'pass',primaryPages:4,aboutProjectProfiles:data.about.projects.length,suppliedAboutParagraphsChecked:aboutCopy.length,aboutPhotos:data.about.photos.length,selectedStudyDesigns:3,fieldsPerStudy:7,publishedPages:manifest.pages.length,publishedAssets:manifest.assets.length,externalLinksChecked:checkedExternalLinks,publicArtifactAllowlist:'enforced',researchDownloads:false,completedAssessmentClaims:0,browserRendering:'unverified',errors};
await fs.writeFile(path.join(root,'docs/content-verification.json'),JSON.stringify(report,null,2)+'\n');
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`Content checks passed: four primary pages, three planned studies, ${files.length} allowlisted public artifacts, and ${checkedExternalLinks} approved profile links.`);
