// Light/dark toggle. Initial theme is set inline in <head> to avoid a flash.
(function () {
  var KEY = "stash-site-theme";
  var root = document.documentElement;
  var btn = document.getElementById("theme-toggle");
  if (!btn) return;
  btn.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    localStorage.setItem(KEY, next);
  });
})();

// ⌘K palette. The site navigates the way the app does: type a few letters,
// hit return. Matching is fuzzy — letters in order, gaps allowed.
(function () {
  var el = document.getElementById("palette");
  var input = document.getElementById("palette-input");
  var list = document.getElementById("palette-list");
  var empty = document.getElementById("palette-empty");
  var openBtn = document.getElementById("palette-open");
  if (!el || !input || !list) return;

  var DMG =
    "https://github.com/matthewhamilton3141/stash/releases/latest/download/Stash.dmg";
  var REPO = "https://github.com/matthewhamilton3141/stash";

  function jump(hash) {
    return function () {
      var target = document.querySelector(hash);
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", hash);
    };
  }

  function open(url, newTab) {
    return function () {
      if (newTab) window.open(url, "_blank", "noopener");
      else window.location.href = url;
    };
  }

  function click(selector) {
    return function () {
      var target = document.querySelector(selector);
      if (target) target.click();
    };
  }

  var commands = [
    {
      label: "Download for macOS",
      hint: "Stash.dmg",
      keys: "get install dmg apple silicon intel release",
      run: open(DMG)
    },
    {
      label: "How it works",
      hint: "section",
      keys: "loop capture keystroke demo walkthrough",
      run: jump("#loop")
    },
    {
      label: "Features",
      hint: "section",
      keys: "search palette tags languages highlight",
      run: jump("#features")
    },
    {
      label: "Your files, on disk",
      hint: "section",
      keys: "markdown plain text vault own no database",
      run: jump("#files")
    },
    {
      label: "Star on GitHub",
      hint: "opens a tab",
      keys: "source code repo issues open",
      run: open(REPO, true)
    },
    {
      label: "Toggle light / dark",
      hint: "theme",
      keys: "appearance mode night day switch",
      run: click("#theme-toggle")
    },
    {
      label: "Copy the quarantine fix",
      hint: "xattr -cr",
      keys: "gatekeeper damaged blocked terminal command unsigned",
      run: click('[data-copy="#xattr-cmd"]')
    },
    { label: "Back to top", hint: "", keys: "home hero start", run: jump("#top") }
  ];

  // The hint is on screen, so people type it: "theme", "section", "dmg".
  commands.forEach(function (command) {
    command.keys = command.keys + " " + command.hint;
  });

  // Subsequence match. Rewards runs of adjacent hits and word starts,
  // penalises the distance skipped between them.
  function fuzzy(query, text) {
    var lower = text.toLowerCase();
    var positions = [];
    var from = 0;
    var previous = -2;
    var score = 0;
    for (var i = 0; i < query.length; i++) {
      var char = query.charAt(i);
      if (char === " ") continue;
      var at = lower.indexOf(char, from);
      if (at === -1) return null;
      if (at === previous + 1) score += 8;
      if (at === 0 || /[\s\-/(,.]/.test(lower.charAt(at - 1))) score += 6;
      score -= Math.min(at - from, 8) * 0.5;
      positions.push(at);
      previous = at;
      from = at + 1;
    }
    return { score: score - text.length * 0.05, positions: positions };
  }

  function match(command, query) {
    if (!query) return { score: 0, positions: [] };
    var onLabel = fuzzy(query, command.label);
    if (onLabel) return onLabel;
    var onKeys = fuzzy(query, command.keys);
    // keyword hits are real but weaker, and highlight nothing
    if (onKeys) return { score: onKeys.score - 10, positions: [] };
    return null;
  }

  function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function highlight(label, positions) {
    if (!positions.length) return escapeHtml(label);
    var html = "";
    var hit = 0;
    for (var i = 0; i < label.length; i++) {
      var isHit = positions[hit] === i;
      if (isHit) hit++;
      html += isHit
        ? "<mark>" + escapeHtml(label.charAt(i)) + "</mark>"
        : escapeHtml(label.charAt(i));
    }
    return html;
  }

  var results = [];
  var active = 0;

  function render() {
    var query = input.value.trim();
    results = [];
    for (var i = 0; i < commands.length; i++) {
      var hit = match(commands[i], query);
      if (hit) results.push({ command: commands[i], positions: hit.positions, score: hit.score });
    }
    if (query) results.sort(function (a, b) { return b.score - a.score; });

    list.innerHTML = "";
    for (var j = 0; j < results.length; j++) {
      var item = document.createElement("li");
      item.className = "palette-item";
      item.id = "palette-option-" + j;
      item.setAttribute("role", "option");
      item.setAttribute("data-index", j);
      item.innerHTML =
        "<span>" + highlight(results[j].command.label, results[j].positions) + "</span>" +
        (results[j].command.hint
          ? '<span class="palette-hint">' + escapeHtml(results[j].command.hint) + "</span>"
          : "");
      list.appendChild(item);
    }
    empty.hidden = results.length > 0;
    setActive(0);
  }

  function setActive(index) {
    if (!results.length) {
      active = 0;
      input.removeAttribute("aria-activedescendant");
      return;
    }
    active = (index + results.length) % results.length;
    var items = list.children;
    for (var i = 0; i < items.length; i++) {
      items[i].setAttribute("aria-selected", i === active ? "true" : "false");
    }
    items[active].scrollIntoView({ block: "nearest" });
    input.setAttribute("aria-activedescendant", items[active].id);
  }

  var lastFocused = null;

  function openPalette() {
    if (!el.hidden) return;
    lastFocused = document.activeElement;
    el.hidden = false;
    input.value = "";
    render();
    requestAnimationFrame(function () {
      el.classList.add("is-open");
    });
    input.focus();
  }

  function closePalette() {
    if (el.hidden) return;
    el.classList.remove("is-open");
    el.hidden = true;
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function runActive() {
    if (!results.length) return;
    var command = results[active].command;
    closePalette();
    command.run();
  }

  input.addEventListener("input", render);

  input.addEventListener("keydown", function (event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive(active + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(active - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      runActive();
    } else if (event.key === "Escape") {
      event.preventDefault();
      closePalette();
    } else if (event.key === "Tab") {
      // nothing else in here is focusable; keep the ring inside the dialog
      event.preventDefault();
    }
  });

  list.addEventListener("mousemove", function (event) {
    var item = event.target.closest(".palette-item");
    if (item) setActive(Number(item.getAttribute("data-index")));
  });

  list.addEventListener("click", function (event) {
    var item = event.target.closest(".palette-item");
    if (!item) return;
    setActive(Number(item.getAttribute("data-index")));
    runActive();
  });

  el.addEventListener("click", function (event) {
    if (event.target.hasAttribute("data-palette-close")) closePalette();
  });

  if (openBtn) openBtn.addEventListener("click", openPalette);

  document.addEventListener("keydown", function (event) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (el.hidden) openPalette();
      else closePalette();
    } else if (event.key === "Escape" && !el.hidden) {
      closePalette();
    }
  });
})();

// Copy buttons: copy the referenced element's text, flash confirmation.
(function () {
  document.querySelectorAll(".copy-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = document.querySelector(btn.getAttribute("data-copy"));
      if (!target) return;
      navigator.clipboard.writeText(target.textContent.trim()).then(function () {
        var label = btn.textContent;
        btn.textContent = "Copied ✓";
        btn.classList.add("copied");
        setTimeout(function () {
          btn.textContent = label;
          btn.classList.remove("copied");
        }, 1400);
      });
    });
  });
})();
