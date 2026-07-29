// Light/dark toggle. Initial theme is set inline in <head> to avoid a flash.
(function () {
  var KEY = "jot-site-theme";
  var root = document.documentElement;
  var btn = document.getElementById("theme-toggle");
  if (!btn) return;
  btn.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    localStorage.setItem(KEY, next);
  });
})();
