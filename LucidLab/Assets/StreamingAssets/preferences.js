/**
 * LucidLab shared preferences — include in every page.
 * Reads saved theme / accent / text-size from localStorage,
 * applies them immediately, and listens for live changes
 * broadcast by the shell (student_app.html).
 */
(function () {
  var root = document.documentElement;

  function load(key, def) {
    try { return localStorage.getItem("lucidlab_" + key) || def; } catch (e) { return def; }
  }

  // ── Theme ──
  function applyTheme(theme) {
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
  }

  // ── Accent color ──
  function applyAccent(color) {
    root.style.setProperty("--accent", color);
  }

  // ── Text size ──
  var SCALE = { small: 0.85, "default": 1, large: 1.15 };
  function applySize(size) {
    root.style.setProperty("--text-scale", SCALE[size] || 1);
  }

  // ── Apply all on load ──
  applyTheme(load("theme", "dark"));
  applyAccent(load("accent", "#00f2ff"));
  applySize(load("textsize", "default"));

  // ── Live updates from shell ──
  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || d.type !== "preference_change") return;
    if (d.key === "theme")    applyTheme(d.value);
    if (d.key === "accent")   applyAccent(d.value);
    if (d.key === "textsize") applySize(d.value);
  });
})();
