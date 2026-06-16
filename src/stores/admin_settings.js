import { cloneDeep, differenceWith, flatten, get, isEqual, set } from 'lodash'
import { defineStore } from 'pinia'

import { useCredentialsStore } from 'src/stores/credentials.js'

import {
  addNewEmojiFile,
  changeStatusScope,
  createEmojiPack,
  deleteAccounts,
  deleteEmojiPack,
  disableMFA,
  downloadRemoteEmojiPack,
  downloadRemoteEmojiPackZIP,
  getAvailableFrontends,
  getInstanceConfigDescriptions,
  getInstanceDBConfig,
  getUserData,
  importEmojiFromFS,
  installFrontend,
  listRemoteEmojiPacks,
  listStatuses,
  listUsers,
  pushInstanceDBConfig,
  reloadEmoji,
  requirePasswordChange,
  resendConfirmationEmail,
  setUsersActivationStatus,
  setUsersApprovalStatus,
  setUsersConfirmationStatus,
  setUsersRight,
  setUsersSuggestionStatus,
  setUsersTags,
} from 'src/services/api/admin.js'
import { listEmojiPacks } from 'src/services/api/api.service.js'
import { parseStatus } from 'src/services/entity_normalizer/entity_normalizer.service.js'

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
      getInstanceDBConfig({
        credentials: useCredentialsStore().current,
      }).then((backendDbConfig) => {
        if (backendDbConfig.error) {
          if (backendDbConfig.error.status === 400) {
            backendDbConfig.error.json().then((errorJson) => {
              if (/configurable_from_database/.test(errorJson.error)) {
                this.setInstanceAdminNoDbConfig()
              }
            })
          }
        } else {
          this.setInstanceAdminSettings({
            credentials: useCredentialsStore().current,
            backendDbConfig,
          })
        }
      })
      if (this.descriptions === null) {
        getInstanceConfigDescriptions({
          credentials: useCredentialsStore().current,
        }).then((backendDescriptions) =>
          this.setInstanceAdminDescriptions({
            credentials: useCredentialsStore().current,
            backendDescriptions,
          }),
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

      pushInstanceDBConfig({
        credentials: useCredentialsStore().current,
        payload: {
          configs: changed,
        },
      })
        .then(() =>
          getInstanceDBConfig({
            credentials: useCredentialsStore().current,
          }),
        )
        .then((backendDbConfig) =>
          this.setInstanceAdminSettings({
            credentials: useCredentialsStore().current,

            backendDbConfig,
          }),
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

      pushInstanceDBConfig({
        credentials: useCredentialsStore().current,
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
          getInstanceDBConfig({
            credentials: useCredentialsStore().current,
          }),
        )
        .then((backendDbConfig) =>
          this.setInstanceAdminSettings({
            credentials: useCredentialsStore().current,
            backendDbConfig,
          }),
        )
    },
    resetAdminSetting({ path }) {
      const [group, key, subkey] = Array.isArray(path)
        ? path
        : path.split(/\./g)

      this.modifiedPaths.delete(path)

      return pushInstanceDBConfig({
        credentials: useCredentialsStore().current,
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
          getInstanceDBConfig({
            credentials: useCredentialsStore().current,
          }),
        )
        .then((backendDbConfig) =>
          this.setInstanceAdminSettings({ backendDbConfig }),
        )
    },

    // Frontends Stuff
    loadFrontendsStuff() {
      getAvailableFrontends({
        credentials: useCredentialsStore().current,
      }).then((frontends) => this.setAvailableFrontends({ frontends }))
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

    installFrontend() {
      return installFrontend({
        credentials: useCredentialsStore().current,
      })
    },

    // Statuses stuff
    async fetchStatuses(opts) {
      const { total, activities } = await listStatuses({
        credentials: useCredentialsStore().current,
        opts,
      })

      const statuses = activities.map(parseStatus)

      await window.vuex.dispatch('addNewStatuses', { statuses })

      return {
        items: statuses,
        count: total,
      }
    },
    async changeStatusScope(opts) {
      const raw = await changeStatusScope({
        credentials: useCredentialsStore().current,
        opts,
      })
      const status = parseStatus(raw)

      await window.vuex.dispatch('addNewStatuses', { statuses: [status] })
    },

    // Users stuff
    async fetchUsers(opts) {
      const { users, count } = await listUsers({
        credentials: useCredentialsStore().current,

        opts,
      })

      return {
        items: await Promise.all(
          users.map(
            async (userAdminData) =>
              await window.vuex.dispatch('updateUserAdminData', {
                userAdminData,
              }),
          ),
        ),
        count,
      }
    },
    async getUserData({ user }) {
      const api = getUserData
      const { screen_name } = user

      const result = await api({
        credentials: useCredentialsStore().current,
        screen_name,
      })
      window.vuex.commit('updateUserAdminData', { user: result })
    },
    async deleteUsers({ users }) {
      const screen_names = users.map((u) => u.screen_name)
      const api = deleteAccounts

      const resultUserIds = await api({
        credentials: useCredentialsStore().current,
        screen_names,
      })

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

      return resendConfirmationEmail({
        credentials: useCredentialsStore().current,
        screen_names,
      })
    },
    requirePasswordChange({ users }) {
      const screen_names = users.map((u) => u.screen_name)

      return requirePasswordChange({
        credentials: useCredentialsStore().current,
        screen_names,
      })
    },
    // Singular only!
    disableMFA({ user }) {
      const { screen_name } = user

      return disableMFA({
        credentials: useCredentialsStore().current,
        screen_name,
      })
    },
    async setUsersTags({ users, tags, value }) {
      const screen_names = users.map((u) => u.screen_name)
      const api = setUsersTags

      await api({
        credentials: useCredentialsStore().current,
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
      const api = setUsersRight

      await api({
        credentials: useCredentialsStore().current,
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
      const api = setUsersActivationStatus

      const resultUsers = await api({
        credentials: useCredentialsStore().current,
        screen_names,
        value,
      })

      resultUsers.forEach((user) => {
        window.vuex.commit('updateUserAdminData', { user })
      })
    },
    async setUsersSuggestionStatus({ users, value }) {
      const screen_names = users.map((u) => u.screen_name)
      const api = setUsersSuggestionStatus

      const resultUsers = await api({
        credentials: useCredentialsStore().current,
        screen_names,
        value,
      })

      resultUsers.forEach((user) => {
        window.vuex.commit('updateUserAdminData', { user })
      })
    },
    async setUsersConfirmationStatus({ users }) {
      const screen_names = users.map((u) => u.screen_name)
      const api = setUsersConfirmationStatus

      await api({
        credentials: useCredentialsStore().current,
        screen_names,
      })

      users.forEach((user) => {
        this.getUserData({ user })
      })
    },
    async setUsersApprovalStatus({ users }) {
      const screen_names = users.map((u) => u.screen_name)
      const api = setUsersApprovalStatus

      const resultUsers = await api({
        credentials: useCredentialsStore().current,
        screen_names,
      })

      resultUsers.forEach((user) => {
        window.vuex.commit('updateUserAdminData', { user })
      })
    },
    reloadEmoji() {
      return reloadEmoji({ credentials: useCredentialsStore().current })
    },
    importEmojiFromFS() {
      return importEmojiFromFS({ credentials: useCredentialsStore().current })
    },
    listEmojiPacks(params) {
      return listEmojiPacks({
        ...params,
        credentials: useCredentialsStore().current
      })
    },
    listRemoteEmojiPacks(params) {
      return listRemoteEmojiPacks({
        ...params,
        credentials: useCredentialsStore().current,
      })
    },
    addNewEmojiFile({ packName, file, shortcode, filename }) {
      return addNewEmojiFile({
        packName,
        file,
        shortcode,
        filename,
        credentials: useCredentialsStore().current,
      })
    },
    downloadRemoteEmojiPack({ instance, packName, as }) {
      return downloadRemoteEmojiPack({
        instance,
        packName,
        as,
        credentials: useCredentialsStore().current,
      })
    },
    downloadRemoteEmojiPackZIP({ url, packName }) {
      return downloadRemoteEmojiPackZIP({
        url,
        packName,
        credentials: useCredentialsStore().current,
      })
    },
    createEmojiPack({ name }) {
      return createEmojiPack({
        name,
        credentials: useCredentialsStore().current,
      })
    },
    deleteEmojiPack({ name }) {
      return createEmojiPack({
        name,
        credentials: useCredentialsStore().current,
      })
    },
    saveEmojiPackMetadata({ name, newData }) {
      return createEmojiPack({
        name,
        newData,
        credentials: useCredentialsStore().current,
      })
    },
  },
})
