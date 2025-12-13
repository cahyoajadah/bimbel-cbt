// // ============================================
// // tailwind.config.js
// // ============================================

// import colors from 'tailwindcss/colors';

// /** @type {import('tailwindcss').Config} */
// export default {
//   content: [
//     "./index.html",
//     "./src/**/*.{js,ts,jsx,tsx}",
//   ],
//   theme: {
//     extend: {
//       colors: {
//         blue: colors.green,   // <--- override!
//         border: "hsl(var(--border))",
//         background: "hsl(var(--background))",
//         foreground: "hsl(var(--foreground))",
//       },
//     },
//   },
//   plugins: [],
// }


// ============================================
// tailwind.config.js
// ============================================

import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Kustomisasi palet "blue" untuk menjadi Hijau Tua & Lime
        // Class 'bg-blue-50' akan menjadi hijau kekuningan lembut
        // Class 'text-blue-700' akan menjadi hijau tua elegan
        blue: {
          50: '#f4fce3',  // Lime lembut (background item aktif)
          100: '#ecfccb', // Lime sedikit lebih tua
          200: '#d9f99d',
          300: '#bef264',
          400: '#a3e635',
          500: '#84cc16',
          600: '#15803d', // Hijau (Icon/Button)
          700: '#14532d', // Hijau Tua Tenang (Text Aktif)
          800: '#166534',
          900: '#064e3b', // Sangat Gelap
          950: '#022c22',
        },
        // Tambahan warna khusus jika perlu
        primary: '#14532d', // Hijau Tua
        accent: '#d9f99d',  // Kuning Kehijauan
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Rekomendasi font modern (opsional)
      }
    },
  },
  plugins: [],
}