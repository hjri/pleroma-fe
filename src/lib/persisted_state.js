import merge from 'lodash.merge'
import { each, get, set, cloneDeep } from 'lodash'
import { useInterfaceStore } from 'src/stores/interface'
import { storage } from './storage.js'

let loaded = false

const defaultReducer = (state, paths) => (
  paths.length === 0
    ? state
    : paths.reduce((substate, path) => {
      set(substate, path, get(state, path))
      return substate
    }, {})
)

const saveImmedeatelyActions = [
  'markNotificationsAsSeen',
  'clearCurrentUser',
  'setCurrentUser',
  'setHighlight',
  'setOption',
  'setClientData',
  'setToken',
  'clearToken'
]

const defaultStorage = (() => {
  return storage
})()

export default function createPersistedState ({
  key = 'vuex-lz',
  paths = [],
  getState = (key, storage) => {
    const value = storage.getItem(key)
    return value
  },
  setState = (key, state, storage) => {
    if (!loaded) {
      console.info('waiting for old state to be loaded...')
      return Promise.resolve()
    } else {
      return storage.setItem(key, state)
    }
  },
  reducer = defaultReducer,
  storage = defaultStorage,
  subscriber = store => handler => store.subscribe(handler)
} = {}) {
  return getState(key, storage).then((savedState) => {
    return store => {
      try {
        if (savedState !== null && typeof savedState === 'object') {
          // build user cache
          const usersState = savedState.users || {}
          usersState.usersObject = {}
          const users = usersState.users || []
          each(users, (user) => { usersState.usersObject[user.id] = user })
          savedState.users = usersState

          store.replaceState(
            merge({}, store.state, savedState)
          )
        }
        loaded = true
      } catch (e) {
        console.error("Couldn't load state")
        console.error(e)
        loaded = true
      }
      subscriber(store)((mutation, state) => {
        try {
          if (saveImmedeatelyActions.includes(mutation.type)) {
            setState(key, reducer(cloneDeep(state), paths), storage)
              .then(success => {
                if (typeof success !== 'undefined') {
                  if (mutation.type === 'setOption' || mutation.type === 'setCurrentUser') {
                    useInterfaceStore().settingsSaved({ success })
                  }
                }
              }, error => {
                if (mutation.type === 'setOption' || mutation.type === 'setCurrentUser') {
                  useInterfaceStore().settingsSaved({ error })
                }
              })
          }
        } catch (e) {
          console.error("Couldn't persist state:")
          console.error(e)
        }
      })
    }
  })
}

/**
 * This persists state for pinia, which falls back to read from the vuex state
 * if pinia persisted state does not exist.
 *
 * When you migrate a module from vuex to pinia, you have to keep the original name.
 * If the module was called `xxx`, the name of the store has to be `xxx` too.
 *
 * This adds one property to the store, $persistLoaded, which is a promise
 * that resolves when the initial state is loaded. If the plugin is not enabled,
 * $persistLoaded is a promise that resolves immediately.
 * If we are not able to get the stored state because storage.getItem() throws or
 * rejects, $persistLoaded will be a rejected promise with the thrown error.
 *
 * Call signature:
 *
 * defineStore(name, {
 *   ...,
 *   // setting the `persist` property enables this plugin
 *   // IMPORTANT: by default it is disabled, you have to set `persist` to at least an empty object
 *   persist: {
 *     // set to list of individual paths, or undefined/unset to persist everything
 *     paths: [],
 *     // function to call after loading initial state
 *     // if afterLoad is a function, it must return a state object that will be sent to `store.$patch`, or a promise to the state object
 *     // by default afterLoad is undefined
 *     afterLoad: (originalState) => {
 *       // ...
 *       return modifiedState
 *     },
 *     // if it exists, only persist state after these actions
 *     // if it doesn't exist or is undefined, persist state after every mutation of the state
 *     saveImmediatelyActions: [],
 *     // what to do after successfully saving the state
 *     onSaveSuccess: () => {},
 *     // what to do after there is an error saving the state
 *     onSaveError: () => {}
 *   }
 * })
 *
 */
export const piniaPersistPlugin = ({
  vuexKey = 'vuex-lz',
  keyFunction = (id) => `pinia-local-${id}`,
  storage = defaultStorage,
  reducer = defaultReducer
} = {}) => ({ store, options }) => {
  if (!options.persist) {
    return {
      $persistLoaded: Promise.resolve()
    }
  }

  let resolveLoaded
  let rejectLoaded
  const loadedPromise = new Promise((resolve, reject) => {
    resolveLoaded = resolve
    rejectLoaded = reject
  })

  const {
    afterLoad,
    paths = [],
    saveImmediatelyActions,
    onSaveSuccess = () => {},
    onSaveError = () => {}
  } = options.persist || {}

  const loadedGuard = { loaded: false }
  const key = keyFunction(store.$id)
  const getState = async () => {
    const id = store.$id
    const value = await storage.getItem(key)
    if (value) {
      return value
    }

    const fallbackValue = await storage.getItem(vuexKey)
    if (fallbackValue && fallbackValue[id]) {
      console.info(`Migrating ${id} store data from vuex to pinia`)
      const res = fallbackValue[id]
      await storage.setItem(key, res)
      return res
    }

    return {}
  }

  const setState = (state) => {
    if (!loadedGuard.loaded) {
      console.info('waiting for old state to be loaded...')
      return Promise.reject()
    } else {
      return storage.setItem(key, state)
    }
  }

  const getMaybeAugmentedState = async () => {
    const savedRawState = await getState()
    if (typeof afterLoad === 'function') {
      try {
        return await afterLoad(savedRawState)
      } catch (e) {
        console.error('Error running afterLoad:', e)
        return savedRawState
      }
    } else {
      return savedRawState
    }
  }

  const persistCurrentState = async (state) => {
    const stateClone = cloneDeep(state)
    const stateToPersist = reducer(stateClone, paths)
    try {
      const res = await setState(stateToPersist)
      onSaveSuccess(res)
    } catch (e) {
      console.error('Cannot persist state:', e)
      onSaveError(e)
    }
  }

  getMaybeAugmentedState()
    .then(savedState => {
      if (savedState) {
        store.$patch(savedState)
      }

      loadedGuard.loaded = true
      resolveLoaded()

      // only subscribe after we have done setting the initial state
      if (!saveImmediatelyActions) {
        store.$subscribe(async (_mutation, state) => {
          await persistCurrentState(state)
        })
      } else {
        store.$onAction(({
          name,
          store,
          after,
        }) => {
          if (saveImmediatelyActions.includes(name)) {
            after(() => persistCurrentState(store.$state))
          }
        })
      }
    }, error => {
      console.error('Cannot load storage:', error)
      rejectLoaded(error)
    })

  return {
    $persistLoaded: loadedPromise
  }
}
