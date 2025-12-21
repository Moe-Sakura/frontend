import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'

export default tseslint.config(
  // 忽略的文件和目录
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.pnpm-store/**',
      '**/public/**',
      '**/*.config.js',
      '**/*.config.ts',
      '**/.history/**', // 忽略编辑器历史文件
      '**/.vscode/**',
      '**/.idea/**',
      '**/coverage/**',
    ],
  },

  // JavaScript 基础规则
  js.configs.recommended,

  // TypeScript 推荐规则
  ...tseslint.configs.recommended,

  // Vue 推荐规则
  ...pluginVue.configs['flat/recommended'],

  // 自定义规则
  {
    files: ['**/*.{js,mjs,cjs,ts,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // 浏览器环境全局变量
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        // DOM 类型
        HTMLElement: 'readonly',
        HTMLImageElement: 'readonly',
        Element: 'readonly',
        NodeList: 'readonly',
        // 事件类型
        Event: 'readonly',
        MouseEvent: 'readonly',
        TouchEvent: 'readonly',
        KeyboardEvent: 'readonly',
        CustomEvent: 'readonly',
        // 其他
        MutationObserver: 'readonly',
        ResizeObserver: 'readonly',
        IntersectionObserver: 'readonly',
        confirm: 'readonly',
        Image: 'readonly',
        AbortController: 'readonly',
      },
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      // TypeScript 规则
      '@typescript-eslint/no-explicit-any': 'warn', // 允许 any，但给出警告
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none', // 忽略 catch 块中未使用的错误变量
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'off', // 允许非空断言（IndexedDB 需要）

      // Vue 规则
      'vue/multi-word-component-names': 'off', // 允许单词组件名
      'vue/no-v-html': 'warn', // v-html 警告而非错误
      'vue/require-default-prop': 'off', // 不强制要求默认 prop
      'vue/require-prop-types': 'warn',
      'vue/html-self-closing': [
        'warn',
        {
          html: {
            void: 'always',
            normal: 'always',
            component: 'always',
          },
          svg: 'always',
          math: 'always',
        },
      ],
      'vue/max-attributes-per-line': 'off', // 不限制每行属性数量
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-indent': ['warn', 2],

      // 通用规则
      'no-console': 'off', // 允许 console（开发时有用）
      'no-debugger': 'warn',
      'no-unused-vars': 'off', // 使用 TypeScript 的规则
      'prefer-const': 'warn',
      'no-var': 'error',
      'eqeqeq': ['warn', 'always'],
      'curly': ['warn', 'all'],
      'semi': ['warn', 'never'], // 不使用分号
      'quotes': ['warn', 'single', { avoidEscape: true }],
      'comma-dangle': ['warn', 'always-multiline'],
      'arrow-spacing': 'warn',
      'object-curly-spacing': ['warn', 'always'],
      'array-bracket-spacing': ['warn', 'never'],
      'space-before-function-paren': [
        'warn',
        {
          anonymous: 'always',
          named: 'never',
          asyncArrow: 'always',
        },
      ],
    },
  },

  // Vue 文件特定配置
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
    },
  },
)

