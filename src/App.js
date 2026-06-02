import { throttle } from 'lodash'
import { mapState } from 'pinia'
import { defineAsyncComponent } from 'vue'

import DesktopNav from './components/desktop_nav/desktop_nav.vue'
import EditStatusModal from './components/edit_status_modal/edit_status_modal.vue'
import FeaturesPanel from './components/features_panel/features_panel.vue'
import GlobalNoticeList from './components/global_notice_list/global_notice_list.vue'
import InstanceSpecificPanel from './components/instance_specific_panel/instance_specific_panel.vue'
import MediaModal from './components/media_modal/media_modal.vue'
import MobileNav from './components/mobile_nav/mobile_nav.vue'
import MobilePostStatusButton from './components/mobile_post_status_button/mobile_post_status_button.vue'
import NavPanel from './components/nav_panel/nav_panel.vue'
import PostStatusModal from './components/post_status_modal/post_status_modal.vue'
import SideDrawer from './components/side_drawer/side_drawer.vue'
import StatusHistoryModal from './components/status_history_modal/status_history_modal.vue'
import UserPanel from './components/user_panel/user_panel.vue'
import UserReportingModal from './components/user_reporting_modal/user_reporting_modal.vue'
import WhoToFollowPanel from './components/who_to_follow_panel/who_to_follow_panel.vue'
import { getOrCreateServiceWorker } from './services/sw/sw'
import { windowHeight, windowWidth } from './services/window_utils/window_utils'

import { useEmojiStore } from 'src/stores/emoji.js'
import { useI18nStore } from 'src/stores/i18n.js'
import { useInstanceStore } from 'src/stores/instance.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useShoutStore } from 'src/stores/shout.js'

import messages from 'src/i18n/messages'
import localeService from 'src/services/locale/locale.service.js'

// Helper to unwrap reactive proxies
window.toValue = (x) => JSON.parse(JSON.stringify(x))

export default {
  name: 'app',
  components: {
    UserPanel,
    NavPanel,
    Notifications: defineAsyncComponent(
      () => import('./components/notifications/notifications.vue'),
    ),
    InstanceSpecificPanel,
    FeaturesPanel,
    WhoToFollowPanel,
    ShoutPanel: defineAsyncComponent(
      () => import('src/components/shout_panel/shout_panel.vue'),
    ),
    MediaModal,
    SideDrawer,
    MobilePostStatusButton,
    MobileNav,
    DesktopNav,
    SettingsModal: defineAsyncComponent(
      () => import('./components/settings_modal/settings_modal.vue'),
    ),
    UpdateNotification: defineAsyncComponent(
      () => import('./components/update_notification/update_notification.vue'),
    ),
    UserReportingModal,
    PostStatusModal,
    EditStatusModal,
    StatusHistoryModal,
    GlobalNoticeList,
  },
  data: () => ({
    mobileActivePanel: 'timeline',
  }),
  provide() {
    return {
      allowNonSquareEmoji: useMergedConfigStore().mergedConfig.nonSquareEmoji,
    }
  },
  watch: {
    themeApplied() {
      this.removeSplash()
    },
    currentTheme() {
      this.setThemeBodyClass()
    },
    layoutType() {
      document.getElementById('modal').classList = ['-' + this.layoutType]
    },
  },
  created() {
    // Load the locale from the storage
    const value = useMergedConfigStore().mergedConfig.interfaceLanguage
    useI18nStore().setLanguage(value)
    useEmojiStore().loadUnicodeEmojiData(value)

    document.getElementById('modal').classList = ['-' + this.layoutType]

    // Create bound handlers
    this.updateScrollState = throttle(this.scrollHandler, 200)
    this.updateMobileState = throttle(this.resizeHandler, 200)
  },
  mounted() {
    window.addEventListener('resize', this.updateMobileState)
    this.scrollParent.addEventListener('scroll', this.updateScrollState)

    if (this.themeApplied) {
      this.setThemeBodyClass()
      this.removeSplash()
    }
    getOrCreateServiceWorker()
  },
  unmounted() {
    window.removeEventListener('resize', this.updateMobileState)
    this.scrollParent.removeEventListener('scroll', this.updateScrollState)
  },
  computed: {
    currentTheme() {
      if (this.styleDataUsed) {
        const styleMeta = this.styleDataUsed.find(
          (x) => x.component === '@meta',
        )

        if (styleMeta !== undefined) {
          return styleMeta.directives.name.replaceAll(' ', '-').toLowerCase()
        }
      }

      return 'stock'
    },
    layoutModalClass() {
      return '-' + this.layoutType
    },
    classes() {
      return [
        {
          '-reverse': this.reverseLayout,
          '-no-sticky-headers': this.noSticky,
          '-has-new-post-button': this.newPostButtonShown,
        },
        '-' + this.layoutType,
      ]
    },
    navClasses() {
      const { navbarColumnStretch } = useMergedConfigStore().mergedConfig
      return [
        '-' + this.layoutType,
        ...(navbarColumnStretch ? ['-column-stretch'] : []),
      ]
    },
    currentUser() {
      return this.$store.state.users.currentUser
    },
    userBackground() {
      return this.currentUser.background_image
    },
    instanceBackground() {
      return useMergedConfigStore().mergedConfig.hideInstanceWallpaper
        ? null
        : this.instanceBackgroundUrl
    },
    background() {
      return this.userBackground || this.instanceBackground
    },
    bgStyle() {
      if (this.background) {
        return {
          '--body-background-image': `url(${this.background})`,
        }
      }
    },
    shoutJoined() {
      return useShoutStore().joined
    },
    isChats() {
      return this.$route.name === 'chat' || this.$route.name === 'chats'
    },
    isListEdit() {
      return this.$route.name === 'lists-edit'
    },
    newPostButtonShown() {
      if (this.isChats) return false
      if (this.isListEdit) return false
      return (
        useMergedConfigStore().mergedConfig.alwaysShowNewPostButton ||
        this.layoutType === 'mobile'
      )
    },
    shoutboxPosition() {
      return (
        useMergedConfigStore().mergedConfig.alwaysShowNewPostButton || false
      )
    },
    hideShoutbox() {
      return useMergedConfigStore().mergedConfig.hideShoutbox
    },
    reverseLayout() {
      const { thirdColumnMode, sidebarRight: reverseSetting } =
        useMergedConfigStore().mergedConfig
      if (this.layoutType !== 'wide') {
        return reverseSetting
      } else {
        return thirdColumnMode === 'notifications'
          ? reverseSetting
          : !reverseSetting
      }
    },
    noSticky() {
      return useMergedConfigStore().mergedConfig.disableStickyHeaders
    },
    showScrollbars() {
      return useMergedConfigStore().mergedConfig.showScrollbars
    },
    scrollParent() {
      return window /* this.$refs.appContentRef */
    },
    showInstanceSpecificPanel() {
      return (
        this.instanceSpecificPanelPresent &&
        !useMergedConfigStore().mergedConfig.hideISP
      )
    },
    ...mapState(useMergedConfigStore, ['mergedConfig']),
    ...mapState(useInterfaceStore, [
      'themeApplied',
      'styleDataUsed',
      'layoutType',
    ]),
    ...mapState(useInstanceStore, ['styleDataUsed']),
    ...mapState(useInstanceCapabilitiesStore, [
      'suggestionsEnabled',
      'editingAvailable',
    ]),
    ...mapState(useInstanceStore, {
      instanceBackgroundUrl: (store) => store.instanceIdentity.background,
      showFeaturesPanel: (store) => store.instanceIdentity.showFeaturesPanel,
      instanceSpecificPanelPresent: (store) =>
        store.instanceIdentity.showInstanceSpecificPanel &&
        store.instanceIdentity.instanceSpecificPanelContent,
    }),
  },
  methods: {
    resizeHandler() {
      useInterfaceStore().setLayoutWidth(windowWidth())
      useInterfaceStore().setLayoutHeight(windowHeight())
    },
    scrollHandler() {
      const scrollPosition =
        this.scrollParent === window
          ? window.scrollY
          : this.scrollParent.scrollTop

      if (scrollPosition != 0) {
        this.$refs.appContentRef.classList.add(['-scrolled'])
      } else {
        this.$refs.appContentRef.classList.remove(['-scrolled'])
      }
    },
    setThemeBodyClass() {
      const themeName = this.currentTheme
      const classList = Array.from(document.body.classList)
      const oldTheme = classList.filter((c) => c.startsWith('theme-'))

      if (themeName !== null && themeName !== '') {
        const newTheme = `theme-${themeName.toLowerCase()}`

        // remove old theme reference if there are any
        if (oldTheme.length) {
          document.body.classList.replace(oldTheme[0], newTheme)
        } else {
          document.body.classList.add(newTheme)
        }
      } else {
        // remove theme reference if non-V3 theme is used
        document.body.classList.remove(...oldTheme)
      }
    },
    removeSplash() {
      document.querySelector('#status').textContent = this.$t(
        'splash.fun_' + Math.ceil(Math.random() * 4),
      )
      const splashscreenRoot = document.querySelector('#splash')
      splashscreenRoot.addEventListener('transitionend', () => {
        splashscreenRoot.remove()
      })
      setTimeout(() => {
        splashscreenRoot.remove() // forcibly remove it, should fix my plasma browser widget t. HJ
      }, 600)
      splashscreenRoot.classList.add('hidden')
      document.querySelector('#app').classList.remove('hidden')
    },
  },
}
