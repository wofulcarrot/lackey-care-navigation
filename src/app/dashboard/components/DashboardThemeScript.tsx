/**
 * Inline script that runs BEFORE hydration so the dashboard picks up
 * the saved theme (`lackey-dash-theme`) without a flash of wrong
 * background. Separate from the patient-flow ThemeScript so the two
 * sides can track their theme independently.
 *
 * `dashboard-scope` is the class that flips the sage-green token block
 * for every dashboard route (added here rather than in the layout JSX
 * so it's on <html> before any component mounts).
 */
export function DashboardThemeScript() {
  const script = `
    (function() {
      try {
        var root = document.documentElement;
        root.classList.add('dashboard-scope');
        var saved = localStorage.getItem('lackey-dash-theme');
        if (saved === 'dark') root.classList.add('dark');
        else root.classList.remove('dark');
      } catch (e) { /* private browsing */ }
    })();
  `
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
