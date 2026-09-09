(function () {
  "use strict";

  var DRAFT_KEY = "eventmodeling-hcl.playground.source.v1";
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
    onChange: function (listener) { cm.on("change", function () { localStorage.setItem(DRAFT_KEY, cm.getValue()); listener(); }); }
  };

  var savedDraft = localStorage.getItem(DRAFT_KEY);
  if (savedDraft) window.EventModelingInitialSource = savedDraft;
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
    localStorage.removeItem(DRAFT_KEY);
    cm.setValue(window.EVENT_MODELING_SEED || "");
    cm.focus();
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
