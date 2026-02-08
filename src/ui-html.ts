export function getHtmlPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>logifai</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#1a1a2e;--bg2:#16213e;--bg3:#0f3460;
  --fg:#e0e0e0;--fg2:#9a9ab0;
  --red:#e05565;--yellow:#e0b050;--blue:#4fc3f7;--gray:#7a7a90;
  --red-bg:rgba(224,85,101,.12);--yellow-bg:rgba(224,176,80,.12);--blue-bg:rgba(79,195,247,.12);--gray-bg:rgba(122,122,144,.12);
  --border:#2a2a4a;--hover:#1e2a4a;
}
body{font-family:"SF Mono","Cascadia Code","Fira Code",Consolas,monospace;font-size:13px;background:var(--bg);color:var(--fg);height:100vh;display:flex;flex-direction:column;overflow:hidden}
a{color:var(--blue);text-decoration:none}

/* Header */
.header{display:flex;align-items:center;gap:12px;padding:10px 16px;background:var(--bg2);border-bottom:1px solid var(--border);flex-shrink:0}
.header h1{font-size:16px;font-weight:600;color:var(--blue)}
.header select{background:var(--bg);color:var(--fg);border:1px solid var(--border);border-radius:4px;padding:4px 8px;font-family:inherit;font-size:12px;min-width:260px;transition:border-color .2s}
.header select:focus-visible{outline:2px solid var(--blue);outline-offset:1px}
.header .live-badge{background:var(--red);color:#fff;font-size:10px;padding:2px 8px;border-radius:10px;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
.session-info{margin-left:auto;color:var(--fg2);font-size:11px}

/* Filter bar */
.filters{display:flex;align-items:center;gap:12px;padding:6px 16px;background:rgba(22,33,62,.6);border-bottom:1px solid var(--border);flex-shrink:0;flex-wrap:wrap}
.filters label{display:flex;align-items:center;gap:4px;cursor:pointer;font-size:12px;user-select:none}
.filters input[type=checkbox]{appearance:none;-webkit-appearance:none;width:14px;height:14px;border:1px solid var(--border);border-radius:3px;background:var(--bg);cursor:pointer;position:relative;transition:background .15s,border-color .15s;flex-shrink:0}
.filters input[type=checkbox]:checked{background:var(--blue);border-color:var(--blue)}
.filters input[type=checkbox]:checked::after{content:"";position:absolute;left:4px;top:1px;width:4px;height:8px;border:solid #000;border-width:0 2px 2px 0;transform:rotate(45deg)}
.filters input[type=checkbox]:focus-visible{outline:2px solid var(--blue);outline-offset:1px}
.level-error{color:var(--red)}.level-warn{color:var(--yellow)}.level-info{color:var(--blue)}.level-debug{color:var(--gray)}
.search-wrapper{position:relative;display:inline-flex;align-items:center}
.search-wrapper svg{position:absolute;left:8px;width:14px;height:14px;color:var(--fg2);pointer-events:none}
.search-box{background:var(--bg);color:var(--fg);border:1px solid var(--border);border-radius:4px;padding:4px 8px 4px 28px;font-family:inherit;font-size:12px;width:240px;transition:border-color .2s,box-shadow .2s}
.search-box::placeholder{color:var(--fg2)}
.search-box:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 2px rgba(79,195,247,.2)}
.follow-btn{background:var(--bg3);color:var(--fg);border:1px solid var(--border);border-radius:4px;padding:4px 12px;cursor:pointer;font-size:12px;font-family:inherit;transition:background .2s,border-color .2s,color .2s}
.follow-btn:hover{border-color:var(--blue)}
.follow-btn:focus-visible{outline:2px solid var(--blue);outline-offset:1px}
.follow-btn.active{background:var(--blue);color:#000;border-color:var(--blue)}
.follow-btn.active:hover{background:#6dd0f9}
.entry-count{color:var(--fg2);font-size:11px;margin-left:auto}

/* Log table */
.log-container{flex:1;overflow:auto}
table{width:100%;border-collapse:collapse}
thead{position:sticky;top:0;z-index:1}
th{background:var(--bg2);color:var(--fg2);padding:6px 12px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--border)}
td{padding:7px 12px;border-bottom:1px solid var(--border);vertical-align:top;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:0}
tr{transition:background .15s ease}
tr:nth-child(even){background:rgba(255,255,255,.015)}
tr:hover{background:var(--hover)}
tr.selected{background:var(--bg3)}
td.ts{width:110px;min-width:110px;color:var(--fg2);font-size:12px}
td.lvl{width:76px;min-width:76px;font-weight:700;font-size:12px;overflow:visible}
td.msg{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
td.src{width:120px;color:var(--fg2);font-size:12px}
.lvl-ERROR{color:var(--red)}.lvl-WARN{color:var(--yellow)}.lvl-INFO{color:var(--blue)}.lvl-DEBUG{color:var(--gray)}
.level-pill{display:inline-block;padding:1px 8px;border-radius:10px;font-size:11px;font-weight:700;letter-spacing:.3px}
.level-pill.lvl-ERROR{background:var(--red-bg);border:1px solid rgba(224,85,101,.3)}
.level-pill.lvl-WARN{background:var(--yellow-bg);border:1px solid rgba(224,176,80,.3)}
.level-pill.lvl-INFO{background:var(--blue-bg);border:1px solid rgba(79,195,247,.3)}
.level-pill.lvl-DEBUG{background:var(--gray-bg);border:1px solid rgba(122,122,144,.3)}

/* Detail panel */
.detail-panel{border-top:2px solid var(--border);background:var(--bg2);padding:12px 16px;max-height:40vh;overflow:auto;flex-shrink:0;display:none}
.detail-panel.open{display:block;animation:slideUp .25s ease}
@keyframes slideUp{from{max-height:0;padding-top:0;padding-bottom:0;opacity:0}to{max-height:40vh;padding-top:12px;padding-bottom:12px;opacity:1}}
.detail-panel h3{font-size:13px;margin-bottom:8px;color:var(--blue)}
.detail-section{margin-bottom:12px}
.detail-section h4{font-size:11px;color:var(--fg2);margin-bottom:4px;text-transform:uppercase}
.detail-section pre{background:var(--bg);padding:8px;border-radius:4px;overflow-x:auto;font-size:12px;line-height:1.5;white-space:pre-wrap;word-break:break-all}
.meta-grid{display:grid;grid-template-columns:max-content 1fr;gap:4px 16px;background:var(--bg);padding:10px 12px;border-radius:4px;font-size:12px;line-height:1.5}
.meta-grid dt{color:var(--fg2);font-weight:600;white-space:nowrap}
.meta-grid dd{color:var(--fg);word-break:break-all}
.detail-close{float:right;background:none;border:none;color:var(--fg2);cursor:pointer;font-size:16px;line-height:1;padding:4px 6px;border-radius:4px;transition:background .2s,color .2s}
.detail-close:hover{background:rgba(255,255,255,.1);color:var(--fg)}
.detail-close:focus-visible{outline:2px solid var(--blue);outline-offset:1px}

/* Load more */
.load-more{text-align:center;padding:12px}
.load-more button{background:var(--bg3);color:var(--fg);border:1px solid var(--border);border-radius:4px;padding:6px 24px;cursor:pointer;font-family:inherit;font-size:12px;transition:background .2s,border-color .2s,color .2s}
.load-more button:hover{background:var(--blue);color:#000;border-color:var(--blue)}
.load-more button:focus-visible{outline:2px solid var(--blue);outline-offset:1px}

/* Empty state */
.empty{display:flex;align-items:center;justify-content:center;height:100%;color:var(--fg2);font-size:14px}
</style>
</head>
<body>

<div class="header">
  <h1>logifai</h1>
  <select id="sessionSelect"><option value="">Loading sessions...</option></select>
  <span id="liveBadge" class="live-badge" style="display:none">LIVE</span>
  <span id="sessionInfo" class="session-info"></span>
</div>

<div class="filters">
  <label class="level-error"><input type="checkbox" data-level="ERROR" checked> ERROR</label>
  <label class="level-warn"><input type="checkbox" data-level="WARN" checked> WARN</label>
  <label class="level-info"><input type="checkbox" data-level="INFO" checked> INFO</label>
  <label class="level-debug"><input type="checkbox" data-level="DEBUG" checked> DEBUG</label>
  <div class="search-wrapper"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input type="text" class="search-box" id="searchBox" placeholder="Filter messages..."></div>
  <button class="follow-btn active" id="followBtn">Follow</button>
  <span class="entry-count" id="entryCount"></span>
</div>

<div class="log-container" id="logContainer">
  <table>
    <thead>
      <tr><th>Timestamp</th><th>Level</th><th>Message</th><th>Source</th></tr>
    </thead>
    <tbody id="logBody"></tbody>
  </table>
  <div class="load-more" id="loadMore" style="display:none">
    <button id="loadMoreBtn">Load more</button>
  </div>
</div>

<div class="detail-panel" id="detailPanel">
  <button class="detail-close" id="detailClose">&times;</button>
  <div id="detailContent"></div>
</div>

<script>
(function(){
  const PAGE_SIZE = 500;
  let allEntries = [];
  let filteredEntries = [];
  let displayedCount = 0;
  let currentSessionId = null;
  let liveSessionId = null;
  let eventSource = null;
  let following = true;
  let selectedRow = null;
  let totalOnServer = 0;
  let loadedOffset = 0;

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  const logBody = $("#logBody");
  const logContainer = $("#logContainer");
  const sessionSelect = $("#sessionSelect");
  const searchBox = $("#searchBox");
  const followBtn = $("#followBtn");
  const liveBadge = $("#liveBadge");
  const entryCount = $("#entryCount");
  const detailPanel = $("#detailPanel");
  const detailContent = $("#detailContent");
  const loadMore = $("#loadMore");
  const loadMoreBtn = $("#loadMoreBtn");
  const sessionInfo = $("#sessionInfo");

  // Fetch sessions
  async function fetchSessions() {
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      liveSessionId = data.liveSessionId || null;
      const sessions = data.sessions || [];
      sessionSelect.innerHTML = "";
      if (sessions.length === 0) {
        sessionSelect.innerHTML = '<option value="">No sessions found</option>';
        return;
      }
      sessions.forEach((s, i) => {
        const opt = document.createElement("option");
        opt.value = s.id;
        const d = new Date(s.startedAt);
        const label = d.toLocaleString() + " (" + s.id + ")" + (s.id === liveSessionId ? " [LIVE]" : "");
        opt.textContent = label;
        sessionSelect.appendChild(opt);
      });
      // Auto-select live session or first
      if (liveSessionId) {
        sessionSelect.value = liveSessionId;
      }
      loadSession(sessionSelect.value);
    } catch(e) {
      sessionSelect.innerHTML = '<option value="">Error loading sessions</option>';
    }
  }

  // Load a session's entries
  async function loadSession(id) {
    if (!id) return;
    currentSessionId = id;
    allEntries = [];
    filteredEntries = [];
    displayedCount = 0;
    loadedOffset = 0;
    logBody.innerHTML = "";
    closeDetail();

    const isLive = id === liveSessionId;
    liveBadge.style.display = isLive ? "inline" : "none";

    // Stop previous SSE
    if (eventSource) { eventSource.close(); eventSource = null; }

    // Fetch entries
    try {
      const res = await fetch("/api/sessions/" + encodeURIComponent(id) + "/entries?limit=" + PAGE_SIZE);
      const data = await res.json();
      totalOnServer = data.total || 0;
      loadedOffset = data.entries ? data.entries.length : 0;
      allEntries = data.entries || [];
      applyFilters();
      sessionInfo.textContent = totalOnServer + " total entries";

      if (totalOnServer > loadedOffset) {
        loadMore.style.display = "block";
      } else {
        loadMore.style.display = "none";
      }
    } catch(e) {
      logBody.innerHTML = '<tr><td colspan="4" style="color:var(--red);padding:20px">Error loading entries</td></tr>';
    }

    // Start SSE for live session
    if (isLive) {
      startSSE(id);
    }
  }

  // Load more entries (older ones)
  async function loadMoreEntries() {
    if (!currentSessionId) return;
    try {
      const res = await fetch("/api/sessions/" + encodeURIComponent(currentSessionId) + "/entries?offset=" + loadedOffset + "&limit=" + PAGE_SIZE);
      const data = await res.json();
      const newEntries = data.entries || [];
      loadedOffset += newEntries.length;
      allEntries = allEntries.concat(newEntries);
      applyFilters();

      if (loadedOffset >= totalOnServer) {
        loadMore.style.display = "none";
      }
    } catch(e) { /* ignore */ }
  }

  // SSE for live streaming
  function startSSE(id) {
    eventSource = new EventSource("/api/sessions/" + encodeURIComponent(id) + "/stream");
    eventSource.addEventListener("entry", function(e) {
      try {
        const entry = JSON.parse(e.data);
        allEntries.push(entry);
        totalOnServer++;
        sessionInfo.textContent = totalOnServer + " total entries";
        if (matchesFilter(entry)) {
          filteredEntries.push(entry);
          appendRow(entry, filteredEntries.length - 1);
          updateEntryCount();
          if (following) scrollToBottom();
        }
      } catch(err) { /* skip bad data */ }
    });
    eventSource.addEventListener("end", function() {
      liveBadge.style.display = "none";
      eventSource.close();
      eventSource = null;
    });
    eventSource.onerror = function() {
      // Connection lost, hide live badge
      liveBadge.style.display = "none";
    };
  }

  // Filtering
  function getActiveFilters() {
    const levels = [];
    $$(".filters input[data-level]").forEach(cb => { if(cb.checked) levels.push(cb.dataset.level); });
    const search = searchBox.value.trim().toLowerCase();
    return { levels, search };
  }

  function matchesFilter(entry) {
    const { levels, search } = getActiveFilters();
    if (!levels.includes(entry.level)) return false;
    if (search && !entry.message.toLowerCase().includes(search)) return false;
    return true;
  }

  function applyFilters() {
    filteredEntries = allEntries.filter(matchesFilter);
    renderTable();
  }

  // Render
  function renderTable() {
    logBody.innerHTML = "";
    displayedCount = 0;
    const count = Math.min(filteredEntries.length, PAGE_SIZE);
    for (let i = 0; i < count; i++) {
      appendRow(filteredEntries[i], i);
    }
    displayedCount = count;
    updateEntryCount();
    if (following) scrollToBottom();
  }

  function appendRow(entry, idx) {
    const tr = document.createElement("tr");
    tr.dataset.idx = idx;

    const tdTs = document.createElement("td");
    tdTs.className = "ts";
    tdTs.textContent = formatTimestamp(entry.timestamp);

    const tdLvl = document.createElement("td");
    tdLvl.className = "lvl";
    const lvlSpan = document.createElement("span");
    lvlSpan.className = "level-pill lvl-" + entry.level;
    lvlSpan.textContent = entry.level;
    tdLvl.appendChild(lvlSpan);

    const tdMsg = document.createElement("td");
    tdMsg.className = "msg";
    tdMsg.textContent = entry.message;
    tdMsg.title = entry.message;

    const tdSrc = document.createElement("td");
    tdSrc.className = "src";
    tdSrc.textContent = entry.source || "";

    tr.appendChild(tdTs);
    tr.appendChild(tdLvl);
    tr.appendChild(tdMsg);
    tr.appendChild(tdSrc);

    tr.addEventListener("click", () => showDetail(entry, tr));
    logBody.appendChild(tr);
    displayedCount++;
  }

  function formatTimestamp(ts) {
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleTimeString(undefined, {hour:"2-digit",minute:"2-digit",second:"2-digit",fractionalSecondDigits:3});
    } catch { return ts; }
  }

  function updateEntryCount() {
    entryCount.textContent = filteredEntries.length + " / " + allEntries.length + " entries";
  }

  function scrollToBottom() {
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  // Detail panel
  function showDetail(entry, tr) {
    if (selectedRow) selectedRow.classList.remove("selected");
    tr.classList.add("selected");
    selectedRow = tr;

    let html = "";
    html += '<div class="detail-section"><h4>Message</h4><pre>' + escapeHtml(entry.message) + '</pre></div>';
    html += '<div class="detail-section"><h4>Metadata</h4><dl class="meta-grid">';
    const metaFields = [
      ["Timestamp", escapeHtml(entry.timestamp)],
      ["Level", entry.level],
      ["Source", escapeHtml(entry.source || "")],
      ["Project", escapeHtml(entry.project || "")],
      ["Session", escapeHtml(entry.session_id || "")],
      ["Git Branch", escapeHtml(entry.git_branch || "N/A")],
      ["PID", String(entry.pid || "")],
      ["Raw", escapeHtml(entry.raw || "")]
    ];
    metaFields.forEach(function(f) {
      html += "<dt>" + f[0] + "</dt><dd>" + (f[1] || "") + "</dd>";
    });
    html += '</dl></div>';

    if (entry.stack) {
      html += '<div class="detail-section"><h4>Stack Trace</h4><pre style="color:var(--red)">' + escapeHtml(entry.stack) + '</pre></div>';
    }
    if (entry._original) {
      html += '<div class="detail-section"><h4>Original Data</h4><pre>' + escapeHtml(JSON.stringify(entry._original, null, 2)) + '</pre></div>';
    }

    detailContent.innerHTML = html;
    detailPanel.classList.add("open");
  }

  function closeDetail() {
    detailPanel.classList.remove("open");
    if (selectedRow) { selectedRow.classList.remove("selected"); selectedRow = null; }
  }

  function escapeHtml(s) {
    if (s == null || s === "") return "";
    if (typeof s !== "string") s = String(s);
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  // Events
  sessionSelect.addEventListener("change", () => loadSession(sessionSelect.value));

  $$(".filters input[data-level]").forEach(cb => cb.addEventListener("change", applyFilters));
  searchBox.addEventListener("input", applyFilters);

  followBtn.addEventListener("click", () => {
    following = !following;
    followBtn.classList.toggle("active", following);
    if (following) scrollToBottom();
  });

  logContainer.addEventListener("scroll", () => {
    const { scrollTop, scrollHeight, clientHeight } = logContainer;
    if (scrollHeight - scrollTop - clientHeight > 50) {
      following = false;
      followBtn.classList.remove("active");
    }
  });

  $("#detailClose").addEventListener("click", closeDetail);
  loadMoreBtn.addEventListener("click", loadMoreEntries);

  // Init
  fetchSessions();
})();
</script>
</body>
</html>`;
}
