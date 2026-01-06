import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import vue from 'eslint-plugin-vue'
import globals from 'globals'

export default defineConfig([
  ...vue.configs['flat/recommended'],
  globalIgnores(['**/*.js', 'build/', 'dist/', 'config/']),
  {
    files: ['src/**/*.vue'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',

      parserOptions: {
        parser: '@babel/eslint-parser',
      },
      globals: {
        ...globals.browser,
        ...globals.vitest,
        ...globals.chai,
        ...globals.commonjs,
        ...globals.serviceworker,
      },
    },

    rules: {
      'vue/require-prop-types': 0,
      'vue/multi-word-component-names': 0,
    },
  },
])
