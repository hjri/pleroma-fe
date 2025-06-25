import { mapState } from 'pinia'

import ConfirmModal from 'src/components/confirm_modal/confirm_modal.vue'
import ActionButtonContainer from './action_button_container.vue'
import Popover from 'src/components/popover/popover.vue'
import genRandomSeed from 'src/services/random_seed/random_seed.service.js'

import { useServerSideStorageStore } from 'src/stores/serverSideStorage'

import { BUTTONS } from './buttons_definitions.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faEllipsisH
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faEllipsisH
)

const StatusActionButtons = {
  props: ['status', 'replying'],
  emits: ['toggleReplying', 'interacted'],
  data () {
    return {
      showPin: false,
      showingConfirmDialog: false,
      currentConfirmTitle: '',
      currentConfirmOkText: '',
      currentConfirmCancelText: '',
      currentConfirmAction: () => {},
      randomSeed: genRandomSeed()
    }
  },
  components: {
    Popover,
    ConfirmModal,
    ActionButtonContainer
  },
  computed: {
    ...mapState(useServerSideStorageStore, {
      pinnedItems: store => new Set(store.prefsStorage.collections.pinnedStatusActions)
    }),
    buttons () {
      return BUTTONS.filter(x => x.if ? x.if(this.funcArg) : true)
    },
    quickButtons () {
      return this.buttons.filter(x => this.pinnedItems.has(x.name))
    },
    extraButtons () {
      return this.buttons.filter(x => !this.pinnedItems.has(x.name))
    },
    currentUser () {
      return this.$store.state.users.currentUser
    },
    funcArg () {
      return {
        status: this.status,
        replying: this.replying,
        emit: this.$emit,
        dispatch: this.$store.dispatch,
        state: this.$store.state,
        getters: this.$store.getters,
        router: this.$router,
        currentUser: this.currentUser,
        loggedIn: !!this.currentUser
      }
    },
    triggerAttrs () {
      return {
        title: this.$t('status.more_actions'),
        'aria-controls': `popup-menu-${this.randomSeed}`,
        'aria-haspopup': 'menu'
      }
    }
  },
  methods: {
    doAction (button) {
      if (button.confirm?.(this.funcArg)) {
        // TODO move to action_button
        this.currentConfirmTitle = this.$t(button.confirmStrings(this.funcArg).title)
        this.currentConfirmOkText = this.$t(button.confirmStrings(this.funcArg).confirm)
        this.currentConfirmCancelText = this.$t(button.confirmStrings(this.funcArg).cancel)
        this.currentConfirmBody = this.$t(button.confirmStrings(this.funcArg).body)
        this.currentConfirmAction = () => {
          this.showingConfirmDialog = false
          this.doActionReal(button)
        }
        this.showingConfirmDialog = true
      } else {
        this.doActionReal(button)
      }
    },
    doActionReal (button) {
      button.action(this.funcArg)
        .then(() => this.$emit('onSuccess'))
        .catch(err => this.$emit('onError', err.error.error))
    },
    onExtraClose () {
      this.showPin = false
    },
    isPinned (button) {
      return this.pinnedItems.has(button.name)
    },
    unpin (button) {
      useServerSideStorageStore().removeCollectionPreference({ path: 'collections.pinnedStatusActions', value: button.name })
      useServerSideStorageStore().pushServerSideStorage()
    },
    pin (button) {
      useServerSideStorageStore().addCollectionPreference({ path: 'collections.pinnedStatusActions', value: button.name })
      useServerSideStorageStore().pushServerSideStorage()
    },
    getComponent (button) {
      if (!this.$store.state.users.currentUser && button.anonLink) {
        return 'a'
      } else if (button.action == null && button.link != null) {
        return 'a'
      } else {
        return 'button'
      }
    },
    getClass (button) {
      return {
        [button.name + '-button']: true,
        disabled: button.interactive ? !button.interactive(this.funcArg) : false,
        '-pin-edit': this.showPin,
        '-dropdown': button.dropdown?.(),
        '-active': button.active?.(this.funcArg)
      }
    }
  }
}

export default StatusActionButtons
