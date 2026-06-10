import { cloneDeep, differenceWith, flatten, get, isEqual, set } from 'lodash'
import { defineStore } from 'pinia'

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

export const useAdminSettingsStore = defineStore('adminSettings', {
  state: () => ({
    ...cloneDeep(defaultState),
    backendInteractor: window.vuex.state.api.backendInteractor,
  }),
  actions: {
    // Configuration Stuff
    setInstanceAdminNoDbConfig() {
      this.loaded = false
      this.dbConfigEnabled = false
    },
    updateAdminSettings({ config, modifiedPaths }) {
      this.loaded = true
      this.dbConfigEnabled = true
      this.config = config
      this.modifiedPaths = modifiedPaths
    },
    updateAdminDescriptions({ descriptions }) {
      this.descriptions = descriptions
    },
    updateAdminDraft({ path, value }) {
      const [group, key, subkey] = path
      const parent = [group, key, subkey]

      set(this.draft, path, value)

      // force-updating grouped draft to trigger refresh of group settings
      if (path.length > parent.length) {
        set(this.draft, parent, cloneDeep(get(this.draft, parent)))
      }
    },
    resetAdminDraft() {
      this.draft = cloneDeep(this.config)
    },

    loadAdminStuff() {
      this.backendInteractor.fetchInstanceDBConfig().then((backendDbConfig) => {
        if (backendDbConfig.error) {
          if (backendDbConfig.error.status === 400) {
            backendDbConfig.error.json().then((errorJson) => {
              if (/configurable_from_database/.test(errorJson.error)) {
                this.setInstanceAdminNoDbConfig()
              }
            })
          }
        } else {
          this.setInstanceAdminSettings({ backendDbConfig })
        }
      })
      if (this.descriptions === null) {
        this.backendInteractor
          .fetchInstanceConfigDescriptions()
          .then((backendDescriptions) =>
            this.setInstanceAdminDescriptions({ backendDescriptions }),
          )
      }
    },
    setInstanceAdminSettings({ backendDbConfig }) {
      const config = this.config || {}
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
                if (c.tuple == null) {
                  return {
                    ...acc,
                    [c]: c,
                  }
                }
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
      this.updateAdminSettings({ config, modifiedPaths })
      this.resetAdminDraft()
    },
    setInstanceAdminDescriptions({ backendDescriptions }) {
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
      this.updateAdminDescriptions({ descriptions })
    },

    // This action takes draft state, diffs it with live config state and then pushes
    // only differences between the two. Difference detection only work up to subkey (third) level.
    pushAdminDraft() {
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
        Object.entries(this.config).map(([group, lv1data]) =>
          Object.keys(lv1data).map((key) => ({ group, key })),
        ),
      )

      // Only using group-keys where there are changes detected
      const changedGroupKeys = allGroupKeys.filter(({ group, key }) => {
        return !isEqual(this.config[group][key], this.draft[group][key])
      })

      // Here we take all changed group-keys and get all changed subkeys
      const changed = changedGroupKeys.map(({ group, key }) => {
        const config = this.config[group][key]
        const draft = this.draft[group][key]

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

      window.vuex.state.api.backendInteractor
        .pushInstanceDBConfig({
          payload: {
            configs: changed,
          },
        })
        .then(() =>
          window.vuex.state.api.backendInteractor.fetchInstanceDBConfig(),
        )
        .then((backendDbConfig) =>
          this.setInstanceAdminSettings({ backendDbConfig }),
        )
    },
    pushAdminSetting({ path, value }) {
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

      window.vuex.state.api.backendInteractor
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
        .then(() =>
          window.vuex.state.api.backendInteractor.fetchInstanceDBConfig(),
        )
        .then((backendDbConfig) =>
          this.setInstanceAdminSettings({ backendDbConfig }),
        )
    },
    resetAdminSetting({ path }) {
      const [group, key, subkey] = Array.isArray(path)
        ? path
        : path.split(/\./g)

      this.modifiedPaths.delete(path)

      return window.vuex.state.api.backendInteractor
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
        .then(() =>
          window.vuex.state.api.backendInteractor.fetchInstanceDBConfig(),
        )
        .then((backendDbConfig) =>
          this.setInstanceAdminSettings({ backendDbConfig }),
        )
    },

    // Frontends Stuff
    loadFrontendsStuff() {
      this.backendInteractor
        .fetchAvailableFrontends()
        .then((frontends) => this.setAvailableFrontends({ frontends }))
    },

    setAvailableFrontends({ frontends }) {
      this.frontends = frontends.map((f) => {
        f.installedRefs = f.installed_refs
        if (f.name === 'pleroma-fe') {
          f.refs = ['master', 'develop']
        } else {
          f.refs = [f.ref]
        }
        return f
      })
    },

    // Statuses stuff
    listStatuses({ userId, opts }) {
      return this.backendInteractor.adminListStatuses({
        userId,
        opts,
      })
    },
    changeStatusScope({ opts }) {
      return this.backendInteractor.adminChangeStatusScope({
        opts,
      })
    },

    // Users stuff
    async fetchUsers(opts) {
      const adminData = await this.backendInteractor.adminListUsers({
        opts,
      })

      adminData.users = await Promise.all(
        adminData.users.map(
          async (userAdminData) =>
            await window.vuex.dispatch('updateUserAdminData', {
              userAdminData,
            }),
        ),
      )

      return adminData
    },
    async getUserData({ user }) {
      const api = this.backendInteractor.adminGetUserData
      const { screen_name } = user

      const result = await api({ screen_name })
      window.vuex.commit('updateUserAdminData', { user: result })
    },
    async deleteUsers({ users }) {
      const screen_names = users.map((u) => u.screen_name)
      const api = this.backendInteractor.adminDeleteAccounts

      const resultUserIds = await api({ screen_names })

      resultUserIds.forEach((userId) => {
        window.vuex.dispatch(
          'markStatusesAsDeleted',
          (status) => userId === status.user.id,
        )
        // TODO when migrated to pinia, also remove user
      })

      return resultUserIds
    },
    resendConfirmationEmail({ users }) {
      const screen_names = users.map((u) => u.screen_name)

      return this.backendInteractor.adminResendConfirmationEmail({
        screen_names,
      })
    },
    requirePasswordChange({ users }) {
      const screen_names = users.map((u) => u.screen_name)

      return this.backendInteractor.adminRequirePasswordChange({
        screen_names,
      })
    },
    // Singular only!
    disableMFA({ user }) {
      const { screen_name } = user

      return this.backendInteractor.adminDisableMFA({ screen_name })
    },
    async setUsersTags({ users, tags, value }) {
      const screen_names = users.map((u) => u.screen_name)
      const api = this.backendInteractor.adminSetUsersTags

      await api({
        screen_names,
        tags,
        value,
      })

      users.forEach((user) => {
        this.getUserData({ user })
      })
    },
    async setUsersRight({ users, right, value }) {
      const screen_names = users.map((u) => u.screen_name)
      const api = this.backendInteractor.adminSetUsersRight

      await api({
        screen_names,
        right,
        value,
      })

      users.forEach((user) => {
        window.vuex.commit('updateRight', { user, right, value })
      })
    },
    async setUsersActivationStatus({ users, value }) {
      const screen_names = users.map((u) => u.screen_name)
      const api = this.backendInteractor.adminSetUsersActivationStatus

      const resultUsers = await api({
        screen_names,
        value,
      })

      resultUsers.forEach((user) => {
        window.vuex.commit('updateUserAdminData', { user })
      })
    },
    async setUsersSuggestionStatus({ users, value }) {
      const screen_names = users.map((u) => u.screen_name)
      const api = this.backendInteractor.adminSetUsersSuggestionStatus

      const resultUsers = await api({
        screen_names,
        value,
      })

      resultUsers.forEach((user) => {
        window.vuex.commit('updateUserAdminData', { user })
      })
    },
    async setUsersConfirmationStatus({ users }) {
      const screen_names = users.map((u) => u.screen_name)
      const api = this.backendInteractor.adminSetUsersConfirmationStatus

      await api({ screen_names })

      users.forEach((user) => {
        this.getUserData({ user })
      })
    },
    async setUsersApprovalStatus({ users }) {
      const screen_names = users.map((u) => u.screen_name)
      const api = this.backendInteractor.adminSetUsersApprovalStatus

      const resultUsers = await api({
        screen_names,
      })

      resultUsers.forEach((user) => {
        window.vuex.commit('updateUserAdminData', { user })
      })
    },
  },
})
