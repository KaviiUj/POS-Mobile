import colors from './src/utils/colors.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        accent: colors.accent,
        background: {
          primary: colors.background.primary,
          secondary: colors.background.secondary,
          search: colors.background.search,
        },
        neutral: {
          medium: colors.neutral.medium,
          light: colors.neutral.light,
        },
        text: {
          primary: colors.text.primary,
          secondary: colors.text.secondary,
          disabled: colors.text.disabled,
          placeholder: colors.text.placeholder,
        },
        border: {
          primary: colors.border.primary,
          secondary: colors.border.secondary,
        },
        status: {
          error: colors.status.error,
          warning: colors.status.warning,
        },
      },
      fontFamily: {
        sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

