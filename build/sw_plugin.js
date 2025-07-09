import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import { build } from 'vite'
import * as esbuild from 'esbuild'
import { generateServiceWorkerMessages, i18nFiles } from './service_worker_messages.js'

const getSWMessagesAsText = async () => {
  const messages = await generateServiceWorkerMessages()
  return `export default ${JSON.stringify(messages, undefined, 2)}`
}
const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))

const swEnvName = 'virtual:pleroma-fe/service_worker_env'
const swEnvNameResolved = '\0' + swEnvName
const getDevSwEnv = () => `self.serviceWorkerOption = { assets: [] };`
const getProdSwEnv = ({ assets }) => `self.serviceWorkerOption = { assets: ${JSON.stringify(assets)} };`

export const devSwPlugin = ({
  swSrc,
  swDest,
  transformSW,
  alias
}) => {
  const swFullSrc = resolve(projectRoot, swSrc)
  const esbuildAlias = {}
  Object.entries(alias).forEach(([source, dest]) => {
    esbuildAlias[source] = dest.startsWith('/') ? projectRoot + dest : dest
  })

  return {
    name: 'dev-sw-plugin',
    apply: 'serve',
    configResolved (conf) {
    },
    resolveId (id) {
      const name = id.startsWith('/') ? id.slice(1) : id
      if (name === swDest) {
        return swFullSrc
      } else if (name === swEnvName) {
        return swEnvNameResolved
      }
      return null
    },
    async load (id) {
      if (id === swFullSrc) {
        return readFile(swFullSrc, 'utf-8')
      } else if (id === swEnvNameResolved) {
        return getDevSwEnv()
      }
      return null
    },
    /**
     * vite does not bundle the service worker
     * during dev, and firefox does not support ESM as service worker
     * https://bugzilla.mozilla.org/show_bug.cgi?id=1360870
     */
    async transform (code, id) {
      if (id === swFullSrc && transformSW) {
        const res = await esbuild.build({
          entryPoints: [swSrc],
          bundle: true,
          write: false,
          outfile: 'sw-pleroma.js',
          alias: esbuildAlias,
          plugins: [{
            name: 'vite-like-root-resolve',
            setup (b) {
              b.onResolve(
                { filter: new RegExp(/^\//) },
                args => ({
                  path: resolve(projectRoot, args.path.slice(1))
                })
              )
            }
          }, {
            name: 'sw-messages',
            setup (b) {
              b.onResolve(
                { filter: new RegExp('^' + swMessagesName + '$') },
                args => ({
                  path: args.path,
                  namespace: 'sw-messages'
                }))
              b.onLoad(
                { filter: /.*/, namespace: 'sw-messages' },
                async () => ({
                  contents: await getSWMessagesAsText()
                }))
            }
          }, {
            name: 'sw-env',
            setup (b) {
              b.onResolve(
                { filter: new RegExp('^' + swEnvName + '$') },
                args => ({
                  path: args.path,
                  namespace: 'sw-env'
                }))
              b.onLoad(
                { filter: /.*/, namespace: 'sw-env' },
                () => ({
                  contents: getDevSwEnv()
                }))
            }
          }]
        })
        const text = res.outputFiles[0].text
        return text
      }
    }
  }
}

// Idea taken from
// https://github.com/vite-pwa/vite-plugin-pwa/blob/main/src/plugins/build.ts
// rollup does not support compiling to iife if we want to code-split;
// however, we must compile the service worker to iife because of browser support.
// Run another vite build just for the service worker targeting iife at
// the end of the build.
export const buildSwPlugin = ({
  swSrc,
  swDest,
}) => {
  let config
  return {
    name: 'build-sw-plugin',
    enforce: 'post',
    apply: 'build',
    configResolved (resolvedConfig) {
      config = {
        define: resolvedConfig.define,
        resolve: resolvedConfig.resolve,
        plugins: [swMessagesPlugin()],
        publicDir: false,
        build: {
          ...resolvedConfig.build,
          lib: {
            entry: swSrc,
            formats: ['iife'],
            name: 'sw_pleroma'
          },
          emptyOutDir: false,
          rollupOptions: {
            output: {
              entryFileNames: swDest
            }
          }
        },
        configFile: false
      }
    },
    generateBundle: {
      order: 'post',
      sequential: true,
      async handler (_, bundle) {
        const assets = Object.keys(bundle)
              .filter(name => !/\.map$/.test(name))
              .map(name => '/' + name)
        config.plugins.push({
          name: 'build-sw-env-plugin',
          resolveId (id) {
            if (id === swEnvName) {
              return swEnvNameResolved
            }
            return null
          },
          load (id) {
            if (id === swEnvNameResolved) {
              return getProdSwEnv({ assets })
            }
            return null
          }
        })
      }
    },
    closeBundle: {
      order: 'post',
      sequential: true,
      async handler () {
        console.log('Building service worker for production')
        await build(config)
      }
    }
  }
}

const swMessagesName = 'virtual:pleroma-fe/service_worker_messages'
const swMessagesNameResolved = '\0' + swMessagesName

export const swMessagesPlugin = () => {
  return {
    name: 'sw-messages-plugin',
    resolveId (id) {
      if (id === swMessagesName) {
        Object.values(i18nFiles).forEach(f => {
          this.addWatchFile(f)
        })
        return swMessagesNameResolved
      } else {
        return null
      }
    },
    async load (id) {
      if (id === swMessagesNameResolved) {
        return await getSWMessagesAsText()
      }
      return null
    }
  }
}
