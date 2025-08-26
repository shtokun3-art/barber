const config = {
  theme: {
    extend: {
      fontFamily: {
        inter: ["var(--font-inter)", "sans-serif"],
        playfair: ["var(--font-playfair)", "serif"], 
      },
    },
  },
  plugins: ["@tailwindcss/postcss"],
};

export default config;
