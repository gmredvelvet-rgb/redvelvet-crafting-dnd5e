import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const types={".html":"text/html",".js":"text/javascript",".mjs":"text/javascript",".json":"application/json",".css":"text/css",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".ogg":"audio/ogg"};
http.createServer((req,res)=>{
  let name=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const module = /^\/modules\/(redvelvet-crafting-(?:dnd5e|pf2e))\//.exec(name);
  const directory = module ? path.resolve(root,"..",module[1]) : root;
  if(module)name=name.slice(module[0].length);
  const file=path.resolve(directory,name.replace(/^\//,""));
  if(!file.startsWith(directory+path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()){res.writeHead(404);res.end();return;}
  res.setHeader("Content-Type",types[path.extname(file)]??"application/octet-stream");fs.createReadStream(file).pipe(res);
}).listen(8878,"127.0.0.1",()=>console.log("QA preview: http://127.0.0.1:8878/tools/preview.html"));
