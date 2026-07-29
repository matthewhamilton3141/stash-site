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
