import { mapState } from 'pinia'
import { mapGetters } from 'vuex'

import NavigationPins from 'src/components/navigation/navigation_pins.vue'
import GestureService from '../../services/gesture_service/gesture_service'
import {
  countExtraNotifications,
  unseenNotificationsFromStore,
} from '../../services/notification_utils/notification_utils'
import ConfirmModal from '../confirm_modal/confirm_modal.vue'
import Notifications from '../notifications/notifications.vue'
import SideDrawer from '../side_drawer/side_drawer.vue'

import { useAnnouncementsStore } from 'src/stores/announcements.js'
import { useInstanceStore } from 'src/stores/instance.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faArrowUp,
  faBars,
  faBell,
  faCheckDouble,
  faMinus,
  faTimes,
} from '@fortawesome/free-solid-svg-icons'

library.add(faTimes, faBell, faBars, faArrowUp, faMinus, faCheckDouble)

const MobileNav = {
  components: {
    SideDrawer,
    Notifications,
    NavigationPins,
    ConfirmModal,
  },
  data: () => ({
    notificationsCloseGesture: undefined,
    notificationsOpen: false,
    notificationsAtTop: true,
    showingConfirmLogout: false,
  }),
  created() {
    this.notificationsCloseGesture = GestureService.swipeGesture(
      GestureService.DIRECTION_RIGHT,
      () => this.closeMobileNotifications(true),
      50,
    )
  },
  computed: {
    currentUser() {
      return this.$store.state.users.currentUser
    },
    unseenNotifications() {
      return unseenNotificationsFromStore(
        this.$store,
        useSyncConfigStore().mergedConfig.notificationVisibility,
        useSyncConfigStore().mergedConfig.ignoreInactionableSeen,
      )
    },
    unseenNotificationsCount() {
      return (
        this.unseenNotifications.length +
        countExtraNotifications(this.$store, useSyncConfigStore().mergedConfig)
      )
    },
    unseenCount() {
      return this.unseenNotifications.length
    },
    unseenCountBadgeText() {
      return `${this.unseenCount ? this.unseenCount : ''}`
    },
    hideSitename() {
      return useInstanceStore().hideSitename
    },
    sitename() {
      return useInstanceStore().name
    },
    isChat() {
      return this.$route.name === 'chat'
    },
    ...mapState(useAnnouncementsStore, ['unreadAnnouncementCount']),
    ...mapState(useSyncConfigStore, {
      pinnedItems: (store) =>
        new Set(store.prefsStorage.collections.pinnedNavItems).has('chats'),
    }),
    shouldConfirmLogout() {
      return useSyncConfigStore().mergedConfig.modalOnLogout
    },
    closingDrawerMarksAsSeen() {
      return useSyncConfigStore().mergedConfig.closingDrawerMarksAsSeen
    },
    ...mapGetters(['unreadChatCount']),
  },
  methods: {
    toggleMobileSidebar() {
      this.$refs.sideDrawer.toggleDrawer()
    },
    openMobileNotifications() {
      this.notificationsOpen = true
    },
    closeMobileNotifications(markRead) {
      if (this.notificationsOpen) {
        // make sure to mark notifs seen only when the notifs were open and not
        // from close-calls.
        this.notificationsOpen = false
        if (markRead && this.closingDrawerMarksAsSeen) {
          this.markNotificationsAsSeen()
        }
      }
    },
    notificationsTouchStart(e) {
      GestureService.beginSwipe(e, this.notificationsCloseGesture)
    },
    notificationsTouchMove(e) {
      GestureService.updateSwipe(e, this.notificationsCloseGesture)
    },
    scrollToTop() {
      window.scrollTo(0, 0)
    },
    scrollMobileNotificationsToTop() {
      this.$refs.mobileNotifications.scrollTo(0, 0)
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
    markNotificationsAsSeen() {
      this.$store.dispatch('markNotificationsAsSeen')
    },
    onScroll({ target: { scrollTop, clientHeight, scrollHeight } }) {
      this.notificationsAtTop = scrollTop > 0
      if (scrollTop + clientHeight >= scrollHeight) {
        this.$refs.notifications.fetchOlderNotifications()
      }
    },
  },
  watch: {
    $route() {
      // handles closing notificaitons when you press any router-link on the
      // notifications.
      this.closeMobileNotifications()
    },
  },
}

export default MobileNav
