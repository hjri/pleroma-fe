import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import stylelint from 'vite-plugin-stylelint'
import eslint from 'vite-plugin-eslint2'
import emojisPlugin from './build/emojis_plugin.js'
import { devSwPlugin, buildSwPlugin, swMessagesPlugin } from './build/sw_plugin.js'
import copyPlugin from './build/copy_plugin.js'
import { getCommitHash } from './build/commit_hash.js'
import mswPlugin from './build/msw_plugin.js'

const localConfigPath = '<projectRoot>/config/local.json'
const getLocalDevSettings = async () => {
  try {
    const settings = (await import('./config/local.json')).default
    if (settings.target && settings.target.endsWith('/')) {
      // replacing trailing slash since it can conflict with some apis
      // and that's how actual BE reports its url
      settings.target = settings.target.replace(/\/$/, '')
    }
    console.info(`Using local dev server settings (${localConfigPath}):`)
    console.info(JSON.stringify(settings, null, 2))
    return settings
  } catch (e) {
    console.info(`Local dev server settings not found (${localConfigPath}), using default`, e)
    return {}
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
        `No matter your choice, you can set the transformSW option in ${localConfigPath} in to disable this message.`
    )
    return true
  }
}

export default defineConfig(async ({ mode, command }) => {
  const settings = await getLocalDevSettings()
  const target = settings.target || 'http://localhost:4000/'
  const transformSW = getTransformSWSettings(settings)
  const proxy = {
    '/api': {
      target,
      changeOrigin: true,
      cookieDomainRewrite: 'localhost',
      ws: true
    },
    '/nodeinfo': {
      target,
      changeOrigin: true,
      cookieDomainRewrite: 'localhost'
    },
    '/socket': {
      target,
      changeOrigin: true,
      cookieDomainRewrite: 'localhost',
      ws: true,
      headers: {
        'Origin': target
      }
    },
    '/oauth': {
      target,
      changeOrigin: true,
      cookieDomainRewrite: 'localhost'
    }
  }

  const swSrc = 'src/sw.js'
  const swDest = 'sw-pleroma.js'
  const alias = {
    src: '/src',
    components: '/src/components',
    ...(mode === 'test' ? { vue: 'vue/dist/vue.esm-bundler.js' } : {})
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
            }
          }
        }
      }),
      vueJsx(),
      devSwPlugin({ swSrc, swDest, transformSW, alias }),
      buildSwPlugin({ swSrc, swDest }),
      swMessagesPlugin(),
      emojisPlugin(),
      copyPlugin({
        inUrl: '/static/ruffle',
        inFs: resolve(projectRoot, 'node_modules/@ruffle-rs/ruffle')
      }),
      eslint({
        lintInWorker: true,
        lintOnStart: true,
        cacheLocation: resolve(projectRoot, 'node_modules/.cache/eslintcache')
      }),
      stylelint({
        lintInWorker: true,
        lintOnStart: true,
        cacheLocation: resolve(projectRoot, 'node_modules/.cache/stylelintcache')
      }),
      ...(mode === 'test' ? [mswPlugin()] : [])
    ],
    optimizeDeps: {
      // For unknown reasons, during vitest, vite will re-optimize the following
      // deps, causing the test to reload, so add them here so that it will not
      // reload during tests
      include: [
        'custom-event-polyfill',
        'vue-i18n',
        '@ungap/event-target',
        'lodash.merge',
        'body-scroll-lock',
        '@kazvmoe-infra/pinch-zoom-element'
      ]
    },
    css: {
      devSourcemap: true
    },
    resolve: {
      alias
    },
    define: {
      'process.env': JSON.stringify({
        NODE_ENV: mode === 'test' ? 'testing' : command === 'serve' ? 'development' : 'production',
        HAS_MODULE_SERVICE_WORKER: command === 'serve' && !transformSW
      }),
      'COMMIT_HASH': JSON.stringify(command === 'serve' ? 'DEV' : getCommitHash()),
      'DEV_OVERRIDES': JSON.stringify(command === 'serve' ? settings : undefined),
      '__VUE_OPTIONS_API__': true,
      '__VUE_PROD_DEVTOOLS__': false,
      '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': false
    },
    build: {
      sourcemap: true,
      rollupOptions: {
        input: {
          main: 'index.html'
        },
        output: {
          inlineDynamicImports: false,
          entryFileNames (chunkInfo) {
            const id = chunkInfo.facadeModuleId
            if (id.endsWith(swSrc)) {
              return swDest
            } else {
              return 'static/js/[name].[hash].js'
            }
          },
          chunkFileNames (chunkInfo) {
            if (chunkInfo.facadeModuleId) {
              if (chunkInfo.facadeModuleId.includes('node_modules/@kazvmoe-infra/unicode-emoji-json/annotations/')) {
                return 'static/js/emoji-annotations/[name].[hash].js'
              } else if (chunkInfo.facadeModuleId.includes('src/i18n/')) {
                return 'static/js/i18n/[name].[hash].js'
              }
            }
            return 'static/js/[name].[hash].js'
          },
          assetFileNames (assetInfo) {
            const name = assetInfo.names?.[0] || ''
            if (/\.(png|jpe?g|gif|svg)(\?.*)?$/.test(name)) {
              return 'static/img/[name].[hash][extname]'
            } else if (/\.css$/.test(name)) {
              return 'static/css/[name].[hash][extname]'
            } else {
              return 'static/misc/[name].[hash][extname]'
            }
          }
        }
      },
    },
    server: {
      ...(mode === 'test' ? {} : { proxy }),
      port: Number(process.env.PORT) || 8080
    },
    preview: {
      proxy
    },
    test: {
      globals: true,
      browser: {
        enabled: true,
        provider: 'playwright',
        instances: [
          { browser: 'firefox' }
        ]
      }
    }
  }
})
