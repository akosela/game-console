(() => {
  const cfg=window.GAME_CONSOLE_DOCS;
  const api=window.GameConsoleDocs;
  const esc=api.escapeHtml;
  const params=new URLSearchParams(location.search);
  const file=params.get("file");
  const meta=cfg.documents.find(d=>d.file===file);
  const title=document.querySelector("#doc-title");
  const metaLine=document.querySelector("#doc-meta");
  const article=document.querySelector("#article");
  const toc=document.querySelector("#toc-links");
  const actions=document.querySelector("#doc-actions");
  const bottom=document.querySelector("#doc-bottom");

  if(!meta){
    document.title=`Not found · ${cfg.siteTitle}`;
    title.textContent="Document not found";
    metaLine.textContent="";
    article.innerHTML=`<div class="error-card">The requested file is not in the documentation index.</div>`;
    return;
  }

  document.title=`${meta.title} | ${cfg.siteTitle}`;
  title.textContent=meta.title;
  metaLine.innerHTML=`Source: <code>${esc(meta.file)}</code>`;
  actions.innerHTML=`
    <a href="${api.rawUrl(file)}" target="_blank" rel="noopener">Raw TXT ↗</a>
    <a href="${api.githubUrl(file)}" target="_blank" rel="noopener">View source ↗</a>`;

  const isSep=(line,ch)=>line.length>=18 && [...line].every(c=>c===ch);
  const slugify=(v)=>{
    const s=v.toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
    return s||"section";
  };
  const linkify=(v)=>esc(v).replace(
    /(https?:\/\/[^\s<]+)/g,
    u=>`<a href="${u}" target="_blank" rel="noopener">${u}</a>`
  );
  const normalize=(lines)=>lines.map(x=>x.trim()).join(" ").replace(/\s+/g," ").trim();

  function looksCommand(line){
    const s=line.trim();
    if(!s||s.length>100||/^https?:\/\//i.test(s)) return false;
    if(/[.!?]$/.test(s) && !/[<>]|=|->|\b(toggle|set|give|bind|show|player|r_|gl_)\b/i.test(s)) return false;
    return /[<>=]/.test(s) || /\b(true|false|on|off)\b/i.test(s) ||
      /^[+~-]?[A-Za-z_][\w.+:-]*(\s+.+)?$/.test(s);
  }

  function renderBlock(block){
    const lines=block.filter((x,i,a)=>!(i===0&&!x)&&!(i===a.length-1&&!x));
    if(!lines.length) return "";
    if (/^\s*[-*]\s+/.test(lines[0])) {
      const items = [];
      let current = [];

      for (const line of lines) {
        if (/^\s*[-*]\s+/.test(line)) {
          if (current.length) {
            items.push(current.join(" "));
          }

          current = [
            line.replace(/^\s*[-*]\s+/, "").trim()
          ];
        } else if (current.length) {
          current.push(line.trim());
        }
      }

      if (current.length) {
        items.push(current.join(" "));
      }

      return `<ul>${items.map(item =>
        `<li>${linkify(item)}</li>`
      ).join("")}</ul>`;
    }
 
    if(lines.every(l=>/^\s{2,}\S/.test(l))){
      const code=lines.map(l=>l.replace(/^\s{2}/,"")).join("\n");
      return `<pre class="code-block"><code>${esc(code)}</code></pre>`;
    }
    const first=lines[0], rest=lines.slice(1);
    if(looksCommand(first) && rest.length && rest.every(l=>!l || /^\s{2,}/.test(l))){
      const desc=normalize(rest);
      return `<div class="command-card">
        <div class="command-line">${esc(first.trim())}
          <button class="copy-button" data-copy="${esc(first.trim())}">Copy</button>
        </div>
        ${desc?`<div class="command-description">${linkify(desc)}</div>`:""}
      </div>`;
    }
    const p=normalize(lines);
    if(!p) return "";
    return `<p${/^(NOTE|IMPORTANT|WARNING):/i.test(p)?' class="note"':""}>${linkify(p)}</p>`;
  }

  function renderBlocks(lines){
    const blocks=[]; let cur=[];
    for(const line of lines){
      if(!line.trim()){if(cur.length){blocks.push(cur);cur=[];}}
      else cur.push(line);
    }
    if(cur.length) blocks.push(cur);
    return blocks.map(renderBlock).join("");
  }

  function parse(text){
    const lines=text.replace(/\r\n?/g,"\n").split("\n");
    let first=lines.findIndex(l=>l.trim());
    let sourceTitle=meta.title, start=0;
    if(first>=0){
      sourceTitle=lines[first].trim();
      start=first+1;
      if(isSep(lines[start]||"","=")) start++;
    }

    const sections=[]; let secTitle="Overview", secLines=[], ids={};
    const push=()=>{
      if(!secLines.some(l=>l.trim())) return;
      let id=slugify(secTitle);
      ids[id]=(ids[id]||0)+1;
      if(ids[id]>1) id+=`-${ids[id]}`;
      sections.push({title:secTitle,id,lines:secLines});
      secLines=[];
    };
    let i=start;
    while(i<lines.length){
      if(isSep(lines[i],"=")&&i+2<lines.length&&lines[i+1].trim()&&isSep(lines[i+2],"=")){
        push(); secTitle=lines[i+1].trim(); i+=3; continue;
      }
      if(lines[i].trim()&&i+1<lines.length&&isSep(lines[i+1],"-")&&lines[i].trim().length<92){
        push(); secTitle=lines[i].trim(); i+=2; continue;
      }
      if(isSep(lines[i],"=")||isSep(lines[i],"-")){i++;continue;}
      secLines.push(lines[i]);i++;
    }
    push();
    return {sourceTitle,sections};
  }

  function renderToc(sections){
    toc.innerHTML=sections.filter(s=>s.title!=="Overview").map(
      s=>`<a href="#${s.id}">${esc(s.title)}</a>`
    ).join("");
  }
  function observeToc(){
    const links=[...document.querySelectorAll("#toc-links a")];
    const map=new Map(links.map(a=>[a.hash.slice(1),a]));
    if(!links.length) return;
    const obs=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting)
        .sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);
      if(!visible.length) return;
      links.forEach(a=>a.classList.remove("active"));
      map.get(visible[0].target.id)?.classList.add("active");
    },{rootMargin:"-80px 0px -72% 0px",threshold:[0,1]});
    document.querySelectorAll(".article section[id]").forEach(s=>obs.observe(s));
  }

  function renderBottom(){
    const i=cfg.documents.findIndex(d=>d.file===file);
    const prev=i>0?cfg.documents[i-1]:null;
    const next=i<cfg.documents.length-1?cfg.documents[i+1]:null;
    bottom.innerHTML=`
      <div class="edit-row">
        <a href="${api.editUrl(file)}" target="_blank" rel="noopener">Edit this page ↗</a>
      </div>
      <nav class="pagination-nav">
        ${prev?`<a class="pagination-link prev" href="${api.docUrl(prev.file)}">
          <span class="pagination-sublabel">← Previous</span>
          <span class="pagination-title">${esc(prev.title)}</span>
        </a>`:`<div></div>`}
        ${next?`<a class="pagination-link next" href="${api.docUrl(next.file)}">
          <span class="pagination-sublabel">Next →</span>
          <span class="pagination-title">${esc(next.title)}</span>
        </a>`:""}
      </nav>`;
  }

  async function load(){
    try{
      const r=await fetch(api.rawUrl(file),{cache:"no-cache"});
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      const parsed=parse(await r.text());
      title.textContent=parsed.sourceTitle;
      article.innerHTML=parsed.sections.map(s=>`
        <section id="${s.id}">
          ${s.title==="Overview"?"":`<h2>${esc(s.title)}<a class="anchor-link" href="#${s.id}" aria-label="Link to section">#</a></h2>`}
          ${renderBlocks(s.lines)}
        </section>`).join("");
      renderToc(parsed.sections);
      renderBottom();
      observeToc();
    }catch(err){
      article.innerHTML=`<div class="error-card">
        <strong>Could not load this document.</strong>
        <p>You can still open <a href="${api.githubUrl(file)}" target="_blank" rel="noopener">the source on GitHub</a>.</p>
        <code>${esc(String(err))}</code>
      </div>`;
    }
  }

  document.addEventListener("click",async e=>{
    const b=e.target.closest("[data-copy]");
    if(!b) return;
    try{
      await navigator.clipboard.writeText(b.dataset.copy);
      b.textContent="Copied";
      setTimeout(()=>b.textContent="Copy",900);
    }catch{b.textContent="Failed";}
  });

  load();
})();
