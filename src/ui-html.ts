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
.session-info{color:var(--fg2);font-size:11px}
.header-right{margin-left:auto;display:flex;align-items:center;gap:10px}
.lang-select{background:var(--bg);color:var(--fg);border:1px solid var(--border);border-radius:4px;padding:3px 6px;font-family:inherit;font-size:11px;cursor:pointer;transition:border-color .2s}
.lang-select:focus-visible{outline:2px solid var(--blue);outline-offset:1px}
.lang-select:hover{border-color:var(--blue)}

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

/* Selection checkboxes */
th.sel,td.sel{width:30px;min-width:30px;text-align:center;padding-left:6px;padding-right:2px}
td.sel input[type=checkbox]{appearance:none;-webkit-appearance:none;width:14px;height:14px;border:1px solid var(--border);border-radius:3px;background:var(--bg);cursor:pointer;position:relative;transition:background .15s,border-color .15s;flex-shrink:0}
td.sel input[type=checkbox]:checked{background:var(--blue);border-color:var(--blue)}
td.sel input[type=checkbox]:checked::after{content:"";position:absolute;left:4px;top:1px;width:4px;height:8px;border:solid #000;border-width:0 2px 2px 0;transform:rotate(45deg)}
td.sel input[type=checkbox]:focus-visible{outline:2px solid var(--blue);outline-offset:1px}
tr.ref-selected{border-left:3px solid var(--blue)}
.copy-ref-btn{background:var(--bg3);color:var(--fg);border:1px solid var(--border);border-radius:4px;padding:4px 12px;cursor:pointer;font-size:12px;font-family:inherit;transition:background .2s,border-color .2s,color .2s}
.copy-ref-btn:hover:not(:disabled){border-color:var(--blue)}
.copy-ref-btn:focus-visible{outline:2px solid var(--blue);outline-offset:1px}
.copy-ref-btn:disabled{opacity:0.4;cursor:default;pointer-events:none}
.btn-tooltip-wrapper{display:inline-block;position:relative}
.btn-tooltip-wrapper::after{content:attr(data-tooltip);position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);background:#222;color:#e0e0e0;font-size:11px;padding:4px 8px;border-radius:4px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .15s;z-index:10}
.btn-tooltip-wrapper:hover::after{opacity:1}
.copy-ref-btn.copied{background:var(--blue);color:#000}

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
  <select id="sessionSelect"><option value="" data-i18n="status.loading">Loading sessions...</option></select>
  <span id="liveBadge" class="live-badge" style="display:none">LIVE</span>
  <div class="header-right">
    <span id="sessionInfo" class="session-info"></span>
    <select id="langSelect" class="lang-select">
      <option value="en">EN</option>
      <option value="ja">JA</option>
    </select>
  </div>
</div>

<div class="filters">
  <label class="level-error"><input type="checkbox" data-level="ERROR" checked> ERROR</label>
  <label class="level-warn"><input type="checkbox" data-level="WARN" checked> WARN</label>
  <label class="level-info"><input type="checkbox" data-level="INFO" checked> INFO</label>
  <label class="level-debug"><input type="checkbox" data-level="DEBUG" checked> DEBUG</label>
  <div class="search-wrapper"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input type="text" class="search-box" id="searchBox" data-i18n-placeholder="placeholder.filter" placeholder="Filter messages..."></div>
  <button class="follow-btn active" id="followBtn" data-i18n="btn.follow">Follow</button>
  <span class="btn-tooltip-wrapper" data-i18n-tooltip="tooltip.copyRef" data-tooltip="Copy logifai:// reference link for selected lines (Shift+click for range)"><button class="copy-ref-btn" id="copyRefBtn" disabled data-i18n="btn.copyRef">Copy Ref</button></span>
  <span class="btn-tooltip-wrapper" data-i18n-tooltip="tooltip.copyLog" data-tooltip="Copy log content of selected lines as text"><button class="copy-ref-btn" id="copyLogBtn" disabled data-i18n="btn.copyLog">Copy Log</button></span>
  <span class="entry-count" id="entryCount"></span>
</div>

<div class="log-container" id="logContainer">
  <table>
    <thead>
      <tr><th class="sel"></th><th data-i18n="th.timestamp">Timestamp</th><th data-i18n="th.level">Level</th><th data-i18n="th.message">Message</th><th data-i18n="th.source">Source</th></tr>
    </thead>
    <tbody id="logBody"></tbody>
  </table>
  <div class="load-more" id="loadMore" style="display:none">
    <button id="loadMoreBtn" data-i18n="btn.loadMore">Load more</button>
  </div>
</div>

<div class="detail-panel" id="detailPanel">
  <button class="detail-close" id="detailClose">&times;</button>
  <div id="detailContent"></div>
</div>

<script>
(function(){
  // --- i18n ---
  var I18N = {
    en: {
      "btn.follow": "Follow",
      "btn.copyRef": "Copy Ref",
      "btn.copyLog": "Copy Log",
      "btn.loadMore": "Load more",
      "btn.copied": "Copied!",
      "tooltip.copyRef": "Copy logifai:// reference link for selected lines (Shift+click for range)",
      "tooltip.copyLog": "Copy log content of selected lines as text",
      "placeholder.filter": "Filter messages...",
      "status.loading": "Loading sessions...",
      "status.noSessions": "No sessions found",
      "status.errorSessions": "Error loading sessions",
      "status.errorEntries": "Error loading entries",
      "info.totalEntries": "{count} total entries",
      "info.entries": "{filtered} / {total} entries",
      "info.live": "[LIVE]",
      "th.timestamp": "Timestamp",
      "th.level": "Level",
      "th.message": "Message",
      "th.source": "Source",
      "detail.message": "Message",
      "detail.metadata": "Metadata",
      "detail.timestamp": "Timestamp",
      "detail.level": "Level",
      "detail.source": "Source",
      "detail.project": "Project",
      "detail.session": "Session",
      "detail.gitBranch": "Git Branch",
      "detail.pid": "PID",
      "detail.raw": "Raw",
      "detail.stackTrace": "Stack Trace",
      "detail.originalData": "Original Data"
    },
    ja: {
      "btn.follow": "\\u30D5\\u30A9\\u30ED\\u30FC",
      "btn.copyRef": "\\u53C2\\u7167\\u30B3\\u30D4\\u30FC",
      "btn.copyLog": "\\u30ED\\u30B0\\u30B3\\u30D4\\u30FC",
      "btn.loadMore": "\\u3082\\u3063\\u3068\\u8AAD\\u307F\\u8FBC\\u3080",
      "btn.copied": "\\u30B3\\u30D4\\u30FC\\u5B8C\\u4E86!",
      "tooltip.copyRef": "\\u9078\\u629E\\u884C\\u306E logifai:// \\u53C2\\u7167\\u30EA\\u30F3\\u30AF\\u3092\\u30B3\\u30D4\\u30FC (Shift+\\u30AF\\u30EA\\u30C3\\u30AF\\u3067\\u7BC4\\u56F2\\u9078\\u629E)",
      "tooltip.copyLog": "\\u9078\\u629E\\u884C\\u306E\\u30ED\\u30B0\\u5185\\u5BB9\\u3092\\u30C6\\u30AD\\u30B9\\u30C8\\u3068\\u3057\\u3066\\u30B3\\u30D4\\u30FC",
      "placeholder.filter": "\\u30E1\\u30C3\\u30BB\\u30FC\\u30B8\\u3092\\u691C\\u7D22...",
      "status.loading": "\\u30BB\\u30C3\\u30B7\\u30E7\\u30F3\\u8AAD\\u307F\\u8FBC\\u307F\\u4E2D...",
      "status.noSessions": "\\u30BB\\u30C3\\u30B7\\u30E7\\u30F3\\u304C\\u898B\\u3064\\u304B\\u308A\\u307E\\u305B\\u3093",
      "status.errorSessions": "\\u30BB\\u30C3\\u30B7\\u30E7\\u30F3\\u8AAD\\u307F\\u8FBC\\u307F\\u30A8\\u30E9\\u30FC",
      "status.errorEntries": "\\u30A8\\u30F3\\u30C8\\u30EA\\u8AAD\\u307F\\u8FBC\\u307F\\u30A8\\u30E9\\u30FC",
      "info.totalEntries": "{count} \\u4EF6\\u306E\\u30A8\\u30F3\\u30C8\\u30EA",
      "info.entries": "{filtered} / {total} \\u4EF6",
      "info.live": "[LIVE]",
      "th.timestamp": "\\u30BF\\u30A4\\u30E0\\u30B9\\u30BF\\u30F3\\u30D7",
      "th.level": "\\u30EC\\u30D9\\u30EB",
      "th.message": "\\u30E1\\u30C3\\u30BB\\u30FC\\u30B8",
      "th.source": "\\u30BD\\u30FC\\u30B9",
      "detail.message": "\\u30E1\\u30C3\\u30BB\\u30FC\\u30B8",
      "detail.metadata": "\\u30E1\\u30BF\\u30C7\\u30FC\\u30BF",
      "detail.timestamp": "\\u30BF\\u30A4\\u30E0\\u30B9\\u30BF\\u30F3\\u30D7",
      "detail.level": "\\u30EC\\u30D9\\u30EB",
      "detail.source": "\\u30BD\\u30FC\\u30B9",
      "detail.project": "\\u30D7\\u30ED\\u30B8\\u30A7\\u30AF\\u30C8",
      "detail.session": "\\u30BB\\u30C3\\u30B7\\u30E7\\u30F3",
      "detail.gitBranch": "Git \\u30D6\\u30E9\\u30F3\\u30C1",
      "detail.pid": "PID",
      "detail.raw": "\\u751F\\u30C7\\u30FC\\u30BF",
      "detail.stackTrace": "\\u30B9\\u30BF\\u30C3\\u30AF\\u30C8\\u30EC\\u30FC\\u30B9",
      "detail.originalData": "\\u5143\\u30C7\\u30FC\\u30BF"
    }
  };
  var currentLang = "en";

  function t(key) {
    return (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || key;
  }

  function tReplace(key, replacements) {
    var s = t(key);
    for (var k in replacements) {
      s = s.replace("{" + k + "}", String(replacements[k]));
    }
    return s;
  }

  function applyI18n() {
    document.querySelectorAll("[data-i18n]").forEach(function(el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function(el) {
      el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
    });
    document.querySelectorAll("[data-i18n-tooltip]").forEach(function(el) {
      el.setAttribute("data-tooltip", t(el.getAttribute("data-i18n-tooltip")));
    });
    updateEntryCount();
    if (totalOnServer > 0) {
      sessionInfo.textContent = tReplace("info.totalEntries", { count: totalOnServer });
    }
  }

  // --- App state ---
  var PAGE_SIZE = 500;
  var allEntries = [];
  var filteredEntries = [];
  var displayedCount = 0;
  var currentSessionId = null;
  var liveSessionId = null;
  var eventSource = null;
  var following = true;
  var selectedRow = null;
  var totalOnServer = 0;
  var loadedOffset = 0;
  var selectedLines = new Set();
  var lastCheckedLine = null;

  var sel = function(s) { return document.querySelector(s); };
  var selAll = function(s) { return document.querySelectorAll(s); };

  var logBody = sel("#logBody");
  var logContainer = sel("#logContainer");
  var sessionSelect = sel("#sessionSelect");
  var searchBox = sel("#searchBox");
  var followBtn = sel("#followBtn");
  var liveBadge = sel("#liveBadge");
  var entryCount = sel("#entryCount");
  var detailPanel = sel("#detailPanel");
  var detailContent = sel("#detailContent");
  var loadMore = sel("#loadMore");
  var loadMoreBtn = sel("#loadMoreBtn");
  var sessionInfo = sel("#sessionInfo");
  var copyRefBtn = sel("#copyRefBtn");
  var copyLogBtn = sel("#copyLogBtn");
  var langSelect = sel("#langSelect");

  // Fetch sessions
  async function fetchSessions() {
    try {
      var res = await fetch("/api/sessions");
      var data = await res.json();
      liveSessionId = data.liveSessionId || null;
      var sessions = data.sessions || [];
      sessionSelect.innerHTML = "";
      if (sessions.length === 0) {
        sessionSelect.innerHTML = '<option value="">' + t("status.noSessions") + '</option>';
        return;
      }
      sessions.forEach(function(s) {
        var opt = document.createElement("option");
        opt.value = s.id;
        var d = new Date(s.startedAt);
        var label = d.toLocaleString() + " (" + s.id + ")" + (s.id === liveSessionId ? " " + t("info.live") : "");
        opt.textContent = label;
        sessionSelect.appendChild(opt);
      });
      // Auto-select live session or first
      if (liveSessionId) {
        sessionSelect.value = liveSessionId;
      }
      loadSession(sessionSelect.value);
    } catch(e) {
      sessionSelect.innerHTML = '<option value="">' + t("status.errorSessions") + '</option>';
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
    clearSelection();

    var isLive = id === liveSessionId;
    liveBadge.style.display = isLive ? "inline" : "none";

    // Stop previous SSE
    if (eventSource) { eventSource.close(); eventSource = null; }

    // Fetch entries
    try {
      var res = await fetch("/api/sessions/" + encodeURIComponent(id) + "/entries?limit=" + PAGE_SIZE);
      var data = await res.json();
      totalOnServer = data.total || 0;
      loadedOffset = data.entries ? data.entries.length : 0;
      allEntries = data.entries || [];
      applyFilters();
      sessionInfo.textContent = tReplace("info.totalEntries", { count: totalOnServer });

      if (totalOnServer > loadedOffset) {
        loadMore.style.display = "block";
      } else {
        loadMore.style.display = "none";
      }
    } catch(e) {
      logBody.innerHTML = '<tr><td colspan="5" style="color:var(--red);padding:20px">' + t("status.errorEntries") + '</td></tr>';
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
      var res = await fetch("/api/sessions/" + encodeURIComponent(currentSessionId) + "/entries?offset=" + loadedOffset + "&limit=" + PAGE_SIZE);
      var data = await res.json();
      var newEntries = data.entries || [];
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
        var entry = JSON.parse(e.data);
        allEntries.push(entry);
        totalOnServer++;
        sessionInfo.textContent = tReplace("info.totalEntries", { count: totalOnServer });
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
    var levels = [];
    selAll(".filters input[data-level]").forEach(function(cb) { if(cb.checked) levels.push(cb.dataset.level); });
    var search = searchBox.value.trim().toLowerCase();
    return { levels: levels, search: search };
  }

  function matchesFilter(entry) {
    var f = getActiveFilters();
    if (!f.levels.includes(entry.level)) return false;
    if (f.search && !entry.message.toLowerCase().includes(f.search)) return false;
    return true;
  }

  function applyFilters() {
    filteredEntries = allEntries.filter(matchesFilter);
    clearSelection();
    renderTable();
  }

  // Render
  function renderTable() {
    logBody.innerHTML = "";
    displayedCount = 0;
    var count = Math.min(filteredEntries.length, PAGE_SIZE);
    for (var i = 0; i < count; i++) {
      appendRow(filteredEntries[i], i);
    }
    displayedCount = count;
    updateEntryCount();
    if (following) scrollToBottom();
  }

  function appendRow(entry, idx) {
    var tr = document.createElement("tr");
    tr.dataset.idx = idx;
    var lineNum = entry._line || 0;
    tr.dataset.line = lineNum;

    var tdSel = document.createElement("td");
    tdSel.className = "sel";
    var cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = selectedLines.has(lineNum);
    if (cb.checked) tr.classList.add("ref-selected");
    cb.addEventListener("click", function(e) {
      e.stopPropagation();
      handleCheckboxChange(e, lineNum, tr);
    });
    tdSel.appendChild(cb);

    var tdTs = document.createElement("td");
    tdTs.className = "ts";
    tdTs.textContent = formatTimestamp(entry.timestamp);

    var tdLvl = document.createElement("td");
    tdLvl.className = "lvl";
    var lvlSpan = document.createElement("span");
    lvlSpan.className = "level-pill lvl-" + entry.level;
    lvlSpan.textContent = entry.level;
    tdLvl.appendChild(lvlSpan);

    var tdMsg = document.createElement("td");
    tdMsg.className = "msg";
    tdMsg.textContent = entry.message;
    tdMsg.title = entry.message;

    var tdSrc = document.createElement("td");
    tdSrc.className = "src";
    tdSrc.textContent = entry.source || "";

    tr.appendChild(tdSel);
    tr.appendChild(tdTs);
    tr.appendChild(tdLvl);
    tr.appendChild(tdMsg);
    tr.appendChild(tdSrc);

    tr.addEventListener("click", function() { showDetail(entry, tr); });
    logBody.appendChild(tr);
    displayedCount++;
  }

  function formatTimestamp(ts) {
    try {
      var d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleTimeString(undefined, {hour:"2-digit",minute:"2-digit",second:"2-digit",fractionalSecondDigits:3});
    } catch(e) { return ts; }
  }

  function updateEntryCount() {
    entryCount.textContent = tReplace("info.entries", { filtered: filteredEntries.length, total: allEntries.length });
  }

  function scrollToBottom() {
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  // Detail panel
  function showDetail(entry, tr) {
    if (selectedRow) selectedRow.classList.remove("selected");
    tr.classList.add("selected");
    selectedRow = tr;

    var html = "";
    html += '<div class="detail-section"><h4>' + t("detail.message") + '</h4><pre>' + escapeHtml(entry.message) + '</pre></div>';
    html += '<div class="detail-section"><h4>' + t("detail.metadata") + '</h4><dl class="meta-grid">';
    var metaFields = [
      [t("detail.timestamp"), escapeHtml(entry.timestamp)],
      [t("detail.level"), entry.level],
      [t("detail.source"), escapeHtml(entry.source || "")],
      [t("detail.project"), escapeHtml(entry.project || "")],
      [t("detail.session"), escapeHtml(entry.session_id || "")],
      [t("detail.gitBranch"), escapeHtml(entry.git_branch || "N/A")],
      [t("detail.pid"), String(entry.pid || "")],
      [t("detail.raw"), escapeHtml(entry.raw || "")]
    ];
    metaFields.forEach(function(f) {
      html += "<dt>" + f[0] + "</dt><dd>" + (f[1] || "") + "</dd>";
    });
    html += '</dl></div>';

    if (entry.stack) {
      html += '<div class="detail-section"><h4>' + t("detail.stackTrace") + '</h4><pre style="color:var(--red)">' + escapeHtml(entry.stack) + '</pre></div>';
    }
    if (entry._original) {
      html += '<div class="detail-section"><h4>' + t("detail.originalData") + '</h4><pre>' + escapeHtml(JSON.stringify(entry._original, null, 2)) + '</pre></div>';
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

  // Selection & Copy Ref
  function clearSelection() {
    selectedLines = new Set();
    lastCheckedLine = null;
    updateCopyRefBtn();
    logBody.querySelectorAll("tr.ref-selected").forEach(function(r) { r.classList.remove("ref-selected"); });
    logBody.querySelectorAll("td.sel input[type=checkbox]").forEach(function(cb) { cb.checked = false; });
  }

  function updateCopyRefBtn() {
    var disabled = selectedLines.size === 0;
    copyRefBtn.disabled = disabled;
    copyRefBtn.classList.remove("copied");
    copyRefBtn.textContent = t("btn.copyRef");
    copyLogBtn.disabled = disabled;
    copyLogBtn.classList.remove("copied");
    copyLogBtn.textContent = t("btn.copyLog");
  }

  function handleCheckboxChange(e, lineNum, tr) {
    if (e.target.checked) {
      if (e.shiftKey && lastCheckedLine !== null) {
        var rows = Array.from(logBody.querySelectorAll("tr[data-line]"));
        var lo = Math.min(lastCheckedLine, lineNum);
        var hi = Math.max(lastCheckedLine, lineNum);
        rows.forEach(function(row) {
          var ln = parseInt(row.dataset.line, 10);
          if (ln >= lo && ln <= hi) {
            selectedLines.add(ln);
            row.classList.add("ref-selected");
            var cb = row.querySelector("td.sel input[type=checkbox]");
            if (cb) cb.checked = true;
          }
        });
      } else {
        selectedLines.add(lineNum);
        tr.classList.add("ref-selected");
      }
    } else {
      selectedLines.delete(lineNum);
      tr.classList.remove("ref-selected");
    }
    lastCheckedLine = lineNum;
    updateCopyRefBtn();
  }

  function compressLines(lines) {
    var sorted = Array.from(lines).sort(function(a,b){ return a - b; });
    if (sorted.length === 0) return "";
    var parts = [];
    var start = sorted[0], end = sorted[0];
    for (var i = 1; i < sorted.length; i++) {
      if (sorted[i] === end + 1) {
        end = sorted[i];
      } else {
        parts.push(start === end ? String(start) : start + "-" + end);
        start = sorted[i]; end = sorted[i];
      }
    }
    parts.push(start === end ? String(start) : start + "-" + end);
    return parts.join(",");
  }

  function copyRef() {
    if (!currentSessionId || selectedLines.size === 0) return;
    var spec = compressLines(selectedLines);
    var ref = "logifai://" + currentSessionId + ":" + spec;
    navigator.clipboard.writeText(ref).then(function() {
      copyRefBtn.textContent = t("btn.copied");
      copyRefBtn.classList.add("copied");
      setTimeout(function() {
        copyRefBtn.textContent = t("btn.copyRef");
        copyRefBtn.classList.remove("copied");
      }, 1500);
    }).catch(function() {
      var tmp = document.createElement("input");
      tmp.value = ref;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand("copy");
      document.body.removeChild(tmp);
      copyRefBtn.textContent = t("btn.copied");
      copyRefBtn.classList.add("copied");
      setTimeout(function() {
        copyRefBtn.textContent = t("btn.copyRef");
        copyRefBtn.classList.remove("copied");
      }, 1500);
    });
  }

  function copyLog() {
    if (selectedLines.size === 0) return;
    var lines = allEntries
      .filter(function(e) { return selectedLines.has(e._line); })
      .map(function(e) { return e.raw || e.message; });
    var text = lines.join("\\n");
    navigator.clipboard.writeText(text).then(function() {
      copyLogBtn.textContent = t("btn.copied");
      copyLogBtn.classList.add("copied");
      setTimeout(function() {
        copyLogBtn.textContent = t("btn.copyLog");
        copyLogBtn.classList.remove("copied");
      }, 1500);
    }).catch(function() {
      var tmp = document.createElement("textarea");
      tmp.value = text;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand("copy");
      document.body.removeChild(tmp);
      copyLogBtn.textContent = t("btn.copied");
      copyLogBtn.classList.add("copied");
      setTimeout(function() {
        copyLogBtn.textContent = t("btn.copyLog");
        copyLogBtn.classList.remove("copied");
      }, 1500);
    });
  }

  // Settings load/save
  async function loadSettingsAndApply() {
    try {
      var res = await fetch("/api/settings");
      var settings = await res.json();
      if (settings.language && I18N[settings.language]) {
        currentLang = settings.language;
        langSelect.value = currentLang;
      }
    } catch(e) { /* use default */ }
    applyI18n();
  }

  langSelect.addEventListener("change", async function() {
    currentLang = langSelect.value;
    applyI18n();
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: currentLang })
      });
    } catch(e) { /* ignore save error */ }
  });

  // Events
  sessionSelect.addEventListener("change", function() { loadSession(sessionSelect.value); });

  selAll(".filters input[data-level]").forEach(function(cb) { cb.addEventListener("change", applyFilters); });
  searchBox.addEventListener("input", applyFilters);

  followBtn.addEventListener("click", function() {
    following = !following;
    followBtn.classList.toggle("active", following);
    if (following) scrollToBottom();
  });

  logContainer.addEventListener("scroll", function() {
    var st = logContainer.scrollTop, sh = logContainer.scrollHeight, ch = logContainer.clientHeight;
    if (sh - st - ch > 50) {
      following = false;
      followBtn.classList.remove("active");
    }
  });

  sel("#detailClose").addEventListener("click", closeDetail);
  loadMoreBtn.addEventListener("click", loadMoreEntries);
  copyRefBtn.addEventListener("click", copyRef);
  copyLogBtn.addEventListener("click", copyLog);

  // Init
  loadSettingsAndApply().then(function() { fetchSessions(); });
})();
</script>
</body>
</html>`;
}
