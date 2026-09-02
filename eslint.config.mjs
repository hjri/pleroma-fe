import { defineConfig, globalIgnores } from 'eslint/config'
import vue from 'eslint-plugin-vue'

export default defineConfig([
  ...vue.configs['flat/recommended'],
  globalIgnores(['**/*.js', 'build/', 'dist/', 'config/']),
  {
    files: ['src/**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: '@babel/eslint-parser',
      },
    },

    rules: {
      'vue/require-prop-types': 0,
      'vue/multi-word-component-names': 0,
    },
  },
])
