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
const allowedKeys=['name','role','direction','intro','github','repository','productionUrl','publication','focus','studies'];
expect(Object.keys(data).every(key=>allowedKeys.includes(key)),'Unexpected research input is present in public data.');
expect(data.publication.ready && data.publication.mode==='curated' && data.publication.researchDownloads===false,'Public disclosure policy changed.');
expect(data.studies.length===3,'Expected three selected study designs.');
expect(!/\b(?:[MPCE]\d{2,3}|[a-f0-9]{40,64})\b/i.test(JSON.stringify(data)),'A research identifier or source pin reached public content.');
expect(JSON.stringify(manifest.primaryNavigation)===JSON.stringify(['Home','Selected Work','About','Contact']),'The four-page navigation changed.');
const allowedPages=['index.html','projects.html','about.html','contact.html','credits.html',...data.studies.map(study=>'work/'+study.slug+'.html'),'index-2.html','index-3.html','services.html','single-service.html','single-projects.html','team.html','team-single.html','blog.html','blog-details.html','faq.html','pricing.html','shop.html','shop-details.html','thank-you.html'];
expect(new Set(manifest.pages).size===allowedPages.length && manifest.pages.every(file=>allowedPages.includes(file)),'Unexpected pages or duplicate routes were generated.');
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
const report={result:errors.length?'fail':'pass',primaryPages:4,selectedStudyDesigns:3,fieldsPerStudy:7,publishedPages:manifest.pages.length,publishedAssets:manifest.assets.length,externalLinksChecked:checkedExternalLinks,publicArtifactAllowlist:'enforced',researchDownloads:false,completedAssessmentClaims:0,browserRendering:'unverified',errors};
await fs.writeFile(path.join(root,'docs/content-verification.json'),JSON.stringify(report,null,2)+'\n');
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`Content checks passed: four primary pages, three planned studies, ${files.length} allowlisted public artifacts, and ${checkedExternalLinks} approved profile links.`);
