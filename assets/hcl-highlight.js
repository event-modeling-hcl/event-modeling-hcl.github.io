// Tiny, dependency-free HCL syntax highlighter for <code-block lang="hcl">.
// Not a full HCL parser — just enough lexical structure to color the
// constrained .em.hcl dialect: comments, strings, numbers/booleans, typed
// traversal references, block-opening keywords, attribute keys, punctuation.
(function (global) {
  "use strict";

  function escapeHtml(s) {
    return s.replace(/[&<>]/g, function (c) {
      return c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;";
    });
  }

  // Ordered by structural specificity, not by priority: each pattern only
  // matches where the others structurally cannot, so listing order does not
  // change the result (see the single-pass scan below).
  var TOKEN_RE = new RegExp(
    [
      "(?<comment>#[^\\n]*|//[^\\n]*|/\\*[\\s\\S]*?\\*/)",
      '(?<string>"(?:[^"\\\\]|\\\\.)*")',
      "(?<ref>\\b[a-zA-Z_][\\w]*(?:\\.[a-zA-Z_][\\w]*)+\\b)",
      '(?<keyword>\\b[a-zA-Z_][\\w]*(?=\\s*"(?:[^"\\\\]|\\\\.)*"\\s*\\{))',
      "(?<attr>\\b[a-zA-Z_][\\w]*(?=\\s*=(?!=)))",
      "(?<bool>\\b(?:true|false)\\b)",
      "(?<number>\\b\\d+(?:\\.\\d+)?\\b)",
      "(?<punct>[{}\\[\\]=,])",
    ].join("|"),
    "g",
  );

  function hclHighlight(source) {
    var out = "";
    var lastIndex = 0;
    var match;
    TOKEN_RE.lastIndex = 0;
    while ((match = TOKEN_RE.exec(source))) {
      out += escapeHtml(source.slice(lastIndex, match.index));
      var kind = Object.keys(match.groups).find(function (key) {
        return match.groups[key] !== undefined;
      });
      out += '<span class="tok-' + kind + '">' + escapeHtml(match[0]) + "</span>";
      lastIndex = match.index + match[0].length;
    }
    out += escapeHtml(source.slice(lastIndex));
    return out;
  }

  global.hclHighlight = hclHighlight;
})(window);
