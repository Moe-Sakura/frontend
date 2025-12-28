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
        // 艳粉主题配色
        theme: {
          primary: '#ff1493',           // DeepPink - 主色
          'primary-light': '#ff69b4',   // HotPink - 浅色
          'primary-lighter': '#ffb3d9', // 更浅
          'primary-dark': '#c71585',    // 深色
          'primary-darker': '#8b0a50',  // 更深
          
          accent: '#d946ef',            // 紫色辅助色
          'accent-light': '#e879f9',    // 浅紫色
          'accent-dark': '#c026d3',     // 深紫色
        },
        
        // 暗色主题颜色
        dark: {
          bg: {
            primary: '#0f172a',         // 主背景
            secondary: '#1e293b',       // 次要背景
            tertiary: '#334155',        // 第三背景
          },
          text: {
            primary: '#e2e8f0',         // 主文本
            secondary: '#cbd5e1',       // 次要文本
            tertiary: '#94a3b8',        // 第三文本
          },
          border: {
            DEFAULT: 'rgba(255, 105, 180, 0.3)',  // 粉色边框
            hover: 'rgba(255, 105, 180, 0.5)',    // 悬停粉色边框
          }
        },
        
        // 艳粉色系扩展
        'deep-pink': {
          50: '#fff5fa',
          100: '#ffe4f2',
          200: '#ffc9e6',
          300: '#ffb3d9',
          400: '#ff94cf',
          500: '#ff1493',   // 主色
          600: '#d946ef',
          700: '#c71585',
          800: '#a0116b',
          900: '#8b0a50',
        },
        
        // 粉紫色系
        'pink-purple': {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        }
      },
      
      backgroundImage: {
        'gradient-pink': 'linear-gradient(135deg, #ff1493 0%, #d946ef 100%)',
        'gradient-pink-light': 'linear-gradient(135deg, #ff69b4 0%, #e879f9 100%)',
        'gradient-pink-reverse': 'linear-gradient(135deg, #d946ef 0%, #ff1493 100%)',
        'gradient-pink-soft': 'linear-gradient(135deg, #ffe4f2 0%, #ffc9e6 100%)',
      },
      
      boxShadow: {
        'pink-sm': '0 1px 2px rgba(255, 20, 147, 0.1)',
        'pink-md': '0 4px 6px rgba(255, 20, 147, 0.15)',
        'pink-lg': '0 10px 15px rgba(255, 20, 147, 0.2)',
        'pink-xl': '0 20px 25px rgba(255, 20, 147, 0.25)',
        'pink-glow': '0 0 20px rgba(255, 20, 147, 0.4)',
        'pink-glow-lg': '0 0 40px rgba(255, 20, 147, 0.6)',
      },
      
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-down': 'fadeInDown 0.6s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-pink': 'pulsePink 2s ease-in-out infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulsePink: {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(255, 20, 147, 0.4)',
            opacity: '1'
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(255, 20, 147, 0.6)',
            opacity: '0.9'
          },
        },
      },
    },
  },
  plugins: [],
}

