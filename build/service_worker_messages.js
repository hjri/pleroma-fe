import { languages, langCodeToJsonName } from '../src/i18n/languages.js'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const i18nDir = resolve(
  dirname(dirname(fileURLToPath(import.meta.url))),
  'src/i18n',
)

export const i18nFiles = languages.reduce((acc, lang) => {
  const name = langCodeToJsonName(lang)
  const file = resolve(i18nDir, name + '.json')
  acc[lang] = file
  return acc
}, {})

export const generateServiceWorkerMessages = async () => {
  const msgArray = await Promise.all(
    Object.entries(i18nFiles).map(async ([lang, file]) => {
      const fileContent = await readFile(file, 'utf-8')
      const msg = {
        notifications: JSON.parse(fileContent).notifications || {},
      }
      return [lang, msg]
    }),
  )
  return msgArray.reduce((acc, [lang, msg]) => {
    acc[lang] = msg
    return acc
  }, {})
}
