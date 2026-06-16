import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `// injected from src/styles/variables.scss
// constants (don't change)
$font-family-sans: 'Poppins', system-ui, 'Segoe UI', Roboto, sans-serif;
$font-family-heading: 'Poppins', system-ui, 'Segoe UI', Roboto, sans-serif;

$radius-lg: 1.5rem;
$radius-md: 1rem;

$breakpoint-sm: 768px;

$shadow-light: 0 2px 4px rgba(0, 0, 0, 0.1);
$shadow-deep: 0 12px 30px rgba(15, 23, 42, 0.08);

/* Light theme */
:root {
  --bg: #ffffff;
  --text: #111827;
  --page-bg: #f5f7fb;
  --card-bg: #f8f9ff;
  --footer-bg: #dddddd;
  --footer-text: #666;
  --muted: #4f4f6b;

  --theme-switch-bg: linear-gradient(90deg, #6ea8ff, #7b65ff);
  --theme-switch-knob: #1f2937;
  --theme-switch-knob-icon: yellow;
  --topbar-link: #fff;

  --navbar-bg: #ffffff;
}

/* Dark theme */
[data-theme='theme-dark'] {
  --bg: #121212;
  --text: #f3f4f6;
  --page-bg: #0f172a;
  --card-bg: #1e293b;
  --footer-bg: #111827;
  --footer-text: #d1d5db;
  --muted: #9ca3af;

  --theme-switch-bg: #000;
  --theme-switch-knob: #fff;
  --theme-switch-knob-icon: #000;
  --topbar-link: #fff;

  --navbar-bg: #111111;
}
\n`,
        includePaths: [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'src', 'styles')]
      }
    }
  },
})
