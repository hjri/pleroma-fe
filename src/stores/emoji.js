import { defineStore } from 'pinia'

import { ensureFinalFallback } from 'src/i18n/languages.js'
import { useInstanceStore } from 'src/stores/instance.js'

import { annotationsLoader } from 'virtual:pleroma-fe/emoji-annotations'

const defaultState = {
  // Custom emoji from server
  customEmoji: [],
  customEmojiFetched: false,

  // Unicode emoji from bundle
  emoji: {},
  emojiFetched: false,
  unicodeEmojiAnnotations: {},

  // Stickers
  stickers: null
}

const SORTED_EMOJI_GROUP_IDS = [
  'smileys-and-emotion',
  'people-and-body',
  'animals-and-nature',
  'food-and-drink',
  'travel-and-places',
  'activities',
  'objects',
  'symbols',
  'flags',
]

const REGIONAL_INDICATORS = (() => {
  const start = 0x1f1e6
  const end = 0x1f1ff
  const A = 'A'.codePointAt(0)
  const res = new Array(end - start + 1)
  for (let i = start; i <= end; ++i) {
    const letter = String.fromCodePoint(A + i - start)
    res[i - start] = {
      replacement: String.fromCodePoint(i),
      imageUrl: false,
      displayText: 'regional_indicator_' + letter,
      displayTextI18n: {
        key: 'emoji.regional_indicator',
        args: { letter },
      },
    }
  }
  return res
})()

const loadAnnotations = (lang) => {
  return annotationsLoader[lang]().then((k) => k.default)
}

const injectAnnotations = (emoji, annotations) => {
  const availableLangs = Object.keys(annotations)

  return {
    ...emoji,
    annotations: availableLangs.reduce((acc, cur) => {
      acc[cur] = annotations[cur][emoji.replacement]
      return acc
    }, {}),
  }
}

const injectRegionalIndicators = (groups) => {
  groups.symbols.push(...REGIONAL_INDICATORS)
  return groups
}

export const useEmojiStore = defineStore('emoji', {
  state: () => ({ ...defaultState }),
  getters: {
    groupedCustomEmojis(state) {
      const packsOf = (emoji) => {
        const packs = emoji.tags
          .filter((k) => k.startsWith('pack:'))
          .map((k) => {
            const packName = k.slice(5) // remove 'pack:' prefix
            return {
              id: `custom-${packName}`,
              text: packName,
            }
          })

        if (!packs.length) {
          return [
            {
              id: 'unpacked',
            },
          ]
        } else {
          return packs
        }
      }

      return this.customEmoji.reduce((res, emoji) => {
        packsOf(emoji).forEach(({ id: packId, text: packName }) => {
          if (!res[packId]) {
            res[packId] = {
              id: packId,
              text: packName,
              image: emoji.imageUrl,
              emojis: [],
            }
          }
          res[packId].emojis.push(emoji)
        })
        return res
      }, {})
    },
    standardEmojiList(state) {
      return SORTED_EMOJI_GROUP_IDS.map((groupId) =>
        (this.emoji[groupId] || []).map((k) =>
          injectAnnotations(k, this.unicodeEmojiAnnotations),
        ),
      ).reduce((a, b) => a.concat(b), [])
    },
    standardEmojiGroupList(state) {
      return SORTED_EMOJI_GROUP_IDS.map((groupId) => ({
        id: groupId,
        emojis: (this.emoji[groupId] || []).map((k) =>
          injectAnnotations(k, this.unicodeEmojiAnnotations),
        ),
      }))
    },
  },
  actions: {
    setStickers (stickers) {
      this.stickers = stickers
    },
    async getStaticEmoji() {
      try {
        // See build/emojis_plugin for more details
        const values = (await import('/src/assets/emoji.json')).default

        const emoji = Object.keys(values).reduce((res, groupId) => {
          res[groupId] = values[groupId].map((e) => ({
            displayText: e.slug,
            imageUrl: false,
            replacement: e.emoji,
          }))
          return res
        }, {})
        this.emoji = injectRegionalIndicators(emoji)
      } catch (e) {
        console.warn("Can't load static emoji\n", e)
      }
    },

    loadUnicodeEmojiData(language) {
      const langList = ensureFinalFallback(language)

      return Promise.all(
        langList.map(async (lang) => {
          if (!this.unicodeEmojiAnnotations[lang]) {
            try {
              const annotations = await loadAnnotations(lang)
              this.unicodeEmojiAnnotations[lang] = annotations
            } catch (e) {
              console.warn(
                `Error loading unicode emoji annotations for ${lang}: `,
                e,
              )
              // ignore
            }
          }
        }),
      )
    },

    async getCustomEmoji() {
      try {
        let res = await window.fetch('/api/v1/pleroma/emoji')
        if (!res.ok) {
          res = await window.fetch('/api/pleroma/emoji.json')
        }
        if (res.ok) {
          const result = await res.json()
          const values = Array.isArray(result)
            ? Object.assign({}, ...result)
            : result
          const caseInsensitiveStrCmp = (a, b) => {
            const la = a.toLowerCase()
            const lb = b.toLowerCase()
            return la > lb ? 1 : la < lb ? -1 : 0
          }
          const noPackLast = (a, b) => {
            const aNull = a === ''
            const bNull = b === ''
            if (aNull === bNull) {
              return 0
            } else if (aNull && !bNull) {
              return 1
            } else {
              return -1
            }
          }
          const byPackThenByName = (a, b) => {
            const packOf = (emoji) =>
              (emoji.tags.filter((k) => k.startsWith('pack:'))[0] || '').slice(
                5,
              )
            const packOfA = packOf(a)
            const packOfB = packOf(b)
            return (
              noPackLast(packOfA, packOfB) ||
              caseInsensitiveStrCmp(packOfA, packOfB) ||
              caseInsensitiveStrCmp(a.displayText, b.displayText)
            )
          }

          const emoji = Object.entries(values)
            .map(([key, value]) => {
              const imageUrl = value.image_url
              return {
                displayText: key,
                imageUrl: imageUrl
                  ? useInstanceStore().server + imageUrl
                  : value,
                tags: imageUrl
                  ? value.tags.sort((a, b) => (a > b ? 1 : 0))
                  : ['utf'],
                replacement: `:${key}: `,
              }
              // Technically could use tags but those are kinda useless right now,
              // should have been "pack" field, that would be more useful
            })
            .sort(byPackThenByName)
          this.customEmoji = emoji
        } else {
          throw res
        }
      } catch (e) {
        console.warn("Can't load custom emojis\n", e)
      }
    },
    fetchEmoji() {
      if (!this.customEmojiFetched) {
        this.getCustomEmoji().then(() => (this.customEmojiFetched = true))
      }
      if (!this.emojiFetched) {
        this.getStaticEmoji().then(() => (this.emojiFetched = true))
      }
    },
  },
})
