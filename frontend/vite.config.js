import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Muat seluruh variabel .env (prefix kosong) agar APP_PORT & API_BASEURL terbaca.
  const env = loadEnv(mode, process.cwd(), '');
  const port = Number(env.APP_PORT) || 5173;

  return {
    plugins: [react(), tailwindcss()],
    define: {
      API_BASEURL: JSON.stringify(env.API_BASEURL || 'http://localhost:3000/api'),
    },
    server: { port, host: true },
    preview: { port },
    test: {
      globals: true,
      outputFile: { junit: './reports/junit.xml' },
      environment: 'jsdom',
      setupFiles: './src/setupTests.js',
      css: false,
      clearMocks: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        include: ['src/**/*.{js,jsx}'],
        exclude: [
          'src/main.jsx',
          'src/setupTests.js',
          'src/test-utils.jsx',
          'src/**/*.test.{js,jsx}',
        ],
        thresholds: { statements: 85, branches: 75, functions: 80, lines: 85 },
      },
    },
  };
});
