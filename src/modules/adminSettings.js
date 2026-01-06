import { cloneDeep, differenceWith, flatten, get, isEqual, set } from 'lodash'

export const defaultState = {
  frontends: [],
  loaded: false,
  needsReboot: null,
  config: null,
  modifiedPaths: null,
  descriptions: null,
  draft: null,
  dbConfigEnabled: null,
}

export const newUserFlags = {
  ...defaultState.flagStorage,
}

const adminSettingsStorage = {
  state: {
    ...cloneDeep(defaultState),
  },
  mutations: {
    setInstanceAdminNoDbConfig(state) {
      state.loaded = false
      state.dbConfigEnabled = false
    },
    setAvailableFrontends(state, { frontends }) {
      state.frontends = frontends.map((f) => {
        f.installedRefs = f.installed_refs
        if (f.name === 'pleroma-fe') {
          f.refs = ['master', 'develop']
        } else {
          f.refs = [f.ref]
        }
        return f
      })
    },
    updateAdminSettings(state, { config, modifiedPaths }) {
      state.loaded = true
      state.dbConfigEnabled = true
      state.config = config
      state.modifiedPaths = modifiedPaths
    },
    updateAdminDescriptions(state, { descriptions }) {
      state.descriptions = descriptions
    },
    updateAdminDraft(state, { path, value }) {
      const [group, key, subkey] = path
      const parent = [group, key, subkey]

      set(state.draft, path, value)

      // force-updating grouped draft to trigger refresh of group settings
      if (path.length > parent.length) {
        set(state.draft, parent, cloneDeep(get(state.draft, parent)))
      }
    },
    resetAdminDraft(state) {
      state.draft = cloneDeep(state.config)
    },
  },
  actions: {
    loadFrontendsStuff({ rootState, commit }) {
      rootState.api.backendInteractor
        .fetchAvailableFrontends()
        .then((frontends) => commit('setAvailableFrontends', { frontends }))
    },
    loadAdminStuff({ state, rootState, dispatch, commit }) {
      rootState.api.backendInteractor
        .fetchInstanceDBConfig()
        .then((backendDbConfig) => {
          if (backendDbConfig.error) {
            if (backendDbConfig.error.status === 400) {
              backendDbConfig.error.json().then((errorJson) => {
                if (/configurable_from_database/.test(errorJson.error)) {
                  commit('setInstanceAdminNoDbConfig')
                }
              })
            }
          } else {
            dispatch('setInstanceAdminSettings', { backendDbConfig })
          }
        })
      if (state.descriptions === null) {
        rootState.api.backendInteractor
          .fetchInstanceConfigDescriptions()
          .then((backendDescriptions) =>
            dispatch('setInstanceAdminDescriptions', { backendDescriptions }),
          )
      }
    },
    setInstanceAdminSettings({ state, commit }, { backendDbConfig }) {
      const config = state.config || {}
      const modifiedPaths = new Set()

      backendDbConfig.configs.forEach((c) => {
        const path = [c.group, c.key]
        if (c.db) {
          // Path elements can contain dot, therefore we use ' -> ' as a separator instead
          // Using strings for modified paths for easier searching
          c.db.forEach((x) => modifiedPaths.add([...path, x].join(' -> ')))
        }

        // we need to preserve tuples on second level only, possibly third
        // but it's not a case right now.
        const convert = (value, preserveTuples, preserveTuplesLv2) => {
          if (Array.isArray(value) && value.length > 0 && value[0].tuple) {
            if (!preserveTuples) {
              return value.reduce((acc, c) => {
                return {
                  ...acc,
                  [c.tuple[0]]: convert(c.tuple[1], preserveTuplesLv2),
                }
              }, {})
            } else {
              return value.map((x) => x.tuple)
            }
          } else {
            if (!preserveTuples) {
              return value
            } else {
              return value.tuple
            }
          }
        }
        // for most stuff we want maps since those are more convenient
        // however this doesn't allow for multiple values per same key
        // so for those cases we want to preserve tuples as-is
        // right now it's made exclusively for :pleroma.:rate_limit
        // so it might not work properly elsewhere
        const preserveTuples = path.find((x) => x === ':rate_limit')
        set(config, path, convert(c.value, false, preserveTuples))
      })
      // patching http adapter config to be easier to handle
      const adapter = config[':pleroma'][':http'][':adapter']
      if (Array.isArray(adapter)) {
        config[':pleroma'][':http'][':adapter'] = {
          [':ssl_options']: {
            [':versions']: [],
          },
        }
      }
      commit('updateAdminSettings', { config, modifiedPaths })
      commit('resetAdminDraft')
    },
    setInstanceAdminDescriptions({ commit }, { backendDescriptions }) {
      const convert = (
        { children, description, label, key = '<ROOT>', group, suggestions },
        path,
        acc,
      ) => {
        const newPath = group ? [group, key] : [key]
        const obj = { description, label, suggestions }
        if (Array.isArray(children)) {
          children.forEach((c) => {
            convert(c, newPath, obj)
          })
        }
        set(acc, newPath, obj)
      }

      const descriptions = {}

      backendDescriptions.forEach((d) => convert(d, '', descriptions))
      commit('updateAdminDescriptions', { descriptions })
    },

    // This action takes draft state, diffs it with live config state and then pushes
    // only differences between the two. Difference detection only work up to subkey (third) level.
    pushAdminDraft({ rootState, state, dispatch }) {
      // TODO cleanup paths in modifiedPaths
      const convert = (value) => {
        if (typeof value !== 'object') {
          return value
        } else if (Array.isArray(value)) {
          return value.map(convert)
        } else {
          return Object.entries(value).map(([k, v]) => ({ tuple: [k, v] }))
        }
      }

      // Getting all group-keys used in config
      const allGroupKeys = flatten(
        Object.entries(state.config).map(([group, lv1data]) =>
          Object.keys(lv1data).map((key) => ({ group, key })),
        ),
      )

      // Only using group-keys where there are changes detected
      const changedGroupKeys = allGroupKeys.filter(({ group, key }) => {
        return !isEqual(state.config[group][key], state.draft[group][key])
      })

      // Here we take all changed group-keys and get all changed subkeys
      const changed = changedGroupKeys.map(({ group, key }) => {
        const config = state.config[group][key]
        const draft = state.draft[group][key]

        // We convert group-key value into entries arrays
        const eConfig = Object.entries(config)
        const eDraft = Object.entries(draft)

        // Then those entries array we diff so only changed subkey entries remain
        // We use the diffed array to reconstruct the object and then shove it into convert()
        return {
          group,
          key,
          value: convert(
            Object.fromEntries(differenceWith(eDraft, eConfig, isEqual)),
          ),
        }
      })

      rootState.api.backendInteractor
        .pushInstanceDBConfig({
          payload: {
            configs: changed,
          },
        })
        .then(() => rootState.api.backendInteractor.fetchInstanceDBConfig())
        .then((backendDbConfig) =>
          dispatch('setInstanceAdminSettings', { backendDbConfig }),
        )
    },
    pushAdminSetting({ rootState, dispatch }, { path, value }) {
      const [group, key, ...rest] = Array.isArray(path)
        ? path
        : path.split(/\./g)
      const clone = {} // not actually cloning the entire thing to avoid excessive writes
      set(clone, rest, value)

      // TODO cleanup paths in modifiedPaths
      const convert = (value) => {
        if (typeof value !== 'object') {
          return value
        } else if (Array.isArray(value)) {
          return value.map(convert)
        } else {
          return Object.entries(value).map(([k, v]) => ({ tuple: [k, v] }))
        }
      }

      rootState.api.backendInteractor
        .pushInstanceDBConfig({
          payload: {
            configs: [
              {
                group,
                key,
                value: convert(clone),
              },
            ],
          },
        })
        .then(() => rootState.api.backendInteractor.fetchInstanceDBConfig())
        .then((backendDbConfig) =>
          dispatch('setInstanceAdminSettings', { backendDbConfig }),
        )
    },
    resetAdminSetting({ rootState, state, dispatch }, { path }) {
      const [group, key, subkey] = Array.isArray(path)
        ? path
        : path.split(/\./g)

      state.modifiedPaths.delete(path)

      return rootState.api.backendInteractor
        .pushInstanceDBConfig({
          payload: {
            configs: [
              {
                group,
                key,
                delete: true,
                subkeys: [subkey],
              },
            ],
          },
        })
        .then(() => rootState.api.backendInteractor.fetchInstanceDBConfig())
        .then((backendDbConfig) =>
          dispatch('setInstanceAdminSettings', { backendDbConfig }),
        )
    },
  },
}

export default adminSettingsStorage
