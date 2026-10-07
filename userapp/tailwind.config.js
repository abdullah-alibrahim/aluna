/** @type {import('tailwindcss').Config} */

// 1. Recreate your scaling logic using Viewport Width (vw)
const FIGMA_WIDTH = 393;
const scale = (size) => `${(size / FIGMA_WIDTH) * 100}vw`;

// 2. Automatically generate a spacing scale from 0 to 100
// This maps standard Tailwind classes (like p-4) to your scaled values.
const scaledSpacing = {};
for (let i = 0; i <= 100; i++) {
  // standard tailwind: 1 unit = 4px. So '4' = 16px.
  scaledSpacing[i] = scale(i * 4);
}

// 3. Generate explicit pixel values for absolute precision (optional but helpful)
// This allows you to write `w-[24px]` and it will actually scale the 24px.
const explicitSpacing = {};
for (let i = 0; i <= 200; i++) {
  explicitSpacing[`${i}px`] = scale(i);
}

module.exports = {
  darkMode: 'class',
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // OVERRIDE DEFAULT SPACING WITH YOUR SCALED SPACING
      spacing: {
        ...scaledSpacing,
        ...explicitSpacing,
      },
      // OVERRIDE FONT SIZES WITH YOUR SCALED SIZES
      fontSize: {
        'xs': scale(12),
        'sm': scale(14),
        'base': scale(16),  // Default text size
        'lg': scale(18),
        'xl': scale(20),
        '2xl': scale(24),
        '3xl': scale(28),
        '4xl': scale(32),
      },
      // Aluna brand colors
      colors: {
        primary: "#B59451",
        danger: "#F43F5E",
        white: "#FFFFFF",
        "black-main": "#14110A",
        background: "#F9F5EB",
        gray: {
          lighter: "#EFE6D6",
          light: "#A89878",
          medium: "#706256",
          dark: "#4A3E31",
        },
        success: {
          DEFAULT: "#10B981",
          light: "#ECFDF5",
        },
        error: {
          DEFAULT: "#F43F5E",
          light: "#FFF1F2",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FFFBEB",
        }
      },
      fontFamily: {
        figtree: ['Figtree_400Regular'],
        'figtree-medium': ['Figtree_500Medium'],
        'figtree-semibold': ['Figtree_600SemiBold'],
        'figtree-bold': ['Figtree_700Bold'],
      },
      borderRadius: {
        '3xl': scale(24), // Automatically scaled rounding!
        '4xl': scale(32),
        'full': '9999px',
      }
    },
  },
  plugins: [],
}