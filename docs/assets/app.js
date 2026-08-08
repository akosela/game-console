(() => {
  const cfg = window.GAME_CONSOLE_DOCS;
  const docs = cfg.documents;
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  const escapeHtml = (v) => String(v)
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");

  const docUrl = (file) => `doc.html?file=${encodeURIComponent(file)}`;
  const rawUrl = (file) =>
    `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch}/${file}`;
  const githubUrl = (file="") => {
    const base = `https://github.com/${cfg.owner}/${cfg.repo}`;
    return file ? `${base}/blob/${cfg.branch}/${encodeURIComponent(file).replaceAll("%2F","/")}` : base;
  };
  const editUrl = (file) =>
    `https://github.com/${cfg.owner}/${cfg.repo}/edit/${cfg.branch}/${encodeURIComponent(file).replaceAll("%2F","/")}`;

  window.GameConsoleDocs = {escapeHtml,docUrl,rawUrl,githubUrl,editUrl};

  function getTheme() {
    const saved = localStorage.getItem("gcd-theme");
    if (saved === "light" || saved === "dark") return saved;
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("gcd-theme",theme);
    const b=$("#theme-toggle");
    if (b) {
      b.textContent = theme==="dark" ? "☀" : "◐";
      b.title = theme==="dark" ? "Switch to light mode" : "Switch to dark mode";
    }
  }
  setTheme(getTheme());

  function renderSidebar(activeFile="") {
    const side=$("#sidebar");
    if (!side) return;
    const groups=[...new Set(docs.map(d=>d.group))];
    let html=`<a class="sidebar-home ${activeFile ? "" : "active"}" href="index.html">Welcome</a>`;
    for (const group of groups) {
      const groupDocs=docs.filter(d=>d.group===group);
      const containsActive=groupDocs.some(d=>d.file===activeFile);
      html += `
        <div class="sidebar-group" data-group="${escapeHtml(group)}">
          <button class="sidebar-group-toggle" type="button" aria-expanded="true">
            <span class="sidebar-chevron">▼</span>
            <span>${escapeHtml(group)}</span>
          </button>
          <ul class="sidebar-list">
            ${groupDocs.map(d=>`
              <li>
                <a class="sidebar-link ${d.file===activeFile?"active":""}"
                   href="${docUrl(d.file)}">${escapeHtml(d.title)}</a>
              </li>`).join("")}
          </ul>
        </div>`;
    }
    side.innerHTML=html;
  }

  renderSidebar(new URLSearchParams(location.search).get("file") || "");

  document.addEventListener("click", (e) => {
    const group=e.target.closest(".sidebar-group-toggle");
    if (group) {
      const wrapper=group.closest(".sidebar-group");
      wrapper.classList.toggle("collapsed");
      group.setAttribute("aria-expanded", String(!wrapper.classList.contains("collapsed")));
    }
    if (e.target.closest("#theme-toggle")) {
      setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark");
    }
    if (e.target.closest("#mobile-menu")) $("#sidebar")?.classList.toggle("open");
    if (e.target.closest(".sidebar-link,.sidebar-home")) $("#sidebar")?.classList.remove("open");
  });

  $$("[data-repo-link]").forEach(a=>a.href=githubUrl());

  // Search
  const modal=$("#search-modal");
  const input=$("#search-input");
  const results=$("#search-results");
  let contentCache=null, timer=null, selected=-1;

  function openSearch() {
    modal?.classList.add("open");
    modal?.setAttribute("aria-hidden","false");
    setTimeout(()=>input?.focus(),0);
    if (input && !input.value) renderSearch("");
  }
  function closeSearch() {
    modal?.classList.remove("open");
    modal?.setAttribute("aria-hidden","true");
    selected=-1;
  }
  async function cacheDocs() {
    if (contentCache) return contentCache;
    contentCache=await Promise.all(docs.map(async d=>{
      try {
        const r=await fetch(rawUrl(d.file),{cache:"no-cache"});
        const t=r.ok ? await r.text() : "";
        return {...d,searchable:`${d.title} ${d.tags.join(" ")} ${t}`.toLowerCase()};
      } catch {
        return {...d,searchable:`${d.title} ${d.tags.join(" ")}`.toLowerCase()};
      }
    }));
    return contentCache;
  }
  async function renderSearch(q) {
    if (!results) return;
    const query=q.trim().toLowerCase();
    let matches=docs;
    if (query) {
      matches=docs.filter(d=>`${d.title} ${d.tags.join(" ")} ${d.file}`.toLowerCase().includes(query));
      if (query.length>=2) {
        results.innerHTML=`<div class="search-empty">Searching document contents…</div>`;
        const cache=await cacheDocs();
        matches=cache.filter(d=>d.searchable.includes(query));
      }
    }
    selected=-1;
    if (!matches.length) {
      results.innerHTML=`<div class="search-empty">No results.</div>`;
      return;
    }
    results.innerHTML=matches.slice(0,14).map(d=>`
      <a class="search-result" href="${docUrl(d.file)}">
        <strong>${escapeHtml(d.title)}</strong>
        <span>${escapeHtml(d.group)} · ${escapeHtml(d.file)}</span>
      </a>`).join("");
  }
  document.addEventListener("click",(e)=>{
    if(e.target.closest("#search-button")) openSearch();
    if(e.target===modal) closeSearch();
  });
  document.addEventListener("keydown",(e)=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openSearch();return;}
    if(e.key==="Escape"){closeSearch();return;}
    if(!modal?.classList.contains("open")) return;
    const items=$$(".search-result",results);
    if(e.key==="ArrowDown"){e.preventDefault();selected=Math.min(selected+1,items.length-1);}
    else if(e.key==="ArrowUp"){e.preventDefault();selected=Math.max(selected-1,0);}
    else if(e.key==="Enter"&&selected>=0){e.preventDefault();items[selected].click();return;}
    else return;
    items.forEach((x,i)=>x.classList.toggle("selected",i===selected));
    items[selected]?.scrollIntoView({block:"nearest"});
  });
  input?.addEventListener("input",()=>{
    clearTimeout(timer);
    timer=setTimeout(()=>renderSearch(input.value),110);
  });
})();
