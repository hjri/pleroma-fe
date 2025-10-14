const browserLocale = (window.navigator.language || 'en').split('-')[0]

/// Instance config entries provided by static config or pleroma api
/// Put settings here only if it does not make sense for a normal user
/// to override it.
export const staticOrApiConfigDefault = {
  theme: 'pleroma-dark',
  palette: null,
  style: null,
  defaultAvatar: '/images/avi.png',
  defaultBanner: '/images/banner.png',
  background: '/static/aurora_borealis.jpg',
  embeddedToS: true,
  logo: '/static/logo.svg',
  logoMargin: '.2em',
  logoMask: true,
  logoLeft: false,
  redirectRootLogin: '/main/friends',
  redirectRootNoLogin: '/main/all',
  hideSitename: false,
  nsfwCensorImage: undefined,
  showFeaturesPanel: true,
  showInstanceSpecificPanel: false,
}

/// This object contains setting entries that makes sense
/// at the user level. The defaults can also be overriden by
/// instance admins in the frontend_configuration endpoint or static config.
export const instanceDefaultConfig = {
  expertLevel: 0, // used to track which settings to show and hide
  hideISP: false,
  hideInstanceWallpaper: false,
  hideShoutbox: false,
  // bad name: actually hides posts of muted USERS
  hideMutedPosts: false,
  hideMutedThreads: true,
  hideWordFilteredPosts: false,
  muteBotStatuses: false,
  muteSensitiveStatuses: false,
  collapseMessageWithSubject: false,
  padEmoji: true,
  hideAttachments: false,
  hideAttachmentsInConv: false,
  hideScrobbles: false,
  hideScrobblesAfter: '2d',
  maxThumbnails: 16,
  hideNsfw: true,
  preloadImage: true,
  loopVideo: true,
  loopVideoSilentOnly: true,
  /// This is not the streaming API configuration, but rather an option
  /// for automatically loading new posts into the timeline without
  /// the user clicking the Show New button.
  streaming: false,
  emojiReactionsOnTimeline: true,
  alwaysShowNewPostButton: false,
  autohideFloatingPostButton: false,
  pauseOnUnfocused: true,
  stopGifs: true,
  replyVisibility: 'all',
  thirdColumnMode: 'notifications',
  notificationVisibility: {
    follows: true,
    mentions: true,
    statuses: true,
    likes: true,
    repeats: true,
    moves: true,
    emojiReactions: true,
    followRequest: true,
    reports: true,
    chatMention: true,
    polls: true
  },
  notificationNative: {
    follows: true,
    mentions: true,
    statuses: true,
    likes: false,
    repeats: false,
    moves: false,
    emojiReactions: false,
    followRequest: true,
    reports: true,
    chatMention: true,
    polls: true
  },
  webPushNotifications: false,
  webPushAlwaysShowNotifications: false,
  interfaceLanguage: browserLocale,
  hideScopeNotice: false,
  useStreamingApi: false,
  sidebarRight: false,
  scopeCopy: true,
  subjectLineBehavior: 'email',
  alwaysShowSubjectInput: true,
  postContentType: 'text/plain',
  minimalScopesMode: false,

  // This hides statuses filtered via a word filter
  hideFilteredStatuses: false,

  // Confirmations
  modalOnRepeat: false,
  modalOnUnfollow: false,
  modalOnBlock: true,
  modalOnMute: false,
  modalOnMuteConversation: false,
  modalOnMuteDomain: true,
  modalOnDelete: true,
  modalOnLogout: true,
  modalOnApproveFollow: false,
  modalOnDenyFollow: false,
  modalOnRemoveUserFromFollowers: false,

  // Expiry confirmations/default actions
  onMuteDefaultAction: 'ask',
  onBlockDefaultAction: 'ask',

  modalMobileCenter: false,
  playVideosInModal: false,
  useOneClickNsfw: false,
  useContainFit: true,
  disableStickyHeaders: false,
  showScrollbars: false,
  userPopoverAvatarAction: 'open',
  userPopoverOverlay: false,
  userCardLeftJustify: false,
  userCardHidePersonalMarks: false,
  sidebarColumnWidth: '25rem',
  contentColumnWidth: '45rem',
  notifsColumnWidth: '25rem',
  themeEditorMinWidth: '0rem',
  emojiReactionsScale: 0.5,
  textSize: '1rem',
  emojiSize: '2.2rem',
  navbarSize: '3.5rem',
  panelHeaderSize: '3.2rem',
  forcedRoundness: -1,
  navbarColumnStretch: false,
  greentext: false,
  mentionLinkDisplay: 'short',
  mentionLinkShowTooltip: true,
  mentionLinkShowAvatar: false,
  mentionLinkFadeDomain: true,
  mentionLinkShowYous: false,
  mentionLinkBoldenYou: true,
  hidePostStats: false,
  hideBotIndication: false,
  hideUserStats: false,
  virtualScrolling: true,
  sensitiveByDefault: false,
  conversationDisplay: 'linear',
  conversationTreeAdvanced: false,
  conversationOtherRepliesButton: 'below',
  conversationTreeFadeAncestors: false,
  showExtraNotifications: true,
  showExtraNotificationsTip: true,
  showChatsInExtraNotifications: true,
  showAnnouncementsInExtraNotifications: true,
  showFollowRequestsInExtraNotifications: true,
  maxDepthInThread: 6,
  autocompleteSelect: false,
  closingDrawerMarksAsSeen: true,
  unseenAtTop: false,
  ignoreInactionableSeen: false,
  unsavedPostAction: 'confirm',
  autoSaveDraft: false,
  useAbsoluteTimeFormat: false,
  absoluteTimeFormatMinAge: '0d',
  absoluteTime12h: '24h',
  imageCompression: true,
  alwaysUseJpeg: false
}

export const makeUndefined = c => Object.fromEntries(Object.keys(c).map(key => [key, undefined]))

/// For properties with special processing or properties that does not
/// make sense to be overriden on a instance-wide level.
export const defaultState = {
  // Set these to undefined so it does not interfere with default settings check
  ...makeUndefined(instanceDefaultConfig),

  // Special processing
  // Theme  stuff
  theme: undefined, // Very old theme store, stores preset name, still in use

  // V1
  colors: {}, // VERY old theme store, just colors of V1, probably not even used anymore

  // V2
  customTheme: undefined, // "snapshot", previously was used as actual theme store for V2 so it's still used in case of PleromaFE downgrade event.
  customThemeSource: undefined, // "source", stores original theme data

  // V3
  style: null,
  styleCustomData: null,
  palette: null,
  paletteCustomData: null,
  themeDebug: false, // debug mode that uses computed backgrounds instead of real ones to debug contrast functions
  forceThemeRecompilation: false, //  flag that forces recompilation on boot even if cache exists
  theme3hacks: { // Hacks, user overrides that are independent of theme used
    underlay: 'none',
    fonts: {
      interface: undefined,
      input: undefined,
      post: undefined,
      monospace: undefined
    }
  },

  // Special handling: These fields are not of a primitive type, and
  // might cause problems with current code because it specifically checks
  // them in state.config (not getters.mergedConfig).

  // Specifically, muteWords is now deprecated in favour of a server-side configuration.
  muteWords: [],
  highlight: {},

  // If there are any configurations that does not make sense to
  // have instance-wide default, put it here and explain why.
}
