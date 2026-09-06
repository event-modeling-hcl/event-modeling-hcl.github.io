// Shared page chrome: <site-nav>, <site-footer>, <code-block>, and the
// light/dark/system theme toggle. Plain custom elements, no shadow DOM, no
// build step — every page includes this once via <script defer>.
//
// Anti-flash-of-wrong-theme note: each page also inlines a tiny synchronous
// script in <head> (before this file loads) that applies any stored theme
// choice immediately. This file only wires up the *toggle button* and keeps
// it in sync; it does not need to re-apply the theme on load.
(function () {
  "use strict";

  // Single source of truth for the top nav. Add an entry here once the page
  // it points to actually exists — see README.md's stage checklist.
  var NAV_LINKS = [
    { href: "/", label: "Home" },
    { href: "/why-hcl.html", label: "Why HCL" },
    { href: "/learn/index.html", label: "Learn" },
    { href: "/examples/index.html", label: "Examples" },
  ];
  var NAV_EXTERNAL = [
    {
      href: "https://github.com/event-modeling-hcl/eventmodeling-hcl",
      label: "Tool",
    },
    { href: "https://github.com/event-modeling-hcl", label: "GitHub" },
  ];

  var FOOTER_LINKS = [
    { href: "/", label: "Home" },
    { href: "/ai.html", label: "Author with AI" },
    { href: "/reference.html", label: "Reference" },
    {
      href: "https://github.com/event-modeling-hcl/eventmodeling-hcl",
      label: "Tool repository",
    },
    {
      href: "https://github.com/event-modeling-hcl/spec",
      label: "Language spec",
    },
  ];

  var LOGO_SVG =
    '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="event-modeling-hcl">' +
    '<rect width="64" height="64" rx="14" fill="var(--accent)"/>' +
    '<text x="32" y="42" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" ' +
    'font-size="28" font-weight="700" fill="#f7f9fc">{ }</text>' +
    "</svg>";

  // ---------------------------- theme toggle ----------------------------

  function currentTheme() {
    var explicit = document.documentElement.getAttribute("data-theme");
    return explicit === "light" || explicit === "dark" ? explicit : "system";
  }

  function applyTheme(pref) {
    if (pref === "light" || pref === "dark") {
      document.documentElement.setAttribute("data-theme", pref);
      try {
        localStorage.setItem("theme", pref);
      } catch (e) {
        /* private browsing / storage blocked: theme just won't persist */
      }
    } else {
      document.documentElement.removeAttribute("data-theme");
      try {
        localStorage.removeItem("theme");
      } catch (e) {}
    }
    document.dispatchEvent(new CustomEvent("themechange"));
  }

  function cycleTheme() {
    var order = ["system", "light", "dark"];
    var next = order[(order.indexOf(currentTheme()) + 1) % order.length];
    applyTheme(next === "system" ? null : next);
  }

  var THEME_LABEL = { system: "Auto", light: "Light", dark: "Dark" };
  var THEME_ICON = { system: "◐", light: "☀", dark: "☾" };

  function themeButtonHtml() {
    var t = currentTheme();
    return (
      '<button type="button" class="theme-toggle" data-theme-toggle ' +
      'aria-label="Theme: ' +
      THEME_LABEL[t] +
      '. Click to change.">' +
      '<span aria-hidden="true">' +
      THEME_ICON[t] +
      "</span>" +
      THEME_LABEL[t] +
      "</button>"
    );
  }

  function refreshThemeButtons() {
    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      var t = currentTheme();
      btn.innerHTML =
        '<span aria-hidden="true">' + THEME_ICON[t] + "</span>" + THEME_LABEL[t];
      btn.setAttribute("aria-label", "Theme: " + THEME_LABEL[t] + ". Click to change.");
    });
  }

  document.addEventListener("themechange", refreshThemeButtons);
  document.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-theme-toggle]");
    if (btn) cycleTheme();
  });
  // Populate any standalone [data-theme-toggle] button's initial label —
  // <site-nav> builds its own copy inline, but a button placed directly in
  // page markup (e.g. a style-guide demo) needs this to run once up front.
  refreshThemeButtons();

  // ---------------------------- <site-nav> ----------------------------

  function isCurrentPage(href) {
    if (href.startsWith("http")) return false;
    var here = window.location.pathname.replace(/index\.html$/, "");
    var there = href.replace(/index\.html$/, "");
    if (there !== "/" && there.endsWith("/")) there = there.slice(0, -1);
    if (here !== "/" && here.endsWith("/")) here = here.slice(0, -1);
    if (here === there || (there === "" && here === "/")) return true;
    // A nav entry pointing at a section hub (e.g. /learn/index.html) also
    // stays highlighted for every page inside that section.
    return there !== "" && (here === there || here.indexOf(there + "/") === 0);
  }

  function renderNavLink(link) {
    var current = isCurrentPage(link.href) ? ' aria-current="page"' : "";
    return (
      '<a href="' +
      link.href +
      '"' +
      current +
      ">" +
      link.label +
      "</a>"
    );
  }

  function renderExternalLink(link) {
    return (
      '<a class="is-external" href="' +
      link.href +
      '" target="_blank" rel="noopener">' +
      link.label +
      "</a>"
    );
  }

  class SiteNav extends HTMLElement {
    connectedCallback() {
      var links = NAV_LINKS.map(renderNavLink)
        .concat(NAV_EXTERNAL.map(renderExternalLink))
        .join("");
      this.innerHTML =
        '<div class="site-nav-bar">' +
        '<a class="site-nav-brand" href="/">' +
        '<span class="site-nav-mark">' +
        LOGO_SVG +
        '</span><span class="site-nav-brand-text">event-modeling-hcl</span></a>' +
        '<button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-nav-links" aria-label="Menu">☰</button>' +
        '<ul class="site-nav-links" id="site-nav-links">' +
        links
          .split("</a>")
          .filter(Boolean)
          .map(function (l) {
            return "<li>" + l + "</a></li>";
          })
          .join("") +
        '<li><a class="nav-cta" href="/start.html"' +
        (isCurrentPage("/start.html") ? ' aria-current="page"' : "") +
        ">Get Started</a></li>" +
        "</ul>" +
        themeButtonHtml() +
        "</div>";

      var toggle = this.querySelector(".nav-toggle");
      var list = this.querySelector(".site-nav-links");
      toggle.addEventListener("click", function () {
        var open = list.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
      });
    }
  }

  // ---------------------------- <site-footer> ----------------------------

  class SiteFooter extends HTMLElement {
    connectedCallback() {
      var year = new Date().getFullYear();
      this.innerHTML =
        '<div class="site-footer-bar">' +
        "<span>© " +
        year +
        ' event-modeling-hcl · Apache License 2.0 · built with plain HTML, CSS &amp; JS</span>' +
        '<ul class="site-footer-links">' +
        FOOTER_LINKS.map(function (l) {
          var ext = l.href.startsWith("http")
            ? ' target="_blank" rel="noopener"'
            : "";
          return '<li><a href="' + l.href + '"' + ext + ">" + l.label + "</a></li>";
        }).join("") +
        "</ul></div>";
    }
  }

  // ---------------------------- <code-block> ----------------------------

  function dedent(text) {
    var lines = text.replace(/^\n/, "").replace(/\s+$/, "").split("\n");
    var indents = lines
      .filter(function (l) {
        return l.trim().length > 0;
      })
      .map(function (l) {
        return l.match(/^ */)[0].length;
      });
    var min = indents.length ? Math.min.apply(null, indents) : 0;
    return lines
      .map(function (l) {
        return l.slice(min);
      })
      .join("\n");
  }

  class CodeBlock extends HTMLElement {
    connectedCallback() {
      var lang = this.getAttribute("lang") || "text";
      var raw = dedent(this.textContent);
      var html =
        lang === "hcl" && window.hclHighlight
          ? window.hclHighlight(raw)
          : raw.replace(/[&<>]/g, function (c) {
              return c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;";
            });

      this.textContent = "";
      this.innerHTML =
        '<div class="code-block-bar">' +
        '<span class="code-block-lang">' +
        lang +
        "</span>" +
        '<button type="button" class="code-block-copy">Copy</button>' +
        "</div>" +
        "<pre><code>" +
        html +
        "</code></pre>";

      var button = this.querySelector(".code-block-copy");
      button.addEventListener("click", function () {
        var reset = function () {
          button.textContent = "Copy";
        };
        function fallbackCopy() {
          var textarea = document.createElement("textarea");
          textarea.value = raw;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          try {
            document.execCommand("copy");
          } catch (e) {}
          document.body.removeChild(textarea);
        }
        var done = function () {
          button.textContent = "Copied";
          setTimeout(reset, 1500);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(raw).then(done, function () {
            fallbackCopy();
            done();
          });
        } else {
          fallbackCopy();
          done();
        }
      });
    }
  }

  customElements.define("site-nav", SiteNav);
  customElements.define("site-footer", SiteFooter);
  customElements.define("code-block", CodeBlock);
})();
