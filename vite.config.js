import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Tests de la web (Vitest + Testing Library). Se corren con "npm test".
  test: {
    // Los componentes se dibujan en un navegador simulado (jsdom), sin abrir uno real.
    environment: 'jsdom',
    // describe, test, expect... disponibles sin importar; además Testing Library limpia la
    // pantalla entre un test y otro.
    globals: true,
    // Todos los tests están en src/tests.
    include: ['src/tests/**/*.test.jsx'],
    // Informe de cobertura ("npm run coverage"): qué líneas de la parte visual recorren los
    // tests. Se mide solo el front (pantallas y componentes), sin los servicios de la API.
    // El informe queda en la carpeta coverage: abrir coverage/index.html en el navegador.
    coverage: {
      provider: 'v8',
      include: ['src/App.jsx', 'src/components/**/*.{js,jsx}'],
      reporter: ['text', 'html', 'json-summary'],
    },
  },
})
