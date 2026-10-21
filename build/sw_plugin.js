import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { exactRegex } from '@rolldown/pluginutils'
import { build } from 'vite'

import {
  generateServiceWorkerMessages,
  i18nFiles,
} from './service_worker_messages.js'

const getSWMessagesAsText = async () => {
  const messages = await generateServiceWorkerMessages()
  return `export default ${JSON.stringify(messages, undefined, 2)}`
}
const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))

// Idea taken from
// https://github.com/vite-pwa/vite-plugin-pwa/blob/main/src/plugins/build.ts
// rollup does not support compiling to iife if we want to code-split;
// however, we must compile the service worker to iife because of browser support.
// Run another vite build just for the service worker targeting iife at
// the end of the build.
export const buildSwPlugin = ({ swSrc, swDest }) => {
  const swFullSrc = resolve(projectRoot, swSrc)
  const swEnvName = 'virtual:pleroma-fe/service_worker_env'
  const swEnvNameResolved = '\0' + swEnvName

  let config

  return {
    name: 'build-sw-plugin',
    enforce: 'post',
    configResolved(resolvedConfig) {
      config = {
        define: resolvedConfig.define,
        resolve: resolvedConfig.resolve,
        plugins: [swMessagesPlugin()],
        publicDir: false,
        build: {
          ...resolvedConfig.build,
          emptyOutDir: false,
          rolldownOptions: {
            input: {
              main: swSrc,
            },
            context: 'self',
            output: {
              entryFileNames: swDest,
              codeSplitting: false,
              format: 'iife',
            },
          },
        },
        configFile: false,
      }
    },
    generateBundle: {
      order: 'post',
      sequential: true,
      async handler(_, bundle) {
        const assets = Object.keys(bundle)
          .filter((name) => !name.endsWith('.map'))
          .map((name) => '/' + name)

        config.plugins.push({
          name: 'build-sw-env-plugin',
          mode: 'production',
          resolveId: {
            filter: { id: exactRegex(swEnvName) },
            handler: () => swEnvNameResolved,
          },
          load: {
            filter: { id: exactRegex(swEnvNameResolved) },
            handler() {
              return `self.serviceWorkerOption = { assets: ${JSON.stringify(assets)} };`
            },
          },
        })
      },
    },
    resolveId: {
      filter: { id: new RegExp(swDest) },
      handler() {
        return swFullSrc
      },
    },
    load: {
      filter: { id: new RegExp(swFullSrc) },
      async handler() {
        config.plugins.push({
          name: 'dummy-sw-env',
          mode: 'development',
          resolveId: {
            filter: { id: exactRegex(swEnvName) },
            handler: () => swEnvNameResolved,
          },
          load: {
            filter: { id: exactRegex(swEnvNameResolved) },
            handler: () => 'self.serviceWorkerOption = { assets: [] }',
          },
        })

        try {
          const swBundle = await build(config)
          return swBundle.output[0]
        } catch (e) {
          console.error('Error building ServiceWorker:', e)
        }
      },
    },
    closeBundle: {
      order: 'post',
      sequential: true,
      async handler() {
        if (process.env.VITEST) return
        console.info('Building service worker for production')
        try {
          await build(config)
        } catch (e) {
          console.error('Error building ServiceWorker:', e)
        }
      },
    },
  }
}

const swMessagesName = 'virtual:pleroma-fe/service_worker_messages'
const swMessagesNameResolved = '\0' + swMessagesName

export const swMessagesPlugin = () => {
  return {
    name: 'sw-messages-plugin',
    resolveId(id) {
      if (id === swMessagesName) {
        Object.values(i18nFiles).forEach((f) => {
          this.addWatchFile(f)
        })
        return swMessagesNameResolved
      } else {
        return null
      }
    },
    async load(id) {
      if (id === swMessagesNameResolved) {
        return await getSWMessagesAsText()
      }
      return null
    },
  }
}
