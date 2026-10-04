import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const directory=path.join(root,'public');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8','.svg':'image/svg+xml'};
const configuration=JSON.parse(await fs.readFile(path.join(root,'vercel.json'),'utf8'));
const commonHeaders=Object.fromEntries(configuration.headers[0].headers.map(({key,value})=>[key,value]));
const port=Number(process.env.PORT || 8765);
export const server=http.createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=path.resolve(directory,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(directory+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
    const content=await fs.readFile(file);
    res.writeHead(200,{...commonHeaders,'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(req.method==='HEAD'?undefined:content);
  } catch(error) {res.writeHead(error.code==='ENOENT'?404:400);res.end('Page not found');}
}).listen(port,'0.0.0.0',()=>console.log(`Portfolio preview: http://localhost:${port}`));
