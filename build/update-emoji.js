import fs from 'node:fs'
import emojis from '@kazvmoe-infra/unicode-emoji-json/data-by-group.json' with {
  type: 'json',
}

Object.keys(emojis).forEach((k) => {
  emojis[k].forEach((e) => {
    delete e.unicode_version
    delete e.emoji_version
    delete e.skin_tone_support_unicode_version
  })
})

const res = {}
Object.keys(emojis).forEach((k) => {
  const groupId = k.replace('&', 'and').replaceAll(' ', '-').toLowerCase()
  res[groupId] = emojis[k]
})

console.info('Updating emojis...')
try {
  fs.writeFileSync('src/assets/emoji.json', JSON.stringify(res))
  console.info('Done.')
} catch (e) {
  console.error('Failed updating emoji', e)
}
