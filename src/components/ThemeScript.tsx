/**
 * Inline theme-loader script. Runs synchronously in <head> BEFORE React
 * hydration so the page never flashes light-then-dark. Reads the saved
 * theme from localStorage (or falls back to the OS preference) and
 * applies the `.dark` class to <html> immediately.
 *
 * Embedded as a string + dangerouslySetInnerHTML because `<script>` JSX
 * children are not executed when server-rendered as React JSX.
 */
const SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('lackey-theme');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) { /* localStorage unavailable; default to light */ }
})();
`.trim()

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
}
