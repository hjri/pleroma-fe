import {
  merge as _merge,
  clamp,
  clone,
  cloneDeep,
  findLastIndex,
  flatten,
  get,
  groupBy,
  isEqual,
  takeRight,
  uniqWith,
} from 'lodash'
import { defineStore } from 'pinia'
import { toRaw } from 'vue'
import { storage } from 'src/lib/storage.js'

import { defaultState as configDefaultState } from 'src/modules/default_config_state'

export const NEW_USER_DATE = new Date('2022-08-04') // date of writing this, basically

export const defaultState = {
  // do we need to update data on server?
  dirty: false,
  highlight: {
    _journal: [],
  },
  // raw data
  raw: null,
  // local cache
  cache: null,
}

export const _moveItemInArray = (array, value, movement) => {
  const oldIndex = array.indexOf(value)
  const newIndex = oldIndex + movement
  const newArray = [...array]
  // remove old
  newArray.splice(oldIndex, 1)
  // add new
  newArray.splice(clamp(newIndex, 0, newArray.length + 1), 0, value)
  return newArray
}

const _wrapData = (data, userName) => {
  return {
    ...data,
    _user: userName,
    _timestamp: Date.now(),
  }
}

const _checkValidity = (data) => data._timestamp > 0

const _verifyHighlights = (state) => {
  state.highlight = state.highlight || {}

  // Simple
  Object.entries(defaultState.highlight).forEach(([k, v]) => {
    if (typeof v === 'undefined') return
    if (typeof v === 'object') return
    console.warn(`User highlight ${k} is invalid type ${typeof v}, unsetting`)
    delete state.highlight[k]
  })
}

export const _getRecentData = (cache, live, isTest) => {
  const result = { recent: null, stale: null, needUpload: false }
  const cacheValid = _checkValidity(cache || {})
  const liveValid = _checkValidity(live || {})
  if (!liveValid && cacheValid) {
    result.needUpload = true
    console.debug(
      'Nothing valid stored on server, assuming cache to be source of truth',
    )
    result.recent = cache
    result.stale = live
  } else if (!cacheValid && liveValid) {
    console.debug(
      'Valid storage on server found, no local cache found, using live as source of truth',
    )
    result.recent = live
    result.stale = cache
  } else if (cacheValid && liveValid) {
    console.debug('Both sources have valid data, figuring things out...')
    if (live._timestamp === cache._timestamp) {
      console.debug(
        'Same timestamp on both sources, source of truth irrelevant',
      )
      result.recent = cache
      result.stale = live
    } else {
      console.debug(
        'Different timestamp, figuring out which one is more recent',
      )
      if (live._timestamp < cache._timestamp) {
        result.recent = cache
        result.stale = live
      } else {
        result.recent = live
        result.stale = cache
      }
    }
  } else {
    console.debug('Both sources are invalid, start from scratch')
    result.needUpload = true
  }

  const merge = (a, b) => {
    return {
      _user: a._user ?? b._user,
      _timestamp: a._timestamp ?? b._timestamp,
      needUpload: b.needUpload ?? a.needUpload,
      highlight: _merge(cloneDeep(a.highlight), b.highlight),
    }
  }

  result.recent = isTest
    ? result.recent
    : result.recent && merge(defaultState, result.recent)

  result.stale = isTest
    ? result.stale
    : result.stale && merge(defaultState, result.stale)

  return result
}

const _mergeJournal = (...journals) => {
  // Ignore invalid journal entries
  const allJournals = flatten(
    journals.map((j) => (Array.isArray(j) ? j : [])),
  ).filter(
    (entry) =>
      Object.hasOwn(entry, 'user') &&
      Object.hasOwn(entry, 'operation') &&
      Object.hasOwn(entry, 'args') &&
      Object.hasOwn(entry, 'timestamp'),
  )
  const grouped = groupBy(allJournals, 'user')
  const trimmedGrouped = Object.entries(grouped).map(([user, journal]) => {
    // side effect
    journal.sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1))

    return takeRight(journal)
  })
  return flatten(trimmedGrouped).sort((a, b) =>
    a.timestamp > b.timestamp ? 1 : -1,
  )
}

export const _mergeHighlights = (recent, stale) => {
  if (!stale) return recent
  if (!recent) return stale
  const { _journal: recentJournal, ...recentData } = recent
  const { _journal: staleJournal } = stale
  /** Journal entry format:
   * user: user to entry in highlight storage
   * timestamp: timestamp of the change
   * operation: operation type
   * arguments: array of arguments, depends on operation type
   *
   * currently only supported operation type is "set" which just sets the value
   * to requested one. Intended only to be used with simple preferences (boolean, number)
   */
  const resultOutput = { ...recentData }
  const Journal = _mergeJournal(staleJournal, recentJournal)
  Journal.forEach(({ user, operation, args }) => {
    if (user.startsWith('_')) {
      throw new Error(
        `journal contains entry to edit internal (starts with _) field '${user}', something is incorrect here, ignoring.`,
      )
    }
    switch (operation) {
      case 'set':
        resultOutput[user] = args[0]
        break
      case 'unset':
        delete resultOutput[user]
        break
      default:
        return console.error(`Unknown journal operation: '${operation}'`)
    }
  })
  return { ...resultOutput, _journal: Journal }
}

export const useUserHighlightStore = defineStore('user_highlight', {
  state() {
    return cloneDeep(defaultState)
  },
  actions: {
    setAndSave({ user, value }) {
      this.set({ user, value })
      this.pushHighlight()
    },
    unsetAndSave({ user }) {
      this.unset({ user })
      this.pushHighlight()
    },
    get(user) {
      const present = this.highlight[user] || {}
      return {
        user,
        type: 'disabled',
        color: '#FFFFFF',
        ...present,
      }
    },
    set({ user, value }) {
      if (user.startsWith('_')) {
        throw new Error(
          `Tried to edit internal (starts with _) field '${user}', ignoring.`,
        )
      }
      const oldValue = this.highlight[user]
      const newValue = {
        user,
        ...oldValue,
        ...value,
      }
      this.highlight[user] = newValue
      this.highlight._journal = [
        ...this.highlight._journal,
        { operation: 'set', user, args: [newValue], timestamp: Date.now() },
      ]
      this.dirty = true
    },
    unset({ user, value }) {
      if (user.startsWith('_')) {
        throw new Error(
          `Tried to edit internal (starts with _) field '${user}', ignoring.`,
        )
      }
      delete this.highlight[user]
      this.highlight._journal = [
        ...this.highlight._journal,
        { operation: 'unset', user, args: [], timestamp: Date.now() },
      ]
      this.dirty = true
    },
    updateCache({ username }) {
      this.highlight._journal = _mergeJournal(this.highlight._journal)
      this.cache = _wrapData(
        {
          highlight: toRaw(this.highlight),
        },
        username,
      )
    },
    clearSyncConfig() {
      const blankState = { ...cloneDeep(defaultState) }
      Object.keys(this).forEach((k) => {
        this[k] = blankState[k]
      })
    },
    clearJournals() {
      this.highlight._journal = []
      this.cache.highlight._journal = []
      this.raw.highlight._journal = []
      this.pushSyncConfig()
    },
    async initUserHighlight(userData) {
      const live = userData.user_highlight
      this.raw = live
      let cache = this.cache
      if (cache?._user !== userData.fqn) {
        console.warn(
          'Cache belongs to another user! reinitializing local cache!',
        )
        cache = null
      }

      let { recent, stale, needUpload } = _getRecentData(cache, live)

      const userNew = userData.created_at > NEW_USER_DATE
      let dirty = false

      const vuexState = await storage.getItem('vuex-lz')
      const { highlight } = vuexState.config
      Object.entries(highlight).forEach(([user, value]) => {
        if ((highlight[user]._migrated || 0) < 1) {
          dirty = true
          this.set({ user, value: clone(value) })
          vuexState.config.highlight[user]._migrated = 1
          console.debug(`Migrating user ${user}: ${ JSON.stringify(value) }`)
        }
      })
      storage.setItem('vuex-lz', vuexState)

      if (recent === null) {
        console.debug(
          `Data is empty, initializing for ${userNew ? 'new' : 'existing'} user`,
        )
        recent = _wrapData({
          highlight: { ...defaultState.highlight },
        })
      }

      if (!needUpload && recent && stale) {
        console.debug('Checking if data needs merging...')
        // discarding timestamps
        const { _timestamp: _0, ...recentData } = recent
        const { _timestamp: _2, ...staleData } = stale
        dirty = !isEqual(recentData, staleData)
        console.debug(`Data ${dirty ? 'needs' : "doesn't need"} merging`)
      }

      let highlights
      if (dirty) {
        console.debug('Merging the data...')
        _verifyHighlights(recent)
        _verifyHighlights(stale)
        highlights = _mergeHighlights(recent.highlight, stale.highlight)
      } else {
        highlights = recent.highlight
      }

      recent.highlight = { ...defaultState.highlight, ...highlights }

      this.dirty = dirty || needUpload
      this.cache = recent
      // set local timestamp to smaller one if we don't have any changes
      if (stale && recent && !this.dirty) {
        this.cache._timestamp = Math.min(stale._timestamp, recent._timestamp)
      }
      this.highlight = this.cache.highlight
    },
    pushHighlight({ force = false } = {}) {
      const needPush = this.dirty || force
      if (!needPush) return
      this.updateCache({ username: window.vuex.state.users.currentUser.fqn })
      const params = {
        pleroma_settings_store: { user_highlight: this.cache },
      }
      window.vuex.state.api.backendInteractor
        .updateProfileJSON({ params })
        .then((user) => {
          this.initUserHighlight(user)
          this.dirty = false
        })
    },
  },
  persist: {
    afterLoad(state) {
      return state
    },
  },
})
