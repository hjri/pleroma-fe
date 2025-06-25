const browserLocale = (window.navigator.language || 'en').split('-')[0]

export const defaultState = {
  expertLevel: 0, // used to track which settings to show and hide

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

  hideISP: false,
  hideInstanceWallpaper: false,
  hideShoutbox: false,
  // bad name: actually hides posts of muted USERS
  hideMutedPosts: undefined, // instance default
  hideMutedThreads: undefined, // instance default
  hideWordFilteredPosts: undefined, // instance default
  muteBotStatuses: undefined, // instance default
  muteSensitiveStatuses: undefined, // instance default
  collapseMessageWithSubject: undefined, // instance default
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
  muteWords: [],
  highlight: {},
  interfaceLanguage: browserLocale,
  hideScopeNotice: false,
  useStreamingApi: false,
  sidebarRight: undefined, // instance default
  scopeCopy: undefined, // instance default
  subjectLineBehavior: undefined, // instance default
  alwaysShowSubjectInput: undefined, // instance default
  postContentType: undefined, // instance default
  minimalScopesMode: undefined, // instance default
  // This hides statuses filtered via a word filter
  hideFilteredStatuses: undefined, // instance default
  modalOnRepeat: undefined, // instance default
  modalOnUnfollow: undefined, // instance default
  modalOnBlock: undefined, // instance default
  modalOnMute: undefined, // instance default
  modalOnMuteConversation: undefined, // instance default
  modalOnMuteDomain: undefined, // instance default
  modalOnDelete: undefined, // instance default
  modalOnLogout: undefined, // instance default
  modalOnApproveFollow: undefined, // instance default
  modalOnDenyFollow: undefined, // instance default
  modalOnRemoveUserFromFollowers: undefined, // instance default
  modalMobileCenter: undefined,
  playVideosInModal: false,
  useOneClickNsfw: false,
  useContainFit: true,
  disableStickyHeaders: false,
  showScrollbars: false,
  userPopoverAvatarAction: 'open',
  userPopoverOverlay: false,
  sidebarColumnWidth: '25rem',
  contentColumnWidth: '45rem',
  notifsColumnWidth: '25rem',
  themeEditorMinWidth: undefined, // instance default
  emojiReactionsScale: undefined,
  textSize: undefined, // instance default
  emojiSize: undefined, // instance default
  navbarSize: undefined, // instance default
  panelHeaderSize: undefined, // instance default
  forcedRoundness: undefined, // instance default
  navbarColumnStretch: false,
  greentext: undefined, // instance default
  mentionLinkDisplay: undefined, // instance default
  mentionLinkShowTooltip: undefined, // instance default
  mentionLinkShowAvatar: undefined, // instance default
  mentionLinkFadeDomain: undefined, // instance default
  mentionLinkShowYous: undefined, // instance default
  mentionLinkBoldenYou: undefined, // instance default
  hidePostStats: undefined, // instance default
  hideBotIndication: undefined, // instance default
  hideUserStats: undefined, // instance default
  virtualScrolling: undefined, // instance default
  sensitiveByDefault: undefined, // instance default
  conversationDisplay: undefined, // instance default
  conversationTreeAdvanced: undefined, // instance default
  conversationOtherRepliesButton: undefined, // instance default
  conversationTreeFadeAncestors: undefined, // instance default
  showExtraNotifications: undefined, // instance default
  showExtraNotificationsTip: undefined, // instance default
  showChatsInExtraNotifications: undefined, // instance default
  showAnnouncementsInExtraNotifications: undefined, // instance default
  showFollowRequestsInExtraNotifications: undefined, // instance default
  maxDepthInThread: undefined, // instance default
  autocompleteSelect: undefined, // instance default
  closingDrawerMarksAsSeen: undefined, // instance default
  unseenAtTop: undefined, // instance default
  ignoreInactionableSeen: undefined, // instance default
  unsavedPostAction: undefined, // instance default
  autoSaveDraft: undefined, // instance default
  useAbsoluteTimeFormat: undefined, // instance default
  absoluteTimeFormatMinAge: undefined, // instance default
  absoluteTime12h: undefined, // instance default
  imageCompression: true,
  alwaysUseJpeg: false
}
