
export type Theme = 'light' | 'dark' | 'retro' | 'true-black';

export class ThemeManager {
  static applyTheme(theme: Theme) {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    
    const themes: Record<Theme, Record<string, string>> = {
      'light': {
        '--bg-primary': '#f8fafc',
        '--bg-secondary': '#ffffff',
        '--text-primary': '#0f172a',
        '--text-secondary': '#475569',
        '--border-color': '#e2e8f0',
        '--accent-color': '#2563eb',
        '--card-shadow': '0 4px 6px -1px rgb(0 0 0 / 0.1)'
      },
      'dark': {
        '--bg-primary': '#020617',
        '--bg-secondary': '#0f172a',
        '--text-primary': '#f8fafc',
        '--text-secondary': '#94a3b8',
        '--border-color': '#1e293b',
        '--accent-color': '#3b82f6',
        '--card-shadow': '0 10px 15px -3px rgb(0 0 0 / 0.5)'
      },
      'retro': {
        '--bg-primary': '#e7e5e4',
        '--bg-secondary': '#f5f5f4',
        '--text-primary': '#292524',
        '--text-secondary': '#78716c',
        '--border-color': '#d6d3d1',
        '--accent-color': '#a8a29e',
        '--card-shadow': 'none'
      },
      'true-black': {
        '--bg-primary': '#000000',
        '--bg-secondary': '#09090b',
        '--text-primary': '#ffffff',
        '--text-secondary': '#a1a1aa',
        '--border-color': '#27272a',
        '--accent-color': '#ffffff',
        '--card-shadow': '0 0 0 1px #27272a'
      }
    };

    const palette = themes[theme];
    Object.entries(palette).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
    document.body.className = `theme-${theme}`;
    window.dispatchEvent(new CustomEvent('nexus-theme-change', { detail: { theme } }));
  }
}
