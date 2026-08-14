import SearchBar from 'components/search_bar/search_bar.vue'
import { mapActions, mapState } from 'pinia'
import { defineAsyncComponent } from 'vue'

import { useInstanceStore } from 'src/stores/instance.js'
import { useInterfaceStore } from 'src/stores/interface'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useUsersStore } from 'src/stores/users.js'
import { useStreamingStore } from 'src/stores/streaming.js'

import {
  WSConnectionStatus,
} from 'src/api/websocket.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faBell,
  faBullhorn,
  faCog,
  faComments,
  faHome,
  faInfoCircle,
  faSearch,
  faSignInAlt,
  faSignOutAlt,
  faTachometerAlt,
  faUserPlus,
  faPlug,
  faPlugCircleXmark
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faSignInAlt,
  faSignOutAlt,
  faHome,
  faComments,
  faBell,
  faUserPlus,
  faBullhorn,
  faSearch,
  faTachometerAlt,
  faCog,
  faInfoCircle,
  faPlug,
  faPlugCircleXmark
)

export default {
  components: {
    SearchBar,
    ConfirmModal: defineAsyncComponent(
      () => import('src/components/confirm_modal/confirm_modal.vue'),
    ),
  },
  data: () => ({
    searchBarHidden: true,
    supportsMask:
      window.CSS?.supports &&
      (window.CSS.supports('mask-size', 'contain') ||
        window.CSS.supports('-webkit-mask-size', 'contain') ||
        window.CSS.supports('-moz-mask-size', 'contain') ||
        window.CSS.supports('-ms-mask-size', 'contain') ||
        window.CSS.supports('-o-mask-size', 'contain')),
    showingConfirmLogout: false,
  }),
  computed: {
    enableMask() {
      return this.supportsMask && this.logoMask
    },
    logoStyle() {
      return {
        visibility: this.enableMask ? 'hidden' : 'visible',
      }
    },
    logoMaskStyle() {
      return this.enableMask
        ? {
            'mask-image': `url(${this.logo})`,
          }
        : {
            'background-color': this.enableMask ? '' : 'transparent',
          }
    },
    logoBgStyle() {
      const mask = this.enableMask
        ? {}
        : { 'background-color': this.enableMask ? '' : 'transparent' }

      return {
        margin: `${this.logoMargin} 0`,
        opacity: this.searchBarHidden ? 1 : 0,
        ...mask,
      }
    },
    ...mapState(useInstanceStore, ['privateMode']),
    ...mapState(useInstanceStore, {
      logoMask: (store) => store.instanceIdentity.logoMask,
      logo: (store) => store.instanceIdentity.logo,
      logoLeft: (store) => store.instanceIdentity.logoLeft,
      logoMargin: (store) => store.instanceIdentity.logoMargin,
      sitename: (store) => store.instanceIdentity.name,
      hideSitename: (store) => store.instanceIdentity.hideSitename,
    }),
    ...mapState(useUsersStore, ['currentUser']),
    ...mapState(useStreamingStore, {
      streamingConnected: (store) => store.state === WSConnectionStatus.JOINED
    }),
    ...mapState(useMergedConfigStore, ['mergedConfig']),
    shouldConfirmLogout() {
      return this.mergedConfig.modalOnLogout
    },
    streamingEnabled() {
      return this.mergedConfig.useStreamingApi
    },
    streamingTooltip() {
      if (this.streamingConnected) {
        return this.$t('timeline.socket_reconnected')
      } else {
        return this.$t('timeline.socket_disconnected')
      }
    }
  },
  methods: {
    scrollToTop() {
      window.scrollTo(0, 0)
    },
    showConfirmLogout() {
      this.showingConfirmLogout = true
    },
    hideConfirmLogout() {
      this.showingConfirmLogout = false
    },
    logout() {
      if (!this.shouldConfirmLogout) {
        this.doLogout()
      } else {
        this.showConfirmLogout()
      }
    },
    doLogout() {
      this.$router.replace('/main/public')
      this.$store.dispatch('logout')
      this.hideConfirmLogout()
    },
    onSearchBarToggled(hidden) {
      this.searchBarHidden = hidden
    },
    ...mapActions(useInterfaceStore, ['openSettingsModal']),
  },
}
