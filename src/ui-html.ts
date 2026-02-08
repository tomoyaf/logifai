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
  --row-height:30px;
  --grid-cols:30px 110px 76px 1fr 120px;
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

/* Log grid layout */
.log-container{flex:1;display:flex;flex-direction:column;overflow:hidden;position:relative}
.log-header{display:grid;grid-template-columns:var(--grid-cols);background:var(--bg2);border-bottom:1px solid var(--border);flex-shrink:0}
.log-header>div{padding:6px 12px;color:var(--fg2);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
.log-header>.col-sel{padding:6px;text-align:center}
.log-scroll{flex:1;overflow-y:auto;position:relative;overflow-anchor:none}
.log-row{display:grid;grid-template-columns:var(--grid-cols);height:var(--row-height);align-items:center;border-bottom:1px solid var(--border);cursor:pointer;transition:background .15s ease}
.log-row:nth-child(even){background:rgba(255,255,255,.015)}
.log-row:hover{background:var(--hover)}
.log-row.selected{background:var(--bg3)}
.log-row.ref-selected{border-left:3px solid var(--blue)}
.log-row>div{padding:0 12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.log-row>.col-sel{padding:0 6px;text-align:center;overflow:visible}
.log-row>.col-ts{color:var(--fg2);font-size:12px}
.log-row>.col-lvl{font-weight:700;font-size:12px;overflow:visible}
.log-row>.col-msg{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.log-row>.col-src{color:var(--fg2);font-size:12px}
.lvl-ERROR{color:var(--red)}.lvl-WARN{color:var(--yellow)}.lvl-INFO{color:var(--blue)}.lvl-DEBUG{color:var(--gray)}
.level-pill{display:inline-block;padding:1px 8px;border-radius:10px;font-size:11px;font-weight:700;letter-spacing:.3px}
.level-pill.lvl-ERROR{background:var(--red-bg);border:1px solid rgba(224,85,101,.3)}
.level-pill.lvl-WARN{background:var(--yellow-bg);border:1px solid rgba(224,176,80,.3)}
.level-pill.lvl-INFO{background:var(--blue-bg);border:1px solid rgba(79,195,247,.3)}
.level-pill.lvl-DEBUG{background:var(--gray-bg);border:1px solid rgba(122,122,144,.3)}

/* Selection checkboxes */
.col-sel input[type=checkbox]{appearance:none;-webkit-appearance:none;width:14px;height:14px;border:1px solid var(--border);border-radius:3px;background:var(--bg);cursor:pointer;position:relative;transition:background .15s,border-color .15s;flex-shrink:0}
.col-sel input[type=checkbox]:checked{background:var(--blue);border-color:var(--blue)}
.col-sel input[type=checkbox]:checked::after{content:"";position:absolute;left:4px;top:1px;width:4px;height:8px;border:solid #000;border-width:0 2px 2px 0;transform:rotate(45deg)}
.col-sel input[type=checkbox]:focus-visible{outline:2px solid var(--blue);outline-offset:1px}

.copy-ref-btn{background:var(--bg3);color:var(--fg);border:1px solid var(--border);border-radius:4px;padding:4px 12px;cursor:pointer;font-size:12px;font-family:inherit;transition:background .2s,border-color .2s,color .2s}
.copy-ref-btn:hover:not(:disabled){border-color:var(--blue)}
.copy-ref-btn:focus-visible{outline:2px solid var(--blue);outline-offset:1px}
.copy-ref-btn:disabled{opacity:0.4;cursor:default;pointer-events:none}
.btn-tooltip-wrapper{display:inline-block;position:relative}
.btn-tooltip-wrapper::after{content:attr(data-tooltip);position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);background:#222;color:#e0e0e0;font-size:11px;padding:4px 8px;border-radius:4px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .15s;z-index:10}
.btn-tooltip-wrapper:hover::after{opacity:1}
.copy-ref-btn.copied{background:var(--blue);color:#000}
.delete-btn{background:var(--bg3);color:var(--fg);border:1px solid var(--border);border-radius:4px;padding:4px 12px;cursor:pointer;font-size:12px;font-family:inherit;transition:background .2s,border-color .2s,color .2s}
.delete-btn:hover:not(:disabled){border-color:var(--red);color:var(--red)}
.delete-btn:focus-visible{outline:2px solid var(--red);outline-offset:1px}
.delete-btn:disabled{opacity:0.4;cursor:default;pointer-events:none}

/* Detail panel */
.detail-panel{border-top:2px solid var(--border);background:var(--bg2);padding:12px 16px;max-height:40vh;overflow:auto;flex-shrink:0;display:none;position:relative}
.detail-panel.open{display:block;animation:slideUp .25s ease}
.detail-panel.open.no-animate{animation:none}
@keyframes slideUp{from{max-height:0;padding-top:0;padding-bottom:0;opacity:0}to{max-height:40vh;padding-top:12px;padding-bottom:12px;opacity:1}}
.detail-resize-handle{position:absolute;top:-3px;left:0;right:0;height:6px;cursor:ns-resize;z-index:5;background:transparent;transition:background .15s}
.detail-resize-handle:hover,.detail-resize-handle.dragging{background:var(--blue)}
.no-select{user-select:none;-webkit-user-select:none}
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

/* New entries badge */
#newEntriesBadge{position:absolute;bottom:12px;left:0;right:0;text-align:center;z-index:10;pointer-events:none}
#newEntriesBadgeBtn{pointer-events:auto;background:var(--blue);color:#000;border:none;border-radius:20px;padding:6px 16px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,.3);transition:background .2s}
#newEntriesBadgeBtn:hover{background:#6dd0f9}

/* Empty state */
.empty{display:flex;align-items:center;justify-content:center;height:100%;color:var(--fg2);font-size:14px}

/* Settings dialog */
.settings-btn{background:var(--bg3);color:var(--fg);border:1px solid var(--border);border-radius:4px;padding:3px 10px;cursor:pointer;font-size:12px;font-family:inherit;transition:background .2s,border-color .2s}
.settings-btn:hover{border-color:var(--blue)}
.settings-btn:focus-visible{outline:2px solid var(--blue);outline-offset:1px}
.settings-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:100;display:none;align-items:center;justify-content:center}
.settings-overlay.open{display:flex}
.settings-dialog{background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;min-width:360px;max-width:440px}
.settings-dialog h2{font-size:15px;color:var(--blue);margin-bottom:16px}
.settings-dialog h3{font-size:13px;color:var(--fg2);margin:12px 0 8px;text-transform:uppercase;letter-spacing:.5px}
.settings-group{display:flex;flex-direction:column;gap:8px;margin-bottom:12px}
.settings-row{display:flex;align-items:center;justify-content:space-between;gap:12px}
.settings-row label{font-size:12px;color:var(--fg)}
.settings-row input[type=number]{background:var(--bg);color:var(--fg);border:1px solid var(--border);border-radius:4px;padding:4px 8px;font-family:inherit;font-size:12px;width:100px;text-align:right}
.settings-row input[type=number]:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 2px rgba(79,195,247,.2)}
.settings-row input[type=checkbox]{appearance:none;-webkit-appearance:none;width:14px;height:14px;border:1px solid var(--border);border-radius:3px;background:var(--bg);cursor:pointer;position:relative;transition:background .15s,border-color .15s}
.settings-row input[type=checkbox]:checked{background:var(--blue);border-color:var(--blue)}
.settings-row input[type=checkbox]:checked::after{content:"";position:absolute;left:4px;top:1px;width:4px;height:8px;border:solid #000;border-width:0 2px 2px 0;transform:rotate(45deg)}
.settings-actions{display:flex;gap:8px;margin-top:16px;justify-content:flex-end}
.settings-actions button{padding:6px 16px;border-radius:4px;font-family:inherit;font-size:12px;cursor:pointer;border:1px solid var(--border);transition:background .2s,border-color .2s}
.settings-actions .btn-primary{background:var(--blue);color:#000;border-color:var(--blue)}
.settings-actions .btn-primary:hover{background:#6dd0f9}
.settings-actions .btn-cleanup{background:var(--bg3);color:var(--fg)}
.settings-actions .btn-cleanup:hover{border-color:var(--yellow);color:var(--yellow)}
.settings-actions .btn-close{background:var(--bg);color:var(--fg)}
.settings-actions .btn-close:hover{border-color:var(--fg2)}
.cleanup-status{font-size:11px;color:var(--fg2);margin-top:8px;min-height:16px}
</style>
</head>
<body>

<div class="header">
  <h1>logifai</h1>
  <select id="sessionSelect"><option value="" data-i18n="status.loading">Loading sessions...</option></select>
  <button class="delete-btn" id="deleteBtn" data-i18n="btn.delete" disabled>Delete</button>
  <span id="liveBadge" class="live-badge" style="display:none">LIVE</span>
  <div class="header-right">
    <span id="sessionInfo" class="session-info"></span>
    <select id="langSelect" class="lang-select">
      <option value="en">EN</option>
      <option value="ja">JA</option>
    </select>
    <button class="settings-btn" id="settingsBtn" data-i18n="btn.settings">Settings</button>
  </div>
</div>

<div class="settings-overlay" id="settingsOverlay">
  <div class="settings-dialog">
    <h2 data-i18n="settings.retention">Retention Settings</h2>
    <div class="settings-group">
      <div class="settings-row">
        <label data-i18n="settings.maxSize">Max total size (MB)</label>
        <input type="number" id="retMaxSize" min="1" value="1024">
      </div>
      <div class="settings-row">
        <label data-i18n="settings.retentionDays">Retention days</label>
        <input type="number" id="retDays" min="1" value="30">
      </div>
      <div class="settings-row">
        <label data-i18n="settings.autoCleanup">Auto cleanup</label>
        <input type="checkbox" id="retAutoCleanup" checked>
      </div>
    </div>
    <div class="cleanup-status" id="cleanupStatus"></div>
    <div class="settings-actions">
      <button class="btn-cleanup" id="cleanupNowBtn" data-i18n="btn.cleanupNow">Cleanup Now</button>
      <button class="btn-primary" id="retSaveBtn" data-i18n="btn.save">Save</button>
      <button class="btn-close" id="retCloseBtn" data-i18n="btn.close">Close</button>
    </div>
  </div>
</div>

<div class="filters">
  <label class="level-error"><input type="checkbox" data-level="ERROR" checked> ERROR</label>
  <label class="level-warn"><input type="checkbox" data-level="WARN" checked> WARN</label>
  <label class="level-info"><input type="checkbox" data-level="INFO" checked> INFO</label>
  <label class="level-debug"><input type="checkbox" data-level="DEBUG" checked> DEBUG</label>
  <div class="search-wrapper"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input type="text" class="search-box" id="searchBox" data-i18n-placeholder="placeholder.filter" placeholder="Filter messages..."></div>
  <span class="btn-tooltip-wrapper" data-i18n-tooltip="tooltip.autoScroll" data-tooltip="Auto-scroll to latest log entries as they arrive"><button class="follow-btn active" id="followBtn" data-i18n="btn.follow">Auto Scroll</button></span>
  <span class="btn-tooltip-wrapper" data-i18n-tooltip="tooltip.copyRef" data-tooltip="Copy logifai:// reference link for selected lines (Shift+click for range)"><button class="copy-ref-btn" id="copyRefBtn" disabled data-i18n="btn.copyRef">Copy Ref</button></span>
  <span class="btn-tooltip-wrapper" data-i18n-tooltip="tooltip.copyLog" data-tooltip="Copy log content of selected lines as text"><button class="copy-ref-btn" id="copyLogBtn" disabled data-i18n="btn.copyLog">Copy Log</button></span>
  <span class="entry-count" id="entryCount"></span>
</div>

<div class="log-container" id="logContainer">
  <div class="log-header">
    <div class="col-sel"></div>
    <div data-i18n="th.timestamp">Timestamp</div>
    <div data-i18n="th.level">Level</div>
    <div data-i18n="th.message">Message</div>
    <div data-i18n="th.source">Source</div>
  </div>
  <div class="log-scroll" id="logScroll">
    <div id="spacerTop"></div>
    <div id="logBody"></div>
    <div id="spacerBottom"></div>
  </div>
  <div id="newEntriesBadge" style="display:none;">
    <button id="newEntriesBadgeBtn">\u2193 <span id="newEntriesText"></span></button>
  </div>
</div>

<div class="detail-panel" id="detailPanel">
  <div class="detail-resize-handle" id="detailResizeHandle"></div>
  <button class="detail-close" id="detailClose">&times;</button>
  <div id="detailContent"></div>
</div>

<script>
(function(){
  // --- i18n ---
  var I18N = {
    en: {
      "btn.follow": "Auto Scroll",
      "btn.delete": "Delete",
      "btn.copyRef": "Copy Ref",
      "btn.copyLog": "Copy Log",
      "btn.copied": "Copied!",
      "confirm.delete": "Delete this session?",
      "status.deleted": "Session deleted",
      "tooltip.autoScroll": "Auto-scroll to latest log entries as they arrive",
      "tooltip.copyRef": "Copy logifai:// reference link for selected lines (Shift+click for range)",
      "tooltip.copyLog": "Copy log content of selected lines as text",
      "placeholder.filter": "Filter messages...",
      "status.loading": "Loading sessions...",
      "status.noSessions": "No sessions found",
      "status.errorSessions": "Error loading sessions",
      "status.errorEntries": "Error loading entries",
      "info.totalEntries": "{count} total entries \u00b7 {size}",
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
      "detail.gitCommit": "Git Commit",
      "detail.pid": "PID",
      "detail.raw": "Raw",
      "detail.stackTrace": "Stack Trace",
      "detail.originalData": "Original Data",
      "settings.retention": "Retention Settings",
      "settings.maxSize": "Max total size (MB)",
      "settings.retentionDays": "Retention days",
      "settings.autoCleanup": "Auto cleanup",
      "btn.settings": "Settings",
      "btn.cleanupNow": "Cleanup Now",
      "btn.save": "Save",
      "btn.close": "Close",
      "cleanup.result": "Deleted {count} session(s), freed {size}",
      "cleanup.none": "No sessions to clean up"
    },
    ja: {
      "btn.follow": "\\u81EA\\u52D5\\u30B9\\u30AF\\u30ED\\u30FC\\u30EB",
      "btn.delete": "\\u524A\\u9664",
      "btn.copyRef": "\\u53C2\\u7167\\u30B3\\u30D4\\u30FC",
      "btn.copyLog": "\\u30ED\\u30B0\\u30B3\\u30D4\\u30FC",
      "btn.copied": "\\u30B3\\u30D4\\u30FC\\u5B8C\\u4E86!",
      "confirm.delete": "\\u3053\\u306E\\u30BB\\u30C3\\u30B7\\u30E7\\u30F3\\u3092\\u524A\\u9664\\u3057\\u307E\\u3059\\u304B\\uFF1F",
      "status.deleted": "\\u30BB\\u30C3\\u30B7\\u30E7\\u30F3\\u524A\\u9664\\u5B8C\\u4E86",
      "tooltip.autoScroll": "\\u65B0\\u3057\\u3044\\u30ED\\u30B0\\u304C\\u8FFD\\u52A0\\u3055\\u308C\\u308B\\u3068\\u81EA\\u52D5\\u7684\\u306B\\u6700\\u4E0B\\u90E8\\u306B\\u30B9\\u30AF\\u30ED\\u30FC\\u30EB\\u3057\\u307E\\u3059",
      "tooltip.copyRef": "\\u9078\\u629E\\u884C\\u306E logifai:// \\u53C2\\u7167\\u30EA\\u30F3\\u30AF\\u3092\\u30B3\\u30D4\\u30FC (Shift+\\u30AF\\u30EA\\u30C3\\u30AF\\u3067\\u7BC4\\u56F2\\u9078\\u629E)",
      "tooltip.copyLog": "\\u9078\\u629E\\u884C\\u306E\\u30ED\\u30B0\\u5185\\u5BB9\\u3092\\u30C6\\u30AD\\u30B9\\u30C8\\u3068\\u3057\\u3066\\u30B3\\u30D4\\u30FC",
      "placeholder.filter": "\\u30E1\\u30C3\\u30BB\\u30FC\\u30B8\\u3092\\u691C\\u7D22...",
      "status.loading": "\\u30BB\\u30C3\\u30B7\\u30E7\\u30F3\\u8AAD\\u307F\\u8FBC\\u307F\\u4E2D...",
      "status.noSessions": "\\u30BB\\u30C3\\u30B7\\u30E7\\u30F3\\u304C\\u898B\\u3064\\u304B\\u308A\\u307E\\u305B\\u3093",
      "status.errorSessions": "\\u30BB\\u30C3\\u30B7\\u30E7\\u30F3\\u8AAD\\u307F\\u8FBC\\u307F\\u30A8\\u30E9\\u30FC",
      "status.errorEntries": "\\u30A8\\u30F3\\u30C8\\u30EA\\u8AAD\\u307F\\u8FBC\\u307F\\u30A8\\u30E9\\u30FC",
      "info.totalEntries": "{count} \\u4EF6\\u306E\\u30A8\\u30F3\\u30C8\\u30EA \u00b7 {size}",
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
      "detail.gitCommit": "Git \\u30B3\\u30DF\\u30C3\\u30C8",
      "detail.pid": "PID",
      "detail.raw": "\\u751F\\u30C7\\u30FC\\u30BF",
      "detail.stackTrace": "\\u30B9\\u30BF\\u30C3\\u30AF\\u30C8\\u30EC\\u30FC\\u30B9",
      "detail.originalData": "\\u5143\\u30C7\\u30FC\\u30BF",
      "settings.retention": "\\u4FDD\\u6301\\u8A2D\\u5B9A",
      "settings.maxSize": "\\u6700\\u5927\\u5408\\u8A08\\u30B5\\u30A4\\u30BA (MB)",
      "settings.retentionDays": "\\u4FDD\\u6301\\u65E5\\u6570",
      "settings.autoCleanup": "\\u81EA\\u52D5\\u30AF\\u30EA\\u30FC\\u30F3\\u30A2\\u30C3\\u30D7",
      "btn.settings": "\\u8A2D\\u5B9A",
      "btn.cleanupNow": "\\u4ECA\\u3059\\u3050\\u30AF\\u30EA\\u30FC\\u30F3\\u30A2\\u30C3\\u30D7",
      "btn.save": "\\u4FDD\\u5B58",
      "btn.close": "\\u9589\\u3058\\u308B",
      "cleanup.result": "{count} \\u30BB\\u30C3\\u30B7\\u30E7\\u30F3\\u3092\\u524A\\u9664\\u3001{size} \\u89E3\\u653E",
      "cleanup.none": "\\u30AF\\u30EA\\u30FC\\u30F3\\u30A2\\u30C3\\u30D7\\u5BFE\\u8C61\\u306A\\u3057"
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
      var curSize = sessionsMap[currentSessionId] ? sessionsMap[currentSessionId].size : 0;
      sessionInfo.textContent = tReplace("info.totalEntries", { count: totalOnServer, size: formatSize(curSize) });
    }
  }

  // --- Format helpers ---
  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  // --- Virtual scroll constants ---
  var ROW_HEIGHT = 30;
  var BUFFER_ROWS = 20;
  var MAX_ENTRIES = 50000;
  var FETCH_PAGE = 1000;

  // --- App state ---
  var allEntries = [];
  var filteredIndices = [];   // indices into allEntries
  var renderStart = 0;
  var renderEnd = 0;
  var currentSessionId = null;
  var liveSessionId = null;
  var eventSource = null;
  var following = true;
  var lastScrollTop = 0;
  var newEntriesSinceUnfollow = 0;
  var selectedDetailIdx = -1; // index in filteredIndices
  var totalOnServer = 0;
  var loadedOffset = 0;
  var selectedLines = new Set();
  var lastCheckedLine = null;
  var fetchingMore = false;
  var allLoaded = false;
  var liveBatchPending = false;
  var sessionsMap = {};
  var sizePollingInterval = null;

  var sel = function(s) { return document.querySelector(s); };
  var selAll = function(s) { return document.querySelectorAll(s); };

  var logBody = sel("#logBody");
  var logScroll = sel("#logScroll");
  var spacerTop = sel("#spacerTop");
  var spacerBottom = sel("#spacerBottom");
  var sessionSelect = sel("#sessionSelect");
  var searchBox = sel("#searchBox");
  var followBtn = sel("#followBtn");
  var liveBadge = sel("#liveBadge");
  var entryCount = sel("#entryCount");
  var detailPanel = sel("#detailPanel");
  var detailContent = sel("#detailContent");
  var sessionInfo = sel("#sessionInfo");
  var copyRefBtn = sel("#copyRefBtn");
  var copyLogBtn = sel("#copyLogBtn");
  var deleteBtn = sel("#deleteBtn");
  var langSelect = sel("#langSelect");
  var newEntriesBadge = sel("#newEntriesBadge");
  var newEntriesBadgeBtn = sel("#newEntriesBadgeBtn");
  var newEntriesText = sel("#newEntriesText");
  var detailResizeHandle = sel("#detailResizeHandle");
  var settingsBtn = sel("#settingsBtn");
  var settingsOverlay = sel("#settingsOverlay");
  var retMaxSize = sel("#retMaxSize");
  var retDays = sel("#retDays");
  var retAutoCleanup = sel("#retAutoCleanup");
  var cleanupNowBtn = sel("#cleanupNowBtn");
  var retSaveBtn = sel("#retSaveBtn");
  var retCloseBtn = sel("#retCloseBtn");
  var cleanupStatus = sel("#cleanupStatus");

  // --- Virtual scroll core ---
  function calculateVisibleRange() {
    var scrollTop = logScroll.scrollTop;
    var viewHeight = logScroll.clientHeight;
    var total = filteredIndices.length;
    if (total === 0) return { start: 0, end: 0 };
    var firstVisible = Math.floor(scrollTop / ROW_HEIGHT);
    var visibleCount = Math.ceil(viewHeight / ROW_HEIGHT);
    var start = Math.max(0, firstVisible - BUFFER_ROWS);
    var end = Math.min(total, firstVisible + visibleCount + BUFFER_ROWS);
    return { start: start, end: end };
  }

  function renderVirtualRows() {
    var range = calculateVisibleRange();
    var total = filteredIndices.length;

    // Skip if range unchanged
    if (range.start === renderStart && range.end === renderEnd && logBody.childNodes.length === (renderEnd - renderStart)) {
      return;
    }

    renderStart = range.start;
    renderEnd = range.end;

    spacerTop.style.height = (renderStart * ROW_HEIGHT) + "px";
    spacerBottom.style.height = ((total - renderEnd) * ROW_HEIGHT) + "px";

    var frag = document.createDocumentFragment();
    for (var i = renderStart; i < renderEnd; i++) {
      frag.appendChild(createRow(allEntries[filteredIndices[i]], i));
    }
    logBody.innerHTML = "";
    logBody.appendChild(frag);
  }

  function updateVisibleCheckboxes() {
    var rows = logBody.childNodes;
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var ln = Number(row.dataset.line);
      var checked = selectedLines.has(ln);
      var cb = row.querySelector("input[type=checkbox]");
      if (cb) cb.checked = checked;
      if (checked) {
        row.classList.add("ref-selected");
      } else {
        row.classList.remove("ref-selected");
      }
    }
  }

  function createRow(entry, filteredIdx) {
    var row = document.createElement("div");
    row.className = "log-row";
    row.dataset.fidx = filteredIdx;
    var lineNum = entry._line || 0;
    row.dataset.line = lineNum;

    if (selectedLines.has(lineNum)) row.classList.add("ref-selected");
    if (filteredIdx === selectedDetailIdx) row.classList.add("selected");

    // Checkbox cell
    var divSel = document.createElement("div");
    divSel.className = "col-sel";
    var cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = selectedLines.has(lineNum);
    cb.addEventListener("click", function(e) {
      e.stopPropagation();
      handleCheckboxChange(e, lineNum, filteredIdx);
    });
    divSel.appendChild(cb);

    // Timestamp cell
    var divTs = document.createElement("div");
    divTs.className = "col-ts";
    divTs.textContent = formatTimestamp(entry.timestamp);

    // Level cell
    var divLvl = document.createElement("div");
    divLvl.className = "col-lvl";
    var lvlSpan = document.createElement("span");
    lvlSpan.className = "level-pill lvl-" + entry.level;
    lvlSpan.textContent = entry.level;
    divLvl.appendChild(lvlSpan);

    // Message cell
    var divMsg = document.createElement("div");
    divMsg.className = "col-msg";
    divMsg.textContent = entry.message;
    divMsg.title = entry.message;

    // Source cell
    var divSrc = document.createElement("div");
    divSrc.className = "col-src";
    divSrc.textContent = entry.source || "";

    row.appendChild(divSel);
    row.appendChild(divTs);
    row.appendChild(divLvl);
    row.appendChild(divMsg);
    row.appendChild(divSrc);

    row.addEventListener("click", function() { showDetail(entry, filteredIdx); });
    return row;
  }

  // --- Filtered indices management ---
  function rebuildFilteredIndices() {
    filteredIndices = [];
    var f = getActiveFilters();
    for (var i = 0; i < allEntries.length; i++) {
      if (matchesFilterWith(allEntries[i], f)) {
        filteredIndices.push(i);
      }
    }
  }

  function appendToFilteredIndices(from, count) {
    var f = getActiveFilters();
    for (var i = from; i < from + count && i < allEntries.length; i++) {
      if (matchesFilterWith(allEntries[i], f)) {
        filteredIndices.push(i);
      }
    }
  }

  // --- Scroll-driven lazy loading (browse mode) ---
  function maybeFetchMore() {
    if (fetchingMore || allLoaded) return;
    if (liveSessionId && currentSessionId === liveSessionId) return; // live mode uses SSE
    var scrollBottom = logScroll.scrollHeight - logScroll.scrollTop - logScroll.clientHeight;
    if (scrollBottom < 2000) {
      fetchMoreEntries();
    }
  }

  async function fetchMoreEntries() {
    if (fetchingMore || allLoaded || !currentSessionId) return;
    fetchingMore = true;
    try {
      var res = await fetch("/api/sessions/" + encodeURIComponent(currentSessionId) + "/entries?offset=" + loadedOffset + "&limit=" + FETCH_PAGE);
      var data = await res.json();
      var newEntries = data.entries || [];
      if (newEntries.length === 0) {
        allLoaded = true;
        fetchingMore = false;
        return;
      }
      var prevLen = allEntries.length;
      loadedOffset += newEntries.length;
      allEntries = allEntries.concat(newEntries);
      appendToFilteredIndices(prevLen, newEntries.length);
      updateEntryCount();
      renderVirtualRows();

      if (loadedOffset >= totalOnServer) {
        allLoaded = true;
      }
    } catch(e) { /* ignore */ }
    fetchingMore = false;
  }

  // --- Memory cap ---
  function trimOldEntries() {
    if (allEntries.length < MAX_ENTRIES) return;
    var trimCount = 5000;
    var wasFollowing = following;
    var oldScrollTop = logScroll.scrollTop;
    var removedFilteredCount = 0;

    // Count how many filtered rows are in the trimmed range
    for (var i = 0; i < filteredIndices.length; i++) {
      if (filteredIndices[i] < trimCount) removedFilteredCount++;
      else break;
    }

    allEntries.splice(0, trimCount);
    // Rebuild filtered indices since all indices shifted
    rebuildFilteredIndices();
    updateEntryCount();

    if (!wasFollowing) {
      // Adjust scroll position
      var pixelShift = removedFilteredCount * ROW_HEIGHT;
      logScroll.scrollTop = Math.max(0, oldScrollTop - pixelShift);
    }
    renderVirtualRows();
    lastScrollTop = logScroll.scrollTop;
  }

  // --- Scroll helpers ---
  function scrollToBottomVirtual() {
    var totalHeight = filteredIndices.length * ROW_HEIGHT;
    logScroll.scrollTop = totalHeight;
  }

  var scrollRafId = 0;
  function onScroll() {
    if (scrollRafId) return;
    scrollRafId = requestAnimationFrame(function() {
      scrollRafId = 0;
      var currentScrollTop = logScroll.scrollTop;
      var scrolledDown = currentScrollTop > lastScrollTop;
      if (currentScrollTop < lastScrollTop && following) {
        following = false;
        followBtn.classList.remove("active");
      }
      lastScrollTop = currentScrollTop;
      renderVirtualRows();
      maybeFetchMore();
      if (scrolledDown) {
        updateFollowState();
      }
    });
  }

  function updateFollowState() {
    var sh = logScroll.scrollHeight;
    var st = logScroll.scrollTop;
    var ch = logScroll.clientHeight;
    if (sh - st - ch <= 50 && !following) {
      following = true;
      followBtn.classList.add("active");
      newEntriesSinceUnfollow = 0;
      updateNewEntriesBadge();
    }
  }

  // --- Fetch sessions ---
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
      sessionsMap = {};
      sessions.forEach(function(s) {
        sessionsMap[s.id] = s;
        var opt = document.createElement("option");
        opt.value = s.id;
        var d = new Date(s.startedAt);
        var label = d.toLocaleString() + " (" + s.id + ")" + (s.id === liveSessionId ? " " + t("info.live") : "") + "  " + formatSize(s.size);
        opt.textContent = label;
        sessionSelect.appendChild(opt);
      });
      if (liveSessionId) {
        sessionSelect.value = liveSessionId;
      }
      loadSession(sessionSelect.value);
    } catch(e) {
      sessionSelect.innerHTML = '<option value="">' + t("status.errorSessions") + '</option>';
    }
  }

  // --- Load session ---
  async function loadSession(id) {
    if (!id) return;
    if (sizePollingInterval) { clearInterval(sizePollingInterval); sizePollingInterval = null; }
    currentSessionId = id;
    allEntries = [];
    filteredIndices = [];
    renderStart = 0;
    renderEnd = 0;
    loadedOffset = 0;
    fetchingMore = false;
    allLoaded = false;
    logBody.innerHTML = "";
    spacerTop.style.height = "0px";
    spacerBottom.style.height = "0px";
    closeDetail();
    clearSelection();
    lastScrollTop = 0;
    newEntriesSinceUnfollow = 0;

    var isLive = id === liveSessionId;
    liveBadge.style.display = isLive ? "inline" : "none";
    deleteBtn.disabled = isLive;

    if (eventSource) { eventSource.close(); eventSource = null; }

    try {
      var res = await fetch("/api/sessions/" + encodeURIComponent(id) + "/entries?limit=" + FETCH_PAGE);
      var data = await res.json();
      totalOnServer = data.total || 0;
      loadedOffset = data.entries ? data.entries.length : 0;
      allEntries = data.entries || [];
      rebuildFilteredIndices();
      updateEntryCount();
      renderVirtualRows();
      var sessionSize = sessionsMap[id] ? sessionsMap[id].size : 0;
      sessionInfo.textContent = tReplace("info.totalEntries", { count: totalOnServer, size: formatSize(sessionSize) });

      if (loadedOffset >= totalOnServer) {
        allLoaded = true;
      }
    } catch(e) {
      logBody.innerHTML = '<div style="color:var(--red);padding:20px;grid-column:1/-1">' + t("status.errorEntries") + '</div>';
    }

    if (isLive) {
      startSSE(id);
    }

    if (following) {
      scrollToBottomVirtual();
      lastScrollTop = logScroll.scrollTop;
    }
  }

  // --- SSE for live streaming ---
  function startSSE(id) {
    eventSource = new EventSource("/api/sessions/" + encodeURIComponent(id) + "/stream");
    eventSource.addEventListener("entry", function(e) {
      try {
        var entry = JSON.parse(e.data);
        allEntries.push(entry);
        totalOnServer++;
        var liveSize = sessionsMap[currentSessionId] ? sessionsMap[currentSessionId].size : 0;
        sessionInfo.textContent = tReplace("info.totalEntries", { count: totalOnServer, size: formatSize(liveSize) });
        loadedOffset = allEntries.length;

        if (matchesFilter(entry)) {
          filteredIndices.push(allEntries.length - 1);
          scheduleLiveRender();
        }

        trimOldEntries();
      } catch(err) { /* skip bad data */ }
    });
    eventSource.addEventListener("end", function() {
      liveBadge.style.display = "none";
      if (sizePollingInterval) { clearInterval(sizePollingInterval); sizePollingInterval = null; }
      eventSource.close();
      eventSource = null;
    });
    eventSource.onerror = function() {
      liveBadge.style.display = "none";
      if (sizePollingInterval) { clearInterval(sizePollingInterval); sizePollingInterval = null; }
    };

    // Poll file size every 30s for live sessions
    sizePollingInterval = setInterval(async function() {
      try {
        var res = await fetch("/api/sessions");
        var data = await res.json();
        var sessions = data.sessions || [];
        sessions.forEach(function(s) { sessionsMap[s.id] = s; });
        // Update current session info
        if (sessionsMap[currentSessionId]) {
          var sz = sessionsMap[currentSessionId].size;
          sessionInfo.textContent = tReplace("info.totalEntries", { count: totalOnServer, size: formatSize(sz) });
          // Update dropdown option text
          var opts = sessionSelect.options;
          for (var i = 0; i < opts.length; i++) {
            var s = sessionsMap[opts[i].value];
            if (s) {
              var d = new Date(s.startedAt);
              opts[i].textContent = d.toLocaleString() + " (" + s.id + ")" + (s.id === liveSessionId ? " " + t("info.live") : "") + "  " + formatSize(s.size);
            }
          }
        }
      } catch(e) { /* ignore */ }
    }, 15000);
  }

  function scheduleLiveRender() {
    if (liveBatchPending) return;
    liveBatchPending = true;
    requestAnimationFrame(function() {
      liveBatchPending = false;
      updateEntryCount();
      if (!following) {
        var savedTop = logScroll.scrollTop;
        renderVirtualRows();
        logScroll.scrollTop = savedTop;
        newEntriesSinceUnfollow++;
        updateNewEntriesBadge();
      } else {
        renderVirtualRows();
        scrollToBottomVirtual();
      }
    });
  }

  function updateNewEntriesBadge() {
    if (newEntriesSinceUnfollow > 0 && !following) {
      newEntriesText.textContent = newEntriesSinceUnfollow + (currentLang === "ja" ? " \\u4EF6\\u306E\\u65B0\\u30A8\\u30F3\\u30C8\\u30EA" : " new entries");
      newEntriesBadge.style.display = "block";
    } else {
      newEntriesBadge.style.display = "none";
    }
  }

  // --- Filtering ---
  function getActiveFilters() {
    var levels = [];
    selAll(".filters input[data-level]").forEach(function(cb) { if(cb.checked) levels.push(cb.dataset.level); });
    var search = searchBox.value.trim().toLowerCase();
    return { levels: levels, search: search };
  }

  function matchesFilterWith(entry, f) {
    if (!f.levels.includes(entry.level)) return false;
    if (f.search && !entry.message.toLowerCase().includes(f.search)) return false;
    return true;
  }

  function matchesFilter(entry) {
    return matchesFilterWith(entry, getActiveFilters());
  }

  function applyFilters() {
    clearSelection();
    rebuildFilteredIndices();
    renderStart = 0;
    renderEnd = 0;
    logScroll.scrollTop = 0;
    lastScrollTop = 0;
    updateEntryCount();
    renderVirtualRows();
  }

  // --- Render helpers ---
  function formatTimestamp(ts) {
    try {
      var d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleTimeString(undefined, {hour:"2-digit",minute:"2-digit",second:"2-digit",fractionalSecondDigits:3});
    } catch(e) { return ts; }
  }

  function updateEntryCount() {
    entryCount.textContent = tReplace("info.entries", { filtered: filteredIndices.length, total: allEntries.length });
  }

  // --- Detail panel ---
  function showDetail(entry, filteredIdx) {
    selectedDetailIdx = filteredIdx;
    // Re-render to update highlight
    renderVirtualRows();

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
      [t("detail.gitCommit"), escapeHtml(entry.git_commit || "N/A")],
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
    var savedHeight = localStorage.getItem("logifai-detail-height");
    if (savedHeight) {
      detailPanel.style.height = savedHeight + "px";
      detailPanel.style.maxHeight = "none";
      detailPanel.classList.add("no-animate");
    } else {
      detailPanel.style.height = "";
      detailPanel.style.maxHeight = "";
      detailPanel.classList.remove("no-animate");
    }
    detailPanel.classList.add("open");
    renderVirtualRows();
  }

  function closeDetail() {
    detailPanel.classList.remove("open");
    detailPanel.classList.remove("no-animate");
    detailPanel.style.height = "";
    detailPanel.style.maxHeight = "";
    selectedDetailIdx = -1;
    renderVirtualRows();
  }

  // --- Detail panel drag resize ---
  function initDetailResize() {
    var dragging = false;
    var startY = 0;
    var startHeight = 0;

    detailResizeHandle.addEventListener("mousedown", function(e) {
      e.preventDefault();
      dragging = true;
      startY = e.clientY;
      startHeight = detailPanel.offsetHeight;
      detailResizeHandle.classList.add("dragging");
      document.body.classList.add("no-select");
    });

    document.addEventListener("mousemove", function(e) {
      if (!dragging) return;
      var delta = startY - e.clientY;
      var newHeight = startHeight + delta;
      var maxH = window.innerHeight * 0.8;
      newHeight = Math.max(100, Math.min(newHeight, maxH));
      detailPanel.style.height = newHeight + "px";
      detailPanel.style.maxHeight = "none";
      renderVirtualRows();
    });

    document.addEventListener("mouseup", function() {
      if (!dragging) return;
      dragging = false;
      detailResizeHandle.classList.remove("dragging");
      document.body.classList.remove("no-select");
      var h = detailPanel.offsetHeight;
      localStorage.setItem("logifai-detail-height", String(h));
    });
  }

  function escapeHtml(s) {
    if (s == null || s === "") return "";
    if (typeof s !== "string") s = String(s);
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  // --- Selection & Copy Ref ---
  function clearSelection() {
    selectedLines = new Set();
    lastCheckedLine = null;
    updateCopyRefBtn();
    // No DOM traversal needed; renderVirtualRows will pick up changes
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

  function handleCheckboxChange(e, lineNum, filteredIdx) {
    if (e.target.checked) {
      if (e.shiftKey && lastCheckedLine !== null) {
        // Find range in filteredIndices
        var lo = Math.min(lastCheckedLine, lineNum);
        var hi = Math.max(lastCheckedLine, lineNum);
        for (var i = 0; i < filteredIndices.length; i++) {
          var entry = allEntries[filteredIndices[i]];
          var ln = entry._line || 0;
          if (ln >= lo && ln <= hi) {
            selectedLines.add(ln);
          }
        }
      } else {
        selectedLines.add(lineNum);
      }
    } else {
      selectedLines.delete(lineNum);
    }
    lastCheckedLine = lineNum;
    updateCopyRefBtn();
    updateVisibleCheckboxes();
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

  // --- Delete session ---
  async function deleteSession() {
    if (!currentSessionId) return;
    if (!confirm(t("confirm.delete"))) return;
    try {
      var res = await fetch("/api/sessions/" + encodeURIComponent(currentSessionId), { method: "DELETE" });
      if (res.ok) {
        sessionInfo.textContent = t("status.deleted");
        await fetchSessions();
      }
    } catch(e) { /* ignore */ }
  }

  // --- Settings load/save ---
  async function loadSettingsAndApply() {
    try {
      var res = await fetch("/api/settings");
      var settings = await res.json();
      if (settings.language && I18N[settings.language]) {
        currentLang = settings.language;
        langSelect.value = currentLang;
      }
      if (settings.retention) {
        retMaxSize.value = settings.retention.max_total_size_mb || 1024;
        retDays.value = settings.retention.retention_days || 30;
        retAutoCleanup.checked = settings.retention.auto_cleanup !== false;
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
        body: JSON.stringify({
          language: currentLang,
          retention: {
            max_total_size_mb: parseInt(retMaxSize.value, 10) || 1024,
            retention_days: parseInt(retDays.value, 10) || 30,
            auto_cleanup: retAutoCleanup.checked
          }
        })
      });
    } catch(e) { /* ignore save error */ }
  });

  // --- Events ---
  sessionSelect.addEventListener("change", function() { loadSession(sessionSelect.value); });

  selAll(".filters input[data-level]").forEach(function(cb) { cb.addEventListener("change", applyFilters); });
  searchBox.addEventListener("input", applyFilters);

  followBtn.addEventListener("click", function() {
    following = !following;
    followBtn.classList.toggle("active", following);
    if (following) {
      newEntriesSinceUnfollow = 0;
      updateNewEntriesBadge();
      scrollToBottomVirtual();
      lastScrollTop = logScroll.scrollTop;
    }
  });

  newEntriesBadgeBtn.addEventListener("click", function() {
    following = true;
    followBtn.classList.add("active");
    newEntriesSinceUnfollow = 0;
    updateNewEntriesBadge();
    scrollToBottomVirtual();
    lastScrollTop = logScroll.scrollTop;
  });

  logScroll.addEventListener("scroll", onScroll);

  sel("#detailClose").addEventListener("click", closeDetail);
  copyRefBtn.addEventListener("click", copyRef);
  copyLogBtn.addEventListener("click", copyLog);
  deleteBtn.addEventListener("click", deleteSession);

  // --- Settings dialog ---
  settingsBtn.addEventListener("click", function() {
    cleanupStatus.textContent = "";
    settingsOverlay.classList.add("open");
  });

  retCloseBtn.addEventListener("click", function() {
    settingsOverlay.classList.remove("open");
  });

  settingsOverlay.addEventListener("click", function(e) {
    if (e.target === settingsOverlay) settingsOverlay.classList.remove("open");
  });

  retSaveBtn.addEventListener("click", async function() {
    var maxSz = parseInt(retMaxSize.value, 10) || 1024;
    var days = parseInt(retDays.value, 10) || 30;
    var autoClean = retAutoCleanup.checked;
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: currentLang,
          retention: {
            max_total_size_mb: maxSz,
            retention_days: days,
            auto_cleanup: autoClean
          }
        })
      });
      cleanupStatus.textContent = "Saved!";
      setTimeout(function() { cleanupStatus.textContent = ""; }, 2000);
    } catch(e) { cleanupStatus.textContent = "Error saving settings"; }
  });

  cleanupNowBtn.addEventListener("click", async function() {
    cleanupNowBtn.disabled = true;
    cleanupStatus.textContent = "Cleaning up...";
    try {
      var res = await fetch("/api/cleanup", { method: "POST" });
      var data = await res.json();
      if (data.deletedCount > 0) {
        cleanupStatus.textContent = tReplace("cleanup.result", { count: data.deletedCount, size: formatSize(data.freedBytes) });
        fetchSessions();
      } else {
        cleanupStatus.textContent = t("cleanup.none");
      }
    } catch(e) {
      cleanupStatus.textContent = "Error running cleanup";
    }
    cleanupNowBtn.disabled = false;
  });

  // --- Init ---
  initDetailResize();
  loadSettingsAndApply().then(function() { fetchSessions(); });
})();
</script>
</body>
</html>`;
}
