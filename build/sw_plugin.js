import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'
import { build } from 'vite'
import { exactRegex } from '@rolldown/pluginutils'

import {
  generateServiceWorkerMessages,
  i18nFiles,
} from './service_worker_messages.js'

const getSWMessagesAsText = async () => {
  const messages = await generateServiceWorkerMessages()
  return `export default ${JSON.stringify(messages, undefined, 2)}`
}
const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))

const getDevSwEnv = () => `self.serviceWorkerOption = { assets: [] };`
const getProdSwEnv = ({ assets }) =>
  `self.serviceWorkerOption = { assets: ${JSON.stringify(assets)} };`

export const devSwPlugin = ({ swSrc, swDest }) => {
  const swFullSrc = resolve(projectRoot, swSrc)

  return {
    name: 'dev-sw-plugin', apply: 'serve',
    configResolved() {
      /* no-op */
    },
    resolveId(id) {
      const name = id.startsWith('/') ? id.slice(1) : id
      if (name === swDest) {
        return swFullSrc
      }
      return null
    },
    async load(id) {
      if (id === swFullSrc) {
        return readFile(swFullSrc, 'utf-8')
      }
      return null
    },
  }
}

export const swMessagesPlugin = () => {
  const swMessagesName = 'virtual:pleroma-fe/service_worker_messages'
  const swMessagesNameResolved = '\0' + swMessagesName

  return {
    name: 'sw-messages-plugin',
    resolveId: {
      filter: { id: exactRegex(swMessagesName) },
      handler() {
        return swMessagesNameResolved
      }
    },
    load: {
      filter: { id: exactRegex(swMessagesNameResolved) },
      async handler () {
        return await getSWMessagesAsText()
      }
    },
  }
}
