/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050816",
        midnight: "#0b1023",
        panel: "#10172f",
        electric: "#32a9ff",
        violet: "#8b5cf6",
        biotech: {
          ink: "#17324d",
          slate: "#425466",
          line: "#d8e4eb",
          mist: "#f5fafb",
          blue: "#1677a8",
          teal: "#0f9d91",
          navy: "#102a43",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 24px 80px rgba(50, 169, 255, 0.18)",
        clinical: "0 10px 30px rgba(16, 42, 67, 0.08)",
      },
    },
  },
  plugins: [],
};
