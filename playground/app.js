(function () {
  "use strict";

  // LEGACY_DRAFT_KEY held the one-file draft before the playground had file
  // tabs. It is read once as the initial model.em.hcl, then removed.
  var LEGACY_DRAFT_KEY = "eventmodeling-hcl.playground.source.v1";
  var FILES_KEY = "eventmodeling-hcl.playground.files.v1";
  var PROFILE_KEY = "eventmodeling-hcl.playground.profile.v1";
  var SPLIT_KEY = "eventmodeling-hcl.playground.split.v1";
  var ZOOM_KEY = "eventmodeling-hcl.playground.zoom.v1";
  var editor = document.getElementById("editor");
  var profile = document.getElementById("profile");
  var previewScale = document.getElementById("preview-scale");
  var editorPane = document.querySelector(".pg-editor-pane");
  var resizeHandle = document.getElementById("resize-handle");
  var badge = document.getElementById("diagnostic-badge");
  var diagnostics = document.getElementById("diagnostics");
  var zoom = Number(localStorage.getItem(ZOOM_KEY)) || 100;
  var cm;
  // fileSources maps each tab name to its text. editor.js owns the tabs and
  // only reports names (eventmodeling:files), so the text of the active tab
  // is copied from CodeMirror after each change.
  var fileSources = {};
  var activeName = "";
  var resetting = false;

  CodeMirror.defineMode("emhcl", function () {
    var blocks = /^(bounded_context|aggregate|field_type|event|state_change|state_view|automation|translation|screen|command|readmodel|processor|scenario|given|when|then|actor|system|hotspot|chapter|field|subfield|comment)\b/;
    return { token: function (stream) {
      if (stream.sol() && stream.match(/\s*#/)) { stream.skipToEnd(); return "hcl-comment"; }
      if (stream.match(/"(?:[^"\\]|\\.)*"/)) return "hcl-string";
      if (stream.match(blocks)) return "hcl-block";
      if (stream.match(/[a-z_][a-z0-9_]*(?=\s*=)/)) return "hcl-key";
      if (stream.match(/\b(true|false|null|[0-9]+)\b/)) return "hcl-literal";
      if (stream.match(/[a-z_]+(?:\.[a-z_]+)+/)) return "hcl-ref";
      stream.next(); return null;
    }};
  });

  cm = CodeMirror.fromTextArea(editor, {
    mode: "emhcl", lineNumbers: true, tabSize: 2, indentUnit: 2,
    indentWithTabs: false, foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    extraKeys: { "Ctrl-Shift-F": function () { document.getElementById("format-btn").click(); }, "Cmd-Shift-F": function () { document.getElementById("format-btn").click(); }, "Tab": function (instance) { instance.replaceSelection("  "); } }
  });

  window.EventModelingEditorAdapter = {
    getValue: function () { return cm.getValue(); },
    setValue: function (value) { cm.setValue(value); },
    setDisabled: function (disabled) { cm.setOption("readOnly", disabled ? "nocursor" : false); },
    onChange: function (listener) { cm.on("change", listener); }
  };

  function saveFiles() {
    if (resetting) return;
    var list = Object.keys(fileSources).map(function (name) { return { name: name, source: fileSources[name] }; });
    localStorage.setItem(FILES_KEY, JSON.stringify(list));
    localStorage.removeItem(LEGACY_DRAFT_KEY);
  }

  function storedFiles() {
    try {
      var list = JSON.parse(localStorage.getItem(FILES_KEY) || "null");
      return Array.isArray(list) && list.length > 0 ? list : null;
    } catch (error) {
      return null;
    }
  }

  var savedFiles = storedFiles();
  if (savedFiles) {
    window.EventModelingInitialFiles = savedFiles;
    savedFiles.forEach(function (file) { if (file && typeof file.name === "string") fileSources[file.name] = String(file.source); });
  } else {
    var legacyDraft = localStorage.getItem(LEGACY_DRAFT_KEY);
    if (legacyDraft) window.EventModelingInitialSource = legacyDraft;
  }

  // editor.js replaces the editor text (setValue) before it reports the new
  // active tab, so the copy waits until the current event finishes.
  cm.on("change", function () {
    setTimeout(function () {
      if (!activeName) return;
      fileSources[activeName] = cm.getValue();
      saveFiles();
    }, 0);
  });

  document.addEventListener("eventmodeling:files", function (event) {
    var names = event.detail.files;
    var active = event.detail.active;
    var next = {};
    // A name not seen before is a new tab, the first tabs at start-up, or a
    // renamed tab. A rename always applies to the active tab (the first click
    // of the double-click selects it), so the editor holds its text.
    names.forEach(function (name) {
      if (Object.prototype.hasOwnProperty.call(fileSources, name)) next[name] = fileSources[name];
      else next[name] = name === active ? cm.getValue() : "";
    });
    fileSources = next;
    activeName = active;
    saveFiles();
  });

  var savedProfile = localStorage.getItem(PROFILE_KEY);
  if (savedProfile) profile.value = savedProfile;
  profile.addEventListener("change", function () { localStorage.setItem(PROFILE_KEY, profile.value); });

  function applyZoom() {
    zoom = Math.max(25, Math.min(200, zoom));
    document.getElementById("zoom-level").textContent = zoom + "%";
    previewScale.style.width = (10000 / zoom) + "%";
    previewScale.style.height = (10000 / zoom) + "%";
    previewScale.style.transform = "scale(" + (zoom / 100) + ")";
    localStorage.setItem(ZOOM_KEY, String(zoom));
  }
  document.getElementById("btn-zoom-in").addEventListener("click", function () { zoom += 10; applyZoom(); });
  document.getElementById("btn-zoom-out").addEventListener("click", function () { zoom -= 10; applyZoom(); });
  document.getElementById("btn-zoom-reset").addEventListener("click", function () { zoom = 100; applyZoom(); });
  applyZoom();

  document.getElementById("reset-btn").addEventListener("click", function () {
    if (Object.keys(fileSources).length > 1 && !window.confirm("Reset to the example? All files are replaced.")) return;
    resetting = true;
    localStorage.removeItem(FILES_KEY);
    localStorage.removeItem(LEGACY_DRAFT_KEY);
    location.reload();
  });
  document.getElementById("btn-clear").addEventListener("click", function () {
    diagnostics.innerHTML = "";
    badge.textContent = "Cleared";
    badge.className = "pg-badge";
  });

  document.addEventListener("eventmodeling:diagnostics", function (event) {
    var list = event.detail || [];
    var errors = list.filter(function (item) { return String(item.severity).toLowerCase() === "error"; }).length;
    var warnings = list.filter(function (item) { return String(item.severity).toLowerCase() === "warning"; }).length;
    badge.className = "pg-badge" + (errors ? " is-error" : warnings ? " is-warning" : "");
    badge.textContent = errors ? errors + " error" + (errors === 1 ? "" : "s") : warnings ? warnings + " warning" + (warnings === 1 ? "" : "s") : "OK";
  });

  function setPaneWidth(width) {
    var workspace = document.querySelector(".pg-workspace");
    var range = Math.max(280, Math.min(workspace.clientWidth - 280, width));
    editorPane.style.width = range + "px";
    localStorage.setItem(SPLIT_KEY, String(range));
    cm.refresh();
  }
  var savedSplit = Number(localStorage.getItem(SPLIT_KEY));
  if (savedSplit && window.innerWidth > 800) setPaneWidth(savedSplit);
  var dragging = false;
  resizeHandle.addEventListener("pointerdown", function (event) { dragging = true; resizeHandle.classList.add("is-dragging"); resizeHandle.setPointerCapture(event.pointerId); });
  resizeHandle.addEventListener("pointermove", function (event) { if (dragging && window.innerWidth > 800) setPaneWidth(event.clientX); });
  resizeHandle.addEventListener("pointerup", function () { dragging = false; resizeHandle.classList.remove("is-dragging"); });
  resizeHandle.addEventListener("keydown", function (event) { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); setPaneWidth(editorPane.getBoundingClientRect().width + (event.key === "ArrowLeft" ? -24 : 24)); } });
})();
