import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
process.env.PORT='8766';
const {server}=await import('./serve.mjs');
if(!server.listening)await once(server,'listening');
async function walk(directory){
  const entries=await fs.readdir(directory,{withFileTypes:true});
  return (await Promise.all(entries.map(entry=>entry.isDirectory()?walk(path.join(directory,entry.name)):[path.join(directory,entry.name)]))).flat();
}
function request(file){return new Promise(resolve=>{
  const req=http.get({hostname:'127.0.0.1',port:8766,path:'/'+file},response=>{
    let bytes=0;response.on('data',chunk=>bytes+=chunk.length);
    response.on('end',()=>resolve({file,status:response.statusCode,bytes,csp:Boolean(response.headers['content-security-policy']),contentType:response.headers['content-type']}));
  });
  req.setTimeout(4000,()=>req.destroy(new Error('Local HTTP test timed out')));
  req.on('error',error=>resolve({file,error:error.code||error.message}));
});}
try{
  const pages=JSON.parse(await fs.readFile(path.join(root,'docs/build-manifest.json'),'utf8')).pages;
  const assets=(await walk(path.join(root,'public/assets'))).map(file=>path.relative(path.join(root,'public'),file));
  const targets=[...pages,...assets,'robots.txt'];
  const results=[];
  for(let i=0;i<targets.length;i+=8)results.push(...await Promise.all(targets.slice(i,i+8).map(request)));
  const errors=results.filter(result=>result.status!==200||!result.bytes||!result.csp);
  const report={result:errors.length?'fail':'pass',staticPagesChecked:pages.length,assetFilesChecked:assets.length,totalResponses:results.length,non200OrEmptyResponses:errors,headersPresentOnAllResponses:results.every(r=>r.csp),browserRendering:'unverified',production:'not deployed'};
  await fs.writeFile(path.join(root,'docs/http-verification.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
  if(errors.length)process.exitCode=1;
}finally{await new Promise(resolve=>server.close(resolve));}
