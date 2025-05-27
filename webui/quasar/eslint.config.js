// eslint.config.js
const js = require('@eslint/js')
const vue = require('eslint-plugin-vue')
const typescript = require('@typescript-eslint/eslint-plugin')
const parser = require('@typescript-eslint/parser')

export default [
  // 忽略规则
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.quasar/**',
      'src-capacitor/**',
      'src-cordova/**',
      'quasar.config.*.temporary.compiled*'
    ]
  },

  // 主配置
  {
    files: ['**/*.{js,ts,vue}'],
    languageOptions: {
      parser,
      parserOptions: {
        extraFileExtensions: ['.vue'],
        project: ['./tsconfig.json'],
        tsconfigRootDir: process.cwd(),
        ecmaVersion: 2018,
        sourceType: 'module'
      },
      globals: {
        ga: 'readonly',
        cordova: 'readonly',
        __statics: 'readonly',
        __QUASAR_SSR__: 'readonly',
        __QUASAR_SSR_SERVER__: 'readonly',
        __QUASAR_SSR_CLIENT__: 'readonly',
        __QUASAR_SSR_PWA__: 'readonly',
        process: 'readonly',
        Capacitor: 'readonly',
        chrome: 'readonly'
      }
    },
    env: {
      browser: true,
      es2020: true,
      node: true
    },
    plugins: {
      vue,
      '@typescript-eslint': typescript
    },
    extends: [
      js.configs.recommended,
      'plugin:@typescript-eslint/eslint-recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:@typescript-eslint/recommended-requiring-type-checking',
      'plugin:vue/vue3-essential',
      'plugin:vue/vue3-strongly-recommended',
      // 'plugin:vue/vue3-recommended', // 如需更高严格度可启用
      'standard'
    ],
    rules: {
      'generator-star-spacing': 'off',
      'arrow-parens': 'off',
      'one-var': 'off',
      'no-void': 'off',
      'multiline-ternary': 'off',
      'no-unused-vars': 'off',
      eqeqeq: 'error',
      'no-var': 'error',
      'vue/html-quotes': ['error', 'single'],
      'vue/html-self-closing': [
        'error',
        {
          html: {
            void: 'never',
            normal: 'always',
            component: 'always'
          },
          svg: 'always',
          math: 'always'
        }
      ],
      'vue/max-attributes-per-line': [
        'error',
        {
          singleline: { max: 4 },
          multiline: { max: 4 }
        }
      ],
      'import/first': 'off',
      'import/namespace': 'error',
      'import/default': 'error',
      'import/export': 'error',
      'import/extensions': 'off',
      'import/no-unresolved': 'off',
      'import/no-extraneous-dependencies': 'off',
      'prefer-promise-reject-errors': 'off',
      quotes: ['error', 'single', { avoidEscape: true }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': ['error'],
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      'space-before-function-paren': 'off',
      curly: 'off'
    }
  }
]
