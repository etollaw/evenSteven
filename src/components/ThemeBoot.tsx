// Runs synchronously before hydration to avoid theme flicker.
export function ThemeBoot() {
  const code = `(() => { try {
    const s = localStorage.getItem('evensteven.theme');
    const m = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const t = s || (m ? 'dark' : 'light');
    if (t === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {} })();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
