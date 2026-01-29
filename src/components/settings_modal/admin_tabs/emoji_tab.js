import Checkbox from 'components/checkbox/checkbox.vue'
import ConfirmModal from 'components/confirm_modal/confirm_modal.vue'
import Popover from 'components/popover/popover.vue'
import Select from 'components/select/select.vue'
import StillImage from 'components/still-image/still-image.vue'
import { assign, clone } from 'lodash'

import TabSwitcher from 'src/components/tab_switcher/tab_switcher.jsx'
import EmojiEditingPopover from '../helpers/emoji_editing_popover.vue'
import ModifiedIndicator from '../helpers/modified_indicator.vue'
import SharedComputedObject from '../helpers/shared_computed_object.js'
import StringSetting from '../helpers/string_setting.vue'

import { useInstanceStore } from 'src/stores/instance.js'
import { useInterfaceStore } from 'src/stores/interface.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faArrowsRotate,
  faDownload,
  faFolderOpen,
  faServer,
} from '@fortawesome/free-solid-svg-icons'

library.add(faArrowsRotate, faFolderOpen, faDownload, faServer)

const EmojiTab = {
  components: {
    TabSwitcher,
    StringSetting,
    Checkbox,
    StillImage,
    Select,
    Popover,
    ConfirmModal,
    ModifiedIndicator,
    EmojiEditingPopover,
  },

  data() {
    return {
      knownLocalPacks: {},
      knownRemotePacks: {},
      editedMetadata: {},
      packName: '',
      newPackName: '',
      deleteModalVisible: false,
      remotePackInstance: '',
      remotePackDownloadAs: '',

      remotePackURL: '',
      remotePackFile: null,
    }
  },

  provide() {
    return { emojiAddr: this.emojiAddr }
  },

  computed: {
    ...SharedComputedObject(),
    pack() {
      return this.packName !== '' ? this.knownPacks[this.packName] : undefined
    },
    packMeta() {
      if (this.packName === '') return {}
      if (this.editedMetadata[this.packName] === undefined) {
        this.editedMetadata[this.packName] = clone(this.pack.pack)
      }

      return this.editedMetadata[this.packName]
    },
    knownPacks() {
      // Copy the object itself but not the children, so they are still passed by reference and modified
      const result = clone(this.knownLocalPacks)
      for (const instName in this.knownRemotePacks) {
        for (const instPack in this.knownRemotePacks[instName]) {
          result[`${instPack}@${instName}`] =
            this.knownRemotePacks[instName][instPack]
        }
      }

      return result
    },
    downloadWillReplaceLocal() {
      return (
        (this.remotePackDownloadAs.trim() === '' &&
          this.pack.remote &&
          this.pack.remote.baseName in this.knownLocalPacks) ||
        this.remotePackDownloadAs in this.knownLocalPacks
      )
    },
  },

  methods: {
    reloadEmoji() {
      this.$store.state.api.backendInteractor.reloadEmoji()
    },
    importFromFS() {
      this.$store.state.api.backendInteractor.importEmojiFromFS()
    },
    emojiAddr(name) {
      if (this.pack.remote !== undefined) {
        // Remote pack
        return `${this.pack.remote.instance}/emoji/${encodeURIComponent(this.pack.remote.baseName)}/${name}`
      } else {
        return `${useInstanceStore().server}/emoji/${encodeURIComponent(this.packName)}/${name}`
      }
    },

    createEmojiPack() {
      this.$store.state.api.backendInteractor
        .createEmojiPack({ name: this.newPackName })
        .then((resp) => resp.json())
        .then((resp) => {
          if (resp === 'ok') {
            return this.refreshPackList()
          } else {
            this.displayError(resp.error)
            return Promise.reject(resp)
          }
        })
        .then(() => {
          this.packName = this.newPackName
          this.newPackName = ''
        })
    },
    deleteEmojiPack() {
      this.$store.state.api.backendInteractor
        .deleteEmojiPack({ name: this.packName })
        .then((resp) => resp.json())
        .then((resp) => {
          if (resp === 'ok') {
            return this.refreshPackList()
          } else {
            this.displayError(resp.error)
            return Promise.reject(resp)
          }
        })
        .then(() => {
          delete this.editedMetadata[this.packName]

          this.deleteModalVisible = false
          this.packName = ''
        })
    },

    metaEdited(prop) {
      if (!this.pack) return

      const def = this.pack.pack[prop] || ''
      const edited = this.packMeta[prop] || ''
      return edited !== def
    },
    savePackMetadata() {
      this.$store.state.api.backendInteractor
        .saveEmojiPackMetadata({ name: this.packName, newData: this.packMeta })
        .then((resp) => resp.json())
        .then((resp) => {
          if (resp.error !== undefined) {
            this.displayError(resp.error)
            return
          }

          // Update actual pack data
          this.pack.pack = resp
          // Delete edited pack data, should auto-update itself
          delete this.editedMetadata[this.packName]
        })
    },

    updatePackFiles(newFiles, packName) {
      this.knownPacks[packName].files = newFiles
      this.sortPackFiles(packName)
    },

    loadPacksPaginated(listFunction) {
      const pageSize = 25
      const allPacks = {}

      return listFunction({
        instance: this.remotePackInstance,
        page: 1,
        pageSize: 0,
      })
        .then((data) => data.json())
        .then((data) => {
          if (data.error !== undefined) {
            return Promise.reject(data.error)
          }

          let resultingPromise = Promise.resolve({})
          for (let i = 0; i < Math.ceil(data.count / pageSize); i++) {
            resultingPromise = resultingPromise
              .then(() =>
                listFunction({
                  instance: this.remotePackInstance,
                  page: i,
                  pageSize,
                }),
              )
              .then((data) => data.json())
              .then((pageData) => {
                if (pageData.error !== undefined) {
                  return Promise.reject(pageData.error)
                }

                assign(allPacks, pageData.packs)
              })
          }

          return resultingPromise
        })
        .then(() => allPacks)
        .catch((data) => {
          this.displayError(data)
        })
    },

    refreshPackList() {
      this.loadPacksPaginated(
        this.$store.state.api.backendInteractor.listEmojiPacks,
      ).then((allPacks) => {
        this.knownLocalPacks = allPacks
        for (const name of Object.keys(this.knownLocalPacks)) {
          this.sortPackFiles(name)
        }
      })
    },
    listRemotePacks() {
      this.loadPacksPaginated(
        this.$store.state.api.backendInteractor.listRemoteEmojiPacks,
      )
        .then((allPacks) => {
          let inst = this.remotePackInstance
          if (!inst.startsWith('http')) {
            inst = 'https://' + inst
          }
          const instUrl = new URL(inst)
          inst = instUrl.host

          for (const packName in allPacks) {
            allPacks[packName].remote = {
              baseName: packName,
              instance: instUrl.origin,
            }
          }

          this.knownRemotePacks[inst] = allPacks
          for (const pack in this.knownRemotePacks[inst]) {
            this.sortPackFiles(`${pack}@${inst}`)
          }
        })
        .catch((data) => {
          this.displayError(data)
        })
    },
    downloadRemotePack() {
      if (this.remotePackDownloadAs.trim() === '') {
        this.remotePackDownloadAs = this.pack.remote.baseName
      }

      this.$store.state.api.backendInteractor
        .downloadRemoteEmojiPack({
          instance: this.pack.remote.instance,
          packName: this.pack.remote.baseName,
          as: this.remotePackDownloadAs,
        })
        .then((data) => data.json())
        .then((resp) => {
          if (resp === 'ok') {
            return this.refreshPackList()
          } else {
            this.displayError(resp.error)
            return Promise.reject(resp)
          }
        })
        .then(() => {
          this.packName = this.remotePackDownloadAs
          this.remotePackDownloadAs = ''
        })
    },
    downloadRemoteURLPack() {
      this.$store.state.api.backendInteractor
        .downloadRemoteEmojiPackZIP({
          url: this.remotePackURL,
          packName: this.newPackName,
        })
        .then((data) => data.json())
        .then((resp) => {
          if (resp === 'ok') {
            return this.refreshPackList()
          } else {
            this.displayError(resp.error)
            return Promise.reject(resp)
          }
        })
        .then(() => {
          this.packName = this.newPackName
          this.newPackName = ''
          this.remotePackURL = ''
        })
    },
    downloadRemoteFilePack() {
      this.$store.state.api.backendInteractor
        .downloadRemoteEmojiPackZIP({
          file: this.remotePackFile[0],
          packName: this.newPackName,
        })
        .then((data) => data.json())
        .then((resp) => {
          if (resp === 'ok') {
            return this.refreshPackList()
          } else {
            this.displayError(resp.error)
            return Promise.reject(resp)
          }
        })
        .then(() => {
          this.packName = this.newPackName
          this.newPackName = ''
          this.remotePackURL = ''
        })
    },

    displayError(msg) {
      useInterfaceStore().pushGlobalNotice({
        messageKey: 'admin_dash.emoji.error',
        messageArgs: [msg],
        level: 'error',
      })
    },
    sortPackFiles(nameOfPack) {
      // Sort by key
      const sorted = Object.keys(this.knownPacks[nameOfPack].files)
        .sort()
        .reduce((acc, key) => {
          if (key.length === 0) return acc
          acc[key] = this.knownPacks[nameOfPack].files[key]
          return acc
        }, {})
      this.knownPacks[nameOfPack].files = sorted
    },
  },

  mounted() {
    this.refreshPackList()
  },
}

export default EmojiTab
