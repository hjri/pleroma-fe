// this is a snapshot of config keys used prior to sync config.
// used to migrate from old config.

// commented entries are unsynced stuff
export const defaultConfigSync = {
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
  hideScrobbles: false,
  hideScrobblesAfter: '2d',
  maxThumbnails: 16,
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
    polls: true,
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
    polls: true,
  },
  webPushNotifications: false,
  webPushAlwaysShowNotifications: false,
  //interfaceLanguage: '',
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
  useContainFit: true,
  disableStickyHeaders: false,
  showScrollbars: false,
  userPopoverAvatarAction: 'open',
  userPopoverOverlay: false,
  userCardLeftJustify: false,
  userCardHidePersonalMarks: false,
  forcedRoundness: -1,
  greentext: false,
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
  theme3hacks: {
    // Hacks, user overrides that are independent of theme used
    underlay: 'none',
    fonts: {
      interface: undefined,
      input: undefined,
      post: undefined,
      monospace: undefined,
    },
  },
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

  // Those are handled outside config now
  // muteWords: [],
  // highlight: {},
}

export const defaultConfigLocal = {
  hideAttachments: false,
  hideAttachmentsInConv: false,
  hideNsfw: true,
  useOneClickNsfw: false,
  preloadImage: true,
  sidebarColumnWidth: '25rem',
  contentColumnWidth: '45rem',
  notifsColumnWidth: '25rem',
  themeEditorMinWidth: '0rem',
  emojiReactionsScale: 0.5,
  textSize: '1rem',
  emojiSize: '2.2rem',
  navbarSize: '3.5rem',
  panelHeaderSize: '3.2rem',
  navbarColumnStretch: false,
  mentionLinkDisplay: 'short',
  imageCompression: true,
  alwaysUseJpeg: false,
}
