/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // Exclude the projects/codersclub directory from Tailwind compiling of the main portfolio,
    // keeping its own CSS compilation independent if needed.
    "!./public/projects/codersclub/**/*"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
