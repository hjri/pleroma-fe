import ISO6391 from 'iso-639-1'
import { map } from 'lodash-es'

import languagesObject from '../../i18n/messages'

const specialLanguageCodes = {
  pdc: 'en',
  ja_easy: 'ja',
  zh_Hant: 'zh-HANT',
  zh: 'zh-Hans',
}

const internalToBrowserLocale = (code) => specialLanguageCodes[code] || code

const internalToBackendLocale = (code) =>
  internalToBrowserLocale(code).replace('_', '-')
const internalToBackendLocaleMulti = (codes) => {
  const langs = Array.isArray(codes) ? codes : [codes]
  return langs.map(internalToBackendLocale).join(',')
}

const getLanguageName = (code) => {
  const specialLanguageNames = {
    pdc: 'Pennsilfaanisch-Deitsch',
    ja_easy: 'やさしいにほんご',
    'nan-TW': '臺語（閩南語）',
    zh: '简体中文',
    zh_Hant: '繁體中文',
  }
  const languageName = specialLanguageNames[code] || ISO6391.getNativeName(code)
  const browserLocale = internalToBrowserLocale(code)
  return (
    languageName.charAt(0).toLocaleUpperCase(browserLocale) +
    languageName.slice(1)
  )
}

const languages = map(languagesObject.languages, (code) => ({
  code,
  name: getLanguageName(code),
})).sort((a, b) => a.name.localeCompare(b.name))

const localeService = {
  internalToBrowserLocale,
  internalToBackendLocale,
  internalToBackendLocaleMulti,
  languages,
  getLanguageName,
}

export default localeService
