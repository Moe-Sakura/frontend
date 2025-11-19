/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 使用 class 策略
  theme: {
    extend: {
      colors: {
        // 自定义暗色主题颜色
        dark: {
          bg: {
            primary: '#0f172a',    // 主背景
            secondary: '#1e293b',  // 次要背景
            tertiary: '#334155',   // 第三背景
          },
          text: {
            primary: '#e2e8f0',    // 主文本
            secondary: '#cbd5e1',  // 次要文本
            tertiary: '#94a3b8',   // 第三文本
          },
          border: {
            DEFAULT: 'rgba(139, 92, 246, 0.3)',
            hover: 'rgba(139, 92, 246, 0.5)',
          }
        }
      }
    },
  },
  plugins: [],
}

