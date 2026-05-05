// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  // Tailwind solo escanea los archivos del proyecto para purgar clases no usadas
  content: [
    './index.html',
    './src/**/*.{vue,js}'
  ],
  theme: {
    extend: {}
  },
  // No usamos plugins de Tailwind — la identidad visual va en CSS propio
  plugins: []
}
