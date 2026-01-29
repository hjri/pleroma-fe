import Cookies from 'js-cookie'
import { set } from 'lodash'

import { useEmojiStore } from 'src/stores/emoji.js'
import { useI18nStore } from 'src/stores/i18n.js'
import { useInstanceStore } from 'src/stores/instance.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import messages from '../i18n/messages'
import localeService from '../services/locale/locale.service.js'
import { applyConfig } from '../services/style_setter/style_setter.js'
import { defaultState, instanceDefaultConfig } from './default_config_state.js'

const BACKEND_LANGUAGE_COOKIE_NAME = 'userLanguage'
const APPEARANCE_SETTINGS_KEYS = new Set([
  'sidebarColumnWidth',
  'contentColumnWidth',
  'notifsColumnWidth',
  'themeEditorMinWidth',
  'textSize',
  'navbarSize',
  'panelHeaderSize',
  'forcedRoundness',
  'emojiSize',
  'emojiReactionsScale',
])

/* TODO this is a bit messy.
 * We need to declare settings with their types and also deal with
 * instance-default settings in some way, hopefully try to avoid copy-pasta
 * in general.
 */
export const multiChoiceProperties = [
  'postContentType',
  'subjectLineBehavior',
  'conversationDisplay', // tree | linear
  'conversationOtherRepliesButton', // below | inside
  'mentionLinkDisplay', // short | full_for_remote | full
  'userPopoverAvatarAction', // close | zoom | open
  'unsavedPostAction', // save | discard | confirm
]

// caching the instance default properties
export const instanceDefaultProperties = Object.keys(instanceDefaultConfig)

const config = {
  state: { ...defaultState },
  getters: {
    defaultConfig() {
      return {
        ...defaultState,
        ...Object.fromEntries(
          instanceDefaultProperties.map((key) => [
            key,
            useInstanceStore()[key],
          ]),
        ),
      }
    },
    mergedConfig(state) {
      const instancePrefs = useInstanceStore().prefsStorage
      const result = Object.fromEntries(
        Object.entries(defaultState).map(([k, v]) => [
          k,
          v ?? instancePrefs[k],
        ]),
      )
      return result
    },
  },
  mutations: {
    setOptionTemporarily(state, { name, value }) {
      set(state, name, value)
      applyConfig(state)
    },
    setOption(state, { name, value }) {
      set(state, name, value)
    },
    setHighlight(state, { user, color, type }) {
      const data = this.state.config.highlight[user]
      if (color || type) {
        state.highlight[user] = {
          color: color || data.color,
          type: type || data.type,
        }
      } else {
        delete state.highlight[user]
      }
    },
  },
  actions: {
    loadSettings({ dispatch }, data) {
      const knownKeys = new Set(Object.keys(defaultState))
      const presentKeys = new Set(Object.keys(data))
      const intersection = new Set()
      for (const elem of presentKeys) {
        if (knownKeys.has(elem)) {
          intersection.add(elem)
        }
      }

      intersection.forEach((name) =>
        dispatch('setOption', { name, value: data[name] }),
      )
    },
    setHighlight({ commit }, { user, color, type }) {
      commit('setHighlight', { user, color, type })
    },
    setOptionTemporarily({ commit, dispatch, state }, { name, value }) {
      if (useInterfaceStore().temporaryChangesTimeoutId !== null) {
        console.warn("Can't track more than one temporary change")
        return
      }
      const oldValue = state[name]

      commit('setOptionTemporarily', { name, value })

      const confirm = () => {
        dispatch('setOption', { name, value })
        useInterfaceStore().clearTemporaryChanges()
      }

      const revert = () => {
        commit('setOptionTemporarily', { name, value: oldValue })
        useInterfaceStore().clearTemporaryChanges()
      }

      useInterfaceStore().setTemporaryChanges({
        confirm,
        revert,
      })
    },
    setThemeV2({ commit, dispatch }, { customTheme, customThemeSource }) {
      commit('setOption', { name: 'theme', value: 'custom' })
      commit('setOption', { name: 'customTheme', value: customTheme })
      commit('setOption', {
        name: 'customThemeSource',
        value: customThemeSource,
      })
      dispatch('setTheme', { themeData: customThemeSource, recompile: true })
    },
    setOption({ commit, dispatch, state }, { name, value }) {
      const exceptions = new Set(['useStreamingApi'])

      if (exceptions.has(name)) {
        switch (name) {
          case 'useStreamingApi': {
            const action = value ? 'enableMastoSockets' : 'disableMastoSockets'

            dispatch(action)
              .then(() => {
                commit('setOption', { name: 'useStreamingApi', value })
              })
              .catch((e) => {
                console.error('Failed starting MastoAPI Streaming socket', e)
                dispatch('disableMastoSockets')
                dispatch('setOption', { name: 'useStreamingApi', value: false })
              })
            break
          }
        }
      } else {
        commit('setOption', { name, value })
        if (APPEARANCE_SETTINGS_KEYS.has(name)) {
          applyConfig(state)
        }
        if (name.startsWith('theme3hacks')) {
          dispatch('applyTheme', { recompile: true })
        }
        switch (name) {
          case 'theme':
            if (value === 'custom') break
            dispatch('setTheme', {
              themeName: value,
              recompile: true,
              saveData: true,
            })
            break
          case 'themeDebug': {
            dispatch('setTheme', { recompile: true })
            break
          }
          case 'interfaceLanguage':
            messages.setLanguage(useI18nStore().i18n, value)
            useEmojiStore().loadUnicodeEmojiData(value)
            Cookies.set(
              BACKEND_LANGUAGE_COOKIE_NAME,
              localeService.internalToBackendLocaleMulti(value),
            )
            break
          case 'thirdColumnMode':
            useInterfaceStore().setLayoutWidth(undefined)
            break
        }
      }
    },
  },
}

export default config
