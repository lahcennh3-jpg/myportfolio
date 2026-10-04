import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createCatalog} from '../src/catalog.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=JSON.parse(await fs.readFile(path.join(root,'data/portfolio.json'),'utf8'));
const sourceBytes=await fs.readFile(path.join(root,data.source.sourceFile));
const source=sourceBytes.toString('utf8');
const catalog=createCatalog(data,source);
const errors=[];
const expect=(condition,message)=>{if(!condition)errors.push(message);};
const digest=value=>createHash('sha256').update(value).digest('hex');
const sequence=(prefix,count,width)=>Array.from({length:count},(_,i)=>prefix+String(i+1).padStart(width,'0'));
const readPage=file=>fs.readFile(path.join(root,'public',file),'utf8');
const expectedSourceHash='f00c7011f31f2d0d31e05569907bf42e25f3bec59e9b4359e2eba5a36b28d224';
expect(digest(sourceBytes)===expectedSourceHash,'The supplied catalog bytes changed.');
expect(data.source.sha256===expectedSourceHash,'Catalog provenance hash differs from the supplied source.');
expect(data.source.onyxRevision==='e7240a64ed06fff6f665fdde2bd90c4a3052d004','Mission baseline was repinned.');
expect(data.source.catalogAvailable && data.source.catalogRevision==='2026-09-30-final','Catalog revision is not established.');
expect(digest(await fs.readFile(path.join(root,'public/assets/content/onyx-security-catalog.md')))===expectedSourceHash,'Published source differs from the supplied catalog.');

const sourceCards=[...catalog.sections.find(s=>s.id===4).body.matchAll(/^### (M\d{2}) — ([^\n]+)\n([\s\S]*?)(?=\n### |(?![\s\S]))/gm)];
expect(sourceCards.length===40,'Expected all 40 mission cards in the source.');
expect(JSON.stringify(data.missions.map(m=>m.id))===JSON.stringify(sequence('M',40,2)),'Mission IDs or ordering changed.');
let missionFields=0;
for(const card of sourceCards){
  const mission=data.missions.find(m=>m.id===card[1]);
  if(!mission){errors.push(`${card[1]} is absent from imported data.`);continue;}
  const fields=Object.fromEntries([...card[3].matchAll(/^- \*\*([A-P])[^*]*\*\*\s*(.+)$/gm)].map(m=>[m[1],m[2].trim()]));
  const html=await readPage(`missions/${mission.id.toLowerCase()}.html`);
  expect(mission.title===card[2],`${mission.id}: title differs from the catalog.`);
  expect(Object.keys(fields).length===16 && Object.keys(mission.fields).length===16,`${mission.id}: A–P coverage is incomplete.`);
  for(const [letter,copy] of Object.entries(fields)){
    missionFields++;
    expect(mission.fields[letter]===copy,`${mission.id}.${letter}: source text changed.`);
    expect(html.includes(catalog.inline(copy,'../')),`${mission.id}.${letter}: complete field did not reach its page.`);
  }
  expect(mission.classification==='PLAN' && mission.runtimeStatus==='NOT RUN' && mission.assessmentStatus==='NOT ASSESSED',`${mission.id}: evidence was promoted without a recorded result.`);
  expect(Object.keys(mission.route).length===6 && Object.keys(mission.ledger).length===5,`${mission.id}: transfer route or ledger is incomplete.`);
  for(const copy of [...Object.values(mission.route),...Object.values(mission.ledger)])expect(html.includes(catalog.inline(copy,'../')),`${mission.id}: route or ledger text was omitted.`);
  for(const ref of mission.sourceRefs)expect(Boolean(data.catalog.references[ref]),`${mission.id}: unresolved primary-source reference ${ref}.`);
}

expect(JSON.stringify(data.tracks.map(t=>t.id))===JSON.stringify(sequence('C',8,2)),'C01–C08 allocation is incomplete.');
const expectedAllocations={C01:['M01','M02','M06','M10'],C02:['M03','M08','M09','M17','M28'],C03:['M11','M12','M13','M14','M15','M27','M34'],C04:['M04','M18','M19','M21','M29','M35'],C05:['M23','M24','M25','M26','M27','M30'],C06:['M31','M32','M33'],C07:['M05','M07','M16','M28','M36','M39'],C08:['M22','M30','M35','M36','M40']};
for(const track of data.tracks){
  expect(JSON.stringify(track.missions)===JSON.stringify(expectedAllocations[track.id]),`${track.id}: requested mission allocation changed.`);
  expect(track.classification==='PLAN' && track.status==='Case Study Candidate',`${track.id}: candidate status changed.`);
  const html=await readPage(`case-studies/${track.id.toLowerCase()}.html`);
  expect((html.match(/class="case-field"/g)||[]).length===24,`${track.id}: expected 24 case-study fields.`);
  expect(html.includes('Mission experiments: NOT RUN.') && html.includes('Independent assessment: NOT ASSESSED.'),`${track.id}: pending evidence gates were omitted.`);
}

expect(data.ecosystem.length===143,'Expected 141 original inputs plus two additional component owners.');
expect(JSON.stringify(data.ecosystem.filter(p=>p.inputNumber).map(p=>p.id))===JSON.stringify(sequence('P',141,3)),'Original ecosystem input coverage changed.');
expect(JSON.stringify(data.ecosystem.filter(p=>!p.inputNumber).map(p=>p.id))===JSON.stringify(['E001','E002']),'Additional owners were mixed into the original input count.');
expect(new Set(data.ecosystem.map(p=>p.canonicalName.toLowerCase())).size===143,'Canonical ecosystem identity is duplicated.');
const redirects={P012:'snyk/agent-scan',P026:'data-privacy-stack/presidio',P041:'safetensors/safetensors',P067:'meta-pytorch/opacus',P086:'theagentrouter/agent-router',P097:'treeverse/dvc',P130:'LibreChat-AI/LibreChat'};
for(const [id,name] of Object.entries(redirects))expect(data.ecosystem.find(p=>p.id===id)?.canonicalName===name,`${id}: canonical redirect was lost.`);
const depths=Object.fromEntries(['D','W','R'].map(key=>[key,data.ecosystem.filter(p=>p.inputNumber && p.depth===key).length]));
expect(JSON.stringify(depths)===JSON.stringify({D:20,W:39,R:82}),'Planned study depths changed.');
for(const project of data.ecosystem){
  const html=await readPage(`ecosystem/${project.slug}.html`);
  expect(html.includes(project.sourceSha) && /^[a-f0-9]{40}$/.test(project.sourceSha),`${project.id}: immutable source pin is absent.`);
  expect(project.policyStatus==='NOT REVIEWED' && html.includes('NOT REVIEWED'),`${project.id}: policy contents are incorrectly represented as reviewed.`);
  expect(project.runtimeStatus==='NOT RUN' && project.classification==='PLAN',`${project.id}: proposed use was promoted to runtime evidence.`);
}
expect(data.ecosystem.find(p=>p.id==='P001')?.sourceSha==='e4eb5ffb2a617763a6244db01b4b6380fe6a453f','Separate Onyx ecosystem snapshot was lost.');
expect(data.ecosystem.find(p=>p.id==='P092')?.archived===true,'LocalStack archive status was lost.');

const labHashes={L01:'6342681f97007c8cd2f6303fcf6a579a72ceb7332128bab8fc999e1621703b5b',L02:'2dea00793e1d368b9cd8c3e6035efa2681cd9c948508b39122d0d9ef152fc238',L03:'f8099f471fce8013854ad9d78267ada5d71fed5155ea0294d8acbe1c485ea155',L04:'dc7e7b0c249bd3608730de3736d4a26061917c4d529d90dd39a1c267f8fa19ca'};
expect(data.supportingLabs.length===4,'Supporting execution record count changed.');
for(const lab of data.supportingLabs){
  const html=await readPage(`supporting-labs/${lab.id.toLowerCase()}.html`);
  expect(digest(lab.script)===labHashes[lab.id] && lab.scriptSha256===labHashes[lab.id],`${lab.id}: exact recorded recipe source changed.`);
  expect(lab.classification==='RUN' && lab.recordedBy==='Supplied catalog artifact verification',`${lab.id}: recorded execution attribution changed.`);
  expect(lab.executionSurface===(lab.id==='L04'?'ADDED_REAL_TINY_MODEL':'ADDED_FIXTURE'),`${lab.id}: execution scope changed.`);
  expect(source.includes(lab.script.trimEnd()),`${lab.id}: recipe is absent from the original source.`);
  expect(html.includes(catalog.esc(lab.script)) && html.includes(catalog.esc(JSON.stringify(lab.recordedOutput,null,2))),`${lab.id}: source or captured output was omitted.`);
  expect(html.includes('It is not a fresh execution by this website.'),`${lab.id}: execution attribution is unclear.`);
}

expect(catalog.sections.length===20,'Full catalog section coverage is incomplete.');
for(const section of catalog.sections){
  const html=await readPage(`catalog/section-${String(section.id).padStart(2,'0')}.html`);
  expect(html.includes(catalog.markdown(section.body,'../')),`Catalog §${section.id}: source body was omitted from its page.`);
}
expect(!catalog.inline('[unsafe](javascript:alert(1))').includes('href='),'Catalog text introduced an unsafe link.');
expect(!catalog.markdown('<script>throw new Error("untrusted")</script>').includes('<script>'),'Raw source markup became executable HTML.');
const report={result:errors.length?'fail':'pass',catalogSha256:expectedSourceHash,missionRecords:40,sourceFieldsVerified:missionFields,transferRoutes:40,caseStudyCandidates:8,caseStudyFieldsPerTrack:24,originalEcosystemInputs:141,additionalComponentOwners:2,plannedStudyDepths:depths,recordedRecipeHashesVerified:4,catalogSections:20,recipeExecution:'not rerun; recorded source and output preservation checked',learnerAndNativeEvidence:'not upgraded',errors};
await fs.writeFile(path.join(root,'docs/content-verification.json'),JSON.stringify(report,null,2)+'\n');
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`Content checks passed: ${missionFields} exact mission fields, 40 transfer routes, 8 allocations, 143 ecosystem records, 4 recipe hashes, and all 20 source sections.`);
