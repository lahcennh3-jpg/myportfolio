import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const directory=path.join(root,'public');
const errors=[];
const pages=JSON.parse(await fs.readFile(path.join(root,'docs/build-manifest.json'),'utf8')).pages;
let linkCount=0;
for(const file of pages) {
  const html=await fs.readFile(path.join(directory,file),'utf8');
  if((html.match(/<h1\b/g)||[]).length!==1) errors.push(`${file}: expected one h1`);
  if(!html.includes('<html lang="en">'))errors.push(`${file}: missing language`);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  if(ids.length!==new Set(ids).size)errors.push(`${file}: duplicate HTML IDs`);
  if(/lorem ipsum|Alonso D|Rosalina D|info@example|Bloomsbury|Happy Users|years of experience|100% readiness/i.test(html))errors.push(`${file}: template demonstration or unsupported experience remains`);
  if(/<form\b/.test(html))errors.push(`${file}: an unconfigured form is present`);
  for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const url=match[1];linkCount++;
    if(url.startsWith('https://')||url.startsWith('data:'))continue;
    if(/^(http:|javascript:|mailto:|tel:)/.test(url)){errors.push(`${file}: unsupported link ${url}`);continue;}
    const [target,hash]=url.split('#');
    const destination=path.resolve(path.dirname(path.join(directory,file)),target||path.basename(file));
    if(!destination.startsWith(directory+path.sep)){errors.push(`${file}: link escapes public directory`);continue;}
    try {
      await fs.access(destination);
      if(hash && destination.endsWith('.html')) {
        const targetHtml=await fs.readFile(destination,'utf8');
        if(!targetHtml.includes(`id="${hash}"`))errors.push(`${file}: missing fragment ${url}`);
      }
    } catch {errors.push(`${file}: missing linked file ${url}`);}
  }
  for(const match of html.matchAll(/<a\b([^>]+)>/g)) {
    if(match[1].includes('target="_blank"')&&!match[1].includes('noopener noreferrer'))errors.push(`${file}: external link lacks protection`);
  }
}
const registry=await fs.readFile(path.join(directory,'missions.html'),'utf8');
for(let i=1;i<=40;i++){
  const id=`M${String(i).padStart(2,'0')}`;
  if(!registry.includes(`class="mission-id">${id}</div>`))errors.push(`${id}: missing from mission registry`);
}
for(let i=1;i<=8;i++) {
  const file=path.join(directory,`case-studies/c0${i}.html`);
  const html=await fs.readFile(file,'utf8');
  if((html.match(/class="case-field"/g)||[]).length!==24)errors.push(`C0${i}: expected all 24 case-study fields`);
}
const report={result:errors.length?'fail':'pass',staticPages:pages.length,linksAndAssetsChecked:linkCount,missionIdentifiers:40,caseStudyCandidates:8,caseStudyFieldsPerTrack:24,errors,browserVerification:'unverified',productionVerification:'not established by static checks; see README for deployment status'};
await fs.writeFile(path.join(root,'docs/static-verification.json'),JSON.stringify(report,null,2)+'\n');
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`Static checks passed: ${pages.length} pages, ${linkCount} link/asset references, M01–M40, and all 24 fields in C01–C08.`);
