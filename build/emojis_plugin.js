import { resolve } from 'node:path'
import { access } from 'node:fs/promises'
import { languages, langCodeToCldrName } from '../src/i18n/languages.js'

const annotationsImportPrefix = '@kazvmoe-infra/unicode-emoji-json/annotations/'
const specialAnnotationsLocale = {
  ja_easy: 'ja'
}

const internalToAnnotationsLocale = (internal) => specialAnnotationsLocale[internal] || internal

// This gets all the annotations that are accessible (whose language
// can be chosen in the settings). Data for other languages are
// discarded because there is no way for it to be fetched.
const getAllAccessibleAnnotations = async (projectRoot) => {
  const imports = (await Promise.all(
    languages
      .map(async lang => {
        const destLang = internalToAnnotationsLocale(lang)
        const importModule = `${annotationsImportPrefix}${destLang}.json`
        const importFile = resolve(projectRoot, 'node_modules', importModule)
        try {
          await access(importFile)
          return `'${lang}': () => import('${importModule}')`
        } catch (e) {
          return
        }
      })))
        .filter(k => k)
        .join(',\n')

  return `
export const annotationsLoader = {
  ${imports}
}
`
}

const emojiAnnotationsId = 'virtual:pleroma-fe/emoji-annotations'
const emojiAnnotationsIdResolved = '\0' + emojiAnnotationsId

const emojisPlugin = () => {
  let projectRoot
  return {
    name: 'emojis-plugin',
    configResolved (conf) {
      projectRoot = conf.root
    },
    resolveId (id) {
      if (id === emojiAnnotationsId) {
        return emojiAnnotationsIdResolved
      }
      return null
    },
    async load (id) {
      if (id === emojiAnnotationsIdResolved) {
        return await getAllAccessibleAnnotations(projectRoot)
      }
      return null
    }
  }
}

export default emojisPlugin
