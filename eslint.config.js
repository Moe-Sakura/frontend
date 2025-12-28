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

  // TypeScript 最严格规则（带类型检查）
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Vue 推荐规则
  ...pluginVue.configs['flat/recommended'],

  // TypeScript 类型检查配置
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

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
      // TypeScript 规则（严格但实用）
      '@typescript-eslint/no-explicit-any': 'warn', // any 警告（允许但不推荐）
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none', // 忽略 catch 块中未使用的错误变量
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn', // 非空断言警告
      '@typescript-eslint/no-floating-promises': 'warn', // Promise 未处理警告
      '@typescript-eslint/no-misused-promises': 'error', // Promise 误用检查
      '@typescript-eslint/await-thenable': 'error', // await 必须用于 Promise
      '@typescript-eslint/require-await': 'off', // 允许空 async 函数
      '@typescript-eslint/restrict-template-expressions': 'off', // 允许模板字符串中使用任意类型
      '@typescript-eslint/no-confusing-void-expression': 'off', // 允许 void 表达式
      '@typescript-eslint/no-unnecessary-condition': 'off', // 关闭，避免误报
      // 关闭过于严格的 unsafe 规则（实际项目中误报太多）
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off', // || 和 ?? 各有用途
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'off', // catch 变量类型
      '@typescript-eslint/no-deprecated': 'warn', // 弃用 API 警告而非错误
      '@typescript-eslint/no-extraneous-class': 'off', // 允许静态类（类型定义需要）
      '@typescript-eslint/no-unnecessary-type-parameters': 'off', // 允许单次使用的泛型参数
      '@typescript-eslint/restrict-plus-operands': 'off', // + 操作符类型检查
      '@typescript-eslint/no-implied-eval': 'warn', // 隐式 eval 警告
      '@typescript-eslint/no-empty-function': 'off', // 允许空函数
      '@typescript-eslint/no-misused-promises': 'warn', // Promise 误用降为警告

      // Vue 规则
      'vue/multi-word-component-names': 'off', // 允许单词组件名
      'vue/no-v-html': 'warn', // v-html 警告（XSS 风险）
      'vue/require-default-prop': 'off', // 不强制要求默认 prop
      'vue/require-prop-types': 'error', // 必须定义 prop 类型
      'vue/html-self-closing': [
        'error',
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
      'vue/html-indent': ['error', 2],

      // 通用规则（严格模式）
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }], // 允许 warn/error/info
      'no-debugger': 'error',
      'no-unused-vars': 'off', // 使用 TypeScript 的规则
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'semi': ['error', 'never'], // 不使用分号
      'quotes': ['error', 'single', { avoidEscape: true }],
      'comma-dangle': ['error', 'always-multiline'],
      'arrow-spacing': 'error',
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'space-before-function-paren': [
        'error',
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

