import { mapState as mapPiniaState } from 'pinia'
import { mapGetters, mapState } from 'vuex'

import { USERNAME_ROUTES } from 'src/components/navigation/navigation.js'
import { useAnnouncementsStore } from 'src/stores/announcements'
import { useInstanceStore } from 'src/stores/instance.js'
import { useInterfaceStore } from 'src/stores/interface'
import { useShoutStore } from 'src/stores/shout'
import GestureService from '../../services/gesture_service/gesture_service'
import { unseenNotificationsFromStore } from '../../services/notification_utils/notification_utils'
import UserCard from '../user_card/user_card.vue'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faBell,
  faBullhorn,
  faCog,
  faComments,
  faCompass,
  faFilePen,
  faHome,
  faInfoCircle,
  faList,
  faSearch,
  faSignInAlt,
  faSignOutAlt,
  faTachometerAlt,
  faUserPlus,
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
  faCompass,
  faList,
  faFilePen,
)

const SideDrawer = {
  props: ['logout'],
  data: () => ({
    closed: true,
    closeGesture: undefined,
  }),
  created() {
    this.closeGesture = GestureService.swipeGesture(
      GestureService.DIRECTION_LEFT,
      this.toggleDrawer,
    )

    if (this.currentUser && this.currentUser.locked) {
      this.$store.dispatch('startFetchingFollowRequests')
    }
  },
  components: { UserCard },
  computed: {
    currentUser() {
      return this.$store.state.users.currentUser
    },
    shout() {
      return useShoutStore().joined
    },
    unseenNotifications() {
      return unseenNotificationsFromStore(this.$store)
    },
    unseenNotificationsCount() {
      return this.unseenNotifications.length
    },
    suggestionsEnabled() {
      return useInstanceStore().suggestionsEnabled
    },
    logo() {
      return useInstanceStore().logo
    },
    hideSitename() {
      return useInstanceStore().hideSitename
    },
    sitename() {
      return useInstanceStore().name
    },
    followRequestCount() {
      return this.$store.state.api.followRequests.length
    },
    privateMode() {
      return useInstanceStore().private
    },
    federating() {
      return useInstanceStore().federating
    },
    timelinesRoute() {
      let name
      if (useInterfaceStore().lastTimeline) {
        name = useInterfaceStore().lastTimeline
      }
      name = this.currentUser ? 'friends' : 'public-timeline'
      if (USERNAME_ROUTES.has(name)) {
        return { name, params: { username: this.currentUser.screen_name } }
      } else {
        return { name }
      }
    },
    ...mapPiniaState(useAnnouncementsStore, {
      supportsAnnouncements: (store) => store.supportsAnnouncements,
      unreadAnnouncementCount: 'unreadAnnouncementCount',
    }),
    ...mapState({
      pleromaChatMessagesAvailable: (state) =>
        useInstanceStore().pleromaChatMessagesAvailable,
    }),
    ...mapGetters(['unreadChatCount', 'draftCount']),
  },
  methods: {
    toggleDrawer() {
      this.closed = !this.closed
    },
    doLogout() {
      this.logout()
      this.toggleDrawer()
    },
    touchStart(e) {
      GestureService.beginSwipe(e, this.closeGesture)
    },
    touchMove(e) {
      GestureService.updateSwipe(e, this.closeGesture)
    },
    openSettingsModal() {
      useInterfaceStore().openSettingsModal('user')
    },
    openAdminModal() {
      useInterfaceStore().openSettingsModal('admin')
    },
  },
}

export default SideDrawer
