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
  const isHeadingSep=(line,ch)=>line.length>=3 && [...line].every(c=>c===ch);
  const slugify=(v)=>{
    const s=v.toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
    return s||"section";
  };
  const linkify=(v)=>esc(v).replace(
    /(https?:\/\/[^\s<]+)/g,
    u=>`<a href="${u}" target="_blank" rel="noopener">${u}</a>`
  );
  // Render Markdown-style inline code in prose. Text enclosed in a matching
  // pair of backticks is escaped and wrapped in <code>; ordinary text keeps
  // the existing URL auto-linking behavior. An unmatched backtick remains
  // literal text instead of consuming the rest of the paragraph.
  const renderInline=(v)=>{
    const parts=v.split("`");
    if(parts.length<3) return linkify(v);
    let html="";
    for(let i=0;i<parts.length;i++){
      const paired=i%2===1 && i+1<parts.length;
      if(paired) html+=`<code>${esc(parts[i])}</code>`;
      else if(i===parts.length-1 && i%2===1) html+=linkify("`"+parts[i]);
      else html+=linkify(parts[i]);
    }
    return html;
  };
  const normalize=(lines)=>lines.map(x=>x.trim()).join(" ").replace(/\s+/g," ").trim();
  function renderCommandDescription(lines){
    let html="";
    let prose=[];
    let code=[];

    const flushProse=()=>{
      const text=normalize(prose);
      if(text) html+=`<div class="command-description-text">${renderInline(text)}</div>`;
      prose=[];
    };
    const flushCode=()=>{
      if(!code.length) return;
      const text=code.map(line=>line.replace(/^\s{4}/,"").trimEnd()).join("\n");
      html+=`<pre class="code-block command-example"><code>${esc(text)}</code></pre>`;
      code=[];
    };

    for(const line of lines){
      if(/^\s{4,}\S/.test(line)){
        flushProse();
        code.push(line);
        continue;
      }
      flushCode();
      prose.push(line);
    }
    flushProse();
    flushCode();

    return html;
  }
  function looksCommand(line){
    const s=line.trim();
    if(!s||s.length>100||/^https?:\/\//i.test(s)) return false;
    if(/[.!?]$/.test(s) && !/[<>]|=|->|\b(toggle|set|give|bind|show|player|r_|gl_)\b/i.test(s)) return false;
    return /[<>=]/.test(s) || /\b(true|false|on|off)\b/i.test(s) ||
      /^[+~-]?[A-Za-z_][\w.+:-]*(\s+.+)?$/.test(s);
  }
  function renderBlock(block, forceCode = false) {
    const lines = block.filter((x, i, a) =>
      !(i === 0 && !x) &&
      !(i === a.length - 1 && !x)
    );
    if (!lines.length) return "";

    // Bare object/archetype groups under "--- ..." subsections render as
    // one code block. Pure summon_obj example groups use the same treatment.
    // Ordinary "- item" lines remain normal lists.
    const summonObjGroup = lines.every(line =>
      /^summon_obj(?:\s|$)/i.test(line.trim())
    );
    if (forceCode || summonObjGroup) {
      const code = lines.map(line => line.trimEnd()).join("\n");
      return `<pre class="code-block"><code>${esc(code)}</code></pre>`;
    }

    const bulletRe = /^\s*[-*]\s+/;
    const firstBullet = lines.findIndex(line => bulletRe.test(line));
    /*
     * A block may contain:
     *
     *   introductory paragraph
     *     - first item
     *     - second item
     *
     * because the TXT files do not necessarily contain a blank line
     * between the paragraph and the list.
     */
    if (firstBullet !== -1) {
      let html = "";
      if (firstBullet > 0) {
        const intro = normalize(lines.slice(0, firstBullet));

        if (intro) {
          html += `<p>${renderInline(intro)}</p>`;
        }
      }
      const items = [];
      let current = [];
      let i = firstBullet;

      for (; i < lines.length; i++) {
        const line = lines[i];

        if (bulletRe.test(line)) {
          if (current.length) {
            items.push(current.join(" "));
          }
          current = [
            line.replace(bulletRe, "").trim()
          ];

          continue;
        }

        if (current.length && /^\s+/.test(line)) {
          current.push(line.trim());
          continue;
        }
        break;
      }

      if (current.length) {
        items.push(current.join(" "));
      }

      html += `<ul>${items.map(item =>
        `<li>${renderInline(item)}</li>`
      ).join("")}</ul>`;
      if (i < lines.length) {
        html += renderBlock(lines.slice(i));
      }

      return html;
    }

    if (lines.every(line => /^\s{2,}\S/.test(line))) {
      const code = lines
        .map(line => line.replace(/^\s{2}/, ""))
        .join("\n");
      return `<pre class="code-block"><code>${esc(code)}</code></pre>`;
    }
    // Several column-0 command names may share one indented description:
    //
    //   trace_add
    //   trace_remove
    //     Adds/removes ...
    //
    // Render the command-name run as one code block and keep the indented
    // text as its explanation. Do not apply this to ordinary prose blocks.
    let descStart = lines.findIndex(line => /^\s{2,}\S/.test(line));
    if (descStart > 1) {
      const commands = lines.slice(0, descStart);
      const description = lines.slice(descStart);
      const commandGroup = commands.every(line =>
        !/^\s/.test(line) && looksCommand(line)
      );
      const descriptionGroup = description.every(line =>
        !line || /^\s{2,}/.test(line)
      );
      if (commandGroup && descriptionGroup) {
        const code = commands.map(line => line.trim()).join("\n");
        const descHtml = renderCommandDescription(description);

        const codeHtml = esc(code).replace(/\n/g, "<br>");

        return `<div class="command-card">
          <div class="command-line">${codeHtml}</div>
          ${descHtml
            ? `<div class="command-description">${descHtml}</div>`
            : ""}
        </div>`;
      }
    }
    const first = lines[0];
    const rest = lines.slice(1);
    if (
      looksCommand(first) &&
      rest.length &&
      rest.every(line => !line || /^\s{2,}/.test(line))
    ) {
      const descHtml = renderCommandDescription(rest);
      return `<div class="command-card">
        <div class="command-line">${esc(first.trim())}
          <button class="copy-button"
                  data-copy="${esc(first.trim())}">Copy</button>
        </div>
        ${descHtml
          ? `<div class="command-description">${descHtml}</div>`
          : ""}
      </div>`;
    }
    const p = normalize(lines);

    if (!p) return "";
    if (/^(NOTE|IMPORTANT|WARNING|CONFIG FILES):/i.test(p)) {
      const noteHtml = lines
        .map(line => renderInline(line.trim()))
        .join("<br>");
      return `<p class="note">${noteHtml}</p>`;
    }
    return `<p>${renderInline(p)}</p>`;
  }

  function renderBlocks(lines, sectionTitle){
    const blocks=[]; let cur=[];
    for(const line of lines){
      if(!line.trim()){if(cur.length){blocks.push(cur);cur=[];}}
      else cur.push(line);
    }
    if(cur.length) blocks.push(cur);
    // A subsection title beginning with "--- " marks its first content
    // block as a literal object/archetype list. Keep the TXT entries bare.
    const codeSection = /^---\s+/.test(sectionTitle);
    return blocks.map((block, index) =>
      renderBlock(block, codeSection && index === 0)
    ).join("");
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
    const push=(allowEmpty=false)=>{
      if(!allowEmpty && !secLines.some(l=>l.trim())) return;
      let id=slugify(secTitle);
      ids[id]=(ids[id]||0)+1;
      if(ids[id]>1) id+=`-${ids[id]}`;
      sections.push({title:secTitle,id,lines:secLines});
      secLines=[];
    };
    const startsMajorSection=(index)=>
      index+2<lines.length &&
      isSep(lines[index],"=") &&
      lines[index+1].trim() &&
      isSep(lines[index+2],"=");
    let i=start;
    while(i<lines.length){
      if(startsMajorSection(i)){
        push(); secTitle=lines[i+1].trim(); i+=3; continue;
      }

      // Every "--- <title>" line starts a code subsection immediately.
      // An underline after it is optional and purely decorative.
      if(/^---\s+/.test(lines[i].trim())){
        push(); secTitle=lines[i].trim(); i++;
        if(i<lines.length && isHeadingSep(lines[i],"-")) i++;
        continue;
      }

      if(
        lines[i].trim() &&
        i+1<lines.length &&
        !startsMajorSection(i+1) &&
        (isHeadingSep(lines[i+1],"=") || isHeadingSep(lines[i+1],"-")) &&
        lines[i].trim().length<92
      ){
        // Preserve a major ==== section even when a ---- subsection follows
        // immediately before any body text. Without this, push() sees an
        // empty body and the major section title is silently discarded.
        const majorSectionAwaitingBody =
          !secLines.some(l=>l.trim()) && /^\d+\.\s+/.test(secTitle);
        push(majorSectionAwaitingBody);
        secTitle=lines[i].trim(); i+=2; continue;
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
          ${renderBlocks(s.lines, s.title)}
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
