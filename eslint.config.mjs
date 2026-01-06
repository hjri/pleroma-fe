import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
  ...vue.configs['flat/recommended'],
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs', '**/*.vue'],
    ignores: ['build/*.js', 'config/*.js'],

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
      'arrow-parens': 0,
      'generator-star-spacing': 0,
      'no-debugger': 0,
      'vue/require-prop-types': 0,
      'vue/multi-word-component-names': 0,
    },
  },
]
