import { storage } from 'src/lib/storage.js'

export const CONFIG_MIGRATION = 1

import { v4 as uuidv4 } from 'uuid'

// for future use
/*
const simpleDeclaration = {
  store: 'server-side',
  migrationFlag: 'configMigration',
  migration(serverside, rootState) {
    serverside.setSimplePrefAndSave({ path: field, value: rootState.config[oldField ?? field] })
  }
}
*/

export const declarations = [
  {
    field: 'muteFilters',
    store: 'server-side',
    migrationFlag: 'configMigration',
    migrationNum: 1,
    description: 'Mute filters, wordfilter/regexp/etc',
    valueType: 'complex',
    migration: async (serverside, rootState) => {
      const vuexState = (await storage.getItem('vuex-lz')) ?? {}

      vuexState.config?.muteWords?.forEach((word, order) => {
        const uniqueId = uuidv4()

        serverside.setPreference({
          path: 'simple.muteFilters.' + uniqueId,
          value: {
            type: 'word',
            value: word,
            name: word,
            enabled: true,
            expires: null,
            hide: false,
            order,
          },
        })
      })
    },
  },
]
