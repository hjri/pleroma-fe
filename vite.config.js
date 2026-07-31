import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vite'
import eslint from 'vite-plugin-eslint2'
import stylelint from 'vite-plugin-stylelint'
import { configDefaults } from 'vitest/config'

import { getCommitHash } from './build/commit_hash.js'
import copyPlugin from './build/copy_plugin.js'
import emojisPlugin from './build/emojis_plugin.js'
import mswPlugin from './build/msw_plugin.js'
import { buildSwPlugin, swMessagesPlugin } from './build/sw_plugin.js'

const localConfigPath = '<projectRoot>/config/local.json'
const normalizeTarget = (target) => {
  if (!target || typeof target !== 'string') return target
  return target.endsWith('/') ? target.replace(/\/$/, '') : target
}

const getLocalDevSettings = async () => {
  const envTarget = normalizeTarget(process.env.VITE_PROXY_TARGET)
  const envOrigin = normalizeTarget(process.env.VITE_PROXY_ORIGIN)
  try {
    const settings = (await import('./config/local.json')).default
    settings.target = normalizeTarget(settings.target)
    settings.origin = normalizeTarget(settings.origin)
    if (envTarget) settings.target = envTarget
    if (envOrigin) settings.origin = envOrigin
    console.info(`Using local dev server settings (${localConfigPath}):`)
    console.info(JSON.stringify(settings, null, 2))
    return settings
  } catch (e) {
    if (!envTarget && !envOrigin) {
      console.info(
        `Local dev server settings not found (${localConfigPath}), using default`,
        e,
      )
      return {}
    }
    const settings = { target: envTarget, origin: envOrigin }
    console.info(
      'Using dev server settings from VITE_PROXY_TARGET/VITE_PROXY_ORIGIN:',
    )
    console.info(JSON.stringify(settings, null, 2))
    return settings
  }
}

const projectRoot = dirname(fileURLToPath(import.meta.url))

const getTransformSWSettings = (settings) => {
  if ('transformSW' in settings) {
    return settings.transformSW
  } else {
    console.info(
      '`transformSW` is not present in your local settings.\n' +
        'This option controls whether the service worker should be bundled and transformed into iife (immediately-invoked function expression) during development.\n' +
        'If set to false, the service worker will be served as-is, as an ES Module.\n' +
        'Some browsers (e.g. Firefox) does not support ESM service workers.\n' +
        'To avoid surprises, it is defaulted to true, but this can be slow.\n' +
        'If you are using a browser that supports ESM service workers, you can set this option to false.\n' +
        `No matter your choice, you can set the transformSW option in ${localConfigPath} in to disable this message.`,
    )
    return true
  }
}

export default defineConfig(async ({ mode, command }) => {
  const settings = await getLocalDevSettings()
  const target = settings.target || 'http://localhost:4000/'
  const origin = settings.origin || target
  const targetSW = target.replace(/^http/, 'ws')
  const transformSW = getTransformSWSettings(settings)
  const proxy = {
    '/api': {
      target,
      changeOrigin: true,
      cookieDomainRewrite: 'localhost',
      ws: true,
      rewriteWsOrigin: true,
    },
    '/auth': {
      // Mastodon password reset lives here
      target,
      changeOrigin: true,
      cookieDomainRewrite: 'localhost',
      ws: true,
    },
    '/nodeinfo': {
      target,
      changeOrigin: true,
      cookieDomainRewrite: 'localhost',
    },
    '/instance': {
      target,
      changeOrigin: true,
      cookieDomainRewrite: 'localhost',
    },
    '/oauth': {
      target,
      changeOrigin: true,
      cookieDomainRewrite: 'localhost',
    },
    '/socket': {
      target: targetSW,
      changeOrigin: true,
      cookieDomainRewrite: 'localhost',
      rewriteWsOrigin: true,
      ws: true,
      headers: {
        Origin: origin,
      },
    },
  }

  const swSrc = 'src/sw.js'
  const swDest = 'sw-pleroma.js'
  const alias = {
    src: '/src',
    components: '/src/components',
    ...(mode === 'test' ? { vue: 'vue/dist/vue.esm-bundler.js' } : {}),
  }

  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement(tag) {
              if (tag === 'pinch-zoom') {
                return true
              }
              if (tag.startsWith('cropper-')) {
                return true
              }
              return false
            },
          },
        },
      }),
      vueJsx(),
      buildSwPlugin({ swSrc, swDest }),
      swMessagesPlugin(),
      emojisPlugin(),
      copyPlugin({
        inUrl: '/static/ruffle',
        inFs: resolve(projectRoot, 'node_modules/@ruffle-rs/ruffle'),
      }),
      eslint({
        lintInWorker: true,
        lintOnStart: true,
        cacheLocation: resolve(projectRoot, 'node_modules/.cache/eslintcache'),
      }),
      stylelint({
        lintInWorker: true,
        lintOnStart: true,
        cacheLocation: resolve(
          projectRoot,
          'node_modules/.cache/stylelintcache',
        ),
      }),
      ...(mode === 'test' ? [mswPlugin()] : []),
    ],
    css: {
      devSourcemap: true,
    },
    resolve: {
      alias,
    },
    define: {
      'process.env': JSON.stringify({
        NODE_ENV:
          mode === 'test'
            ? 'testing'
            : command === 'serve'
              ? 'development'
              : 'production',
        HAS_MODULE_SERVICE_WORKER: command === 'serve' && !transformSW,
      }),
      COMMIT_HASH: JSON.stringify(
        command === 'serve' ? 'DEV' : getCommitHash(),
      ),
      DEV_OVERRIDES: JSON.stringify(command === 'serve' ? settings : undefined),
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    },
    // devtools: { enabled: true },
    build: {
      sourcemap: true,
      rolldownOptions: {
        input: {
          main: 'index.html',
        },
        output: {
          entryFileNames(chunkInfo) {
            const id = chunkInfo.facadeModuleId
            if (id.endsWith(swSrc)) {
              return swDest
            } else {
              return 'static/js/[name].[hash].js'
            }
          },
          chunkFileNames(chunkInfo) {
            if (chunkInfo.facadeModuleId) {
              if (
                chunkInfo.facadeModuleId.includes(
                  'node_modules/@kazvmoe-infra/unicode-emoji-json/annotations/',
                )
              ) {
                return 'static/js/emoji-annotations/[name].[hash].js'
              } else if (chunkInfo.facadeModuleId.includes('src/i18n/')) {
                return 'static/js/i18n/[name].[hash].js'
              }
            }
            return 'static/js/[name].[hash].js'
          },
          assetFileNames(assetInfo) {
            const name = assetInfo.names?.[0] || ''
            if (/\.(png|jpe?g|gif|svg)(\?.*)?$/.test(name)) {
              return 'static/img/[name].[hash][extname]'
            } else if (/\.css$/.test(name)) {
              return 'static/css/[name].[hash][extname]'
            } else {
              return 'static/misc/[name].[hash][extname]'
            }
          },
        },
      },
    },
    server: {
      ...(mode === 'test' ? {} : { proxy }),
      port: Number(process.env.PORT) || 8080,
    },
    preview: {
      proxy,
    },
    test: {
      globals: true,
      exclude: [...configDefaults.exclude, 'test/e2e-playwright/**'],
      coverage: {
        provider: 'v8',
        exclude: ['**/*.style.js', 'public/**'],
      },
      browser: {
        enabled: true,
        headless: true,
        provider: playwright(),
        // https://github.com/mswjs/msw/issues/2757
        instances: [{ browser: 'chromium' }],
      },
    },
  }
})
