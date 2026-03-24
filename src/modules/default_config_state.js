const browserLocale = (navigator.language || 'en').split('-')[0]

const convertDefinitions = definitions => Object.fromEntries(
  Object.entries(definitions).map(([k, v]) => [
    k,
    v.default == null ? null : v.default,
  ]),
)

/// Instance config entries provided by static config or pleroma api
/// Put settings here only if it does not make sense for a normal user
/// to override it.
export const instanceIdentityDefaultDefinitions = {
  style: {
    description: 'Instance default style name',
    type: 'string',
    required: false,
  },
  palette: {
    description: 'Instance default palette name',
    type: 'string',
    required: false,
  },
  theme: {
    description: 'Instance default theme name',
    type: 'string',
    required: false,
  },
  defaultAvatar: {
    description: "Default avatar image to use when user doesn't have one set",
    type: 'string',
    default: '/images/avi.png',
  },
  defaultBanner: {
    description: "Default banner image to use when user doesn't have one set",
    type: 'string',
    default: '/images/banner.png',
  },
  background: {
    description: 'Instance background/wallpaper',
    type: 'string',
    default: '/static/aurora_borealis.jpg',
  },
  embeddedToS: {
    description: 'Whether to show Terms of Service title bar',
    type: 'boolean',
    default: true,
  },
  logo: {
    description: 'Instance logo',
    type: 'string',
    default: '/static/logo.svg',
  },
  logoMargin: {
    description: 'Margin for logo (spacing above/below)',
    type: 'string',
    default: '.2em',
  },
  logoMask: {
    description:
      'Use logo as a mask (works well for monochrome/transparent logos)',
    type: 'boolean',
    default: true,
  },
  logoLeft: {
    description: 'Show logo on the left side of navbar',
    type: 'boolean',
    default: false,
  },
  redirectRootLogin: {
    description: 'Where to redirect user after login',
    type: 'string',
    default: '/main/friends',
  },
  redirectRootNoLogin: {
    description: 'Where to redirect anonymous visitors',
    type: 'string',
    default: '/main/all',
  },
  hideSitename: {
    description: 'Hide the instance name in navbar',
    type: 'boolean',
    default: false,
  },
  nsfwCensorImage: {
    description: 'Default NSFW censor image',
    type: 'string',
    required: false,
  },
  showFeaturesPanel: {
    description: 'Show features panel to anonymous visitors',
    type: 'boolean',
    default: true,
  },
  showInstanceSpecificPanel: {
    description: 'Show instance-specific panel',
    type: 'boolean',
    default: false,
  },

  // Html stuff
  instanceSpecificPanelContent: {
    description: 'HTML of Instance-specific panel',
    type: 'string',
    required: false,
  },
  tos: {
    description: 'HTML of Terms of Service panel',
    type: 'string',
    required: false,
  },
}
export const instanceIdentityDefault = convertDefinitions(instanceIdentityDefaultDefinitions)

/// This object contains setting entries that makes sense
/// at the user level. The defaults can also be overriden by
/// instance admins in the frontend_configuration endpoint or static config.
export const instanceDefaultConfigDefinitions = {
  expertLevel: {
    description: 'Used to track which settings to show and hide in settings modal',
    type: 'number', // not a boolean so we could potentially make multiple levels of expert-ness
    default: 0,
  },
  hideISP: {
    description: 'Hide Instance-specific panel',
    default: false,
  },
  hideInstanceWallpaper: {
    description: 'Hide Instance default background',
    default: false,
  },
  hideShoutbox: {
    description: 'Hide shoutbox if present',
    default: false,
  },
  hideMutedPosts: { // bad name
    description: 'Hide posts of muted users entirely',
    default: false,
  },
  hideMutedThreads: {
    description: 'Hide muted threads entirely',
    default: true,
  },
  hideWordFilteredPosts: {
    description: 'Hide wordfiltered posts entirely',
    default: false,
  },
  muteBotStatuses: {
    description: 'Mute posts made by bots',
    default: false,
  },
  muteSensitiveStatuses: {
    description: 'Mute posts marked as NSFW',
    default: false,
  },
  collapseMessageWithSubject: {
    description: 'Collapse posts with subject',
    default: false,
  },
  padEmoji: {
    description: 'Pad emoji with spaces when using emoji picker',
    default: true,
  },
  hideAttachmentsInConv: {
    description: 'Hide attachments',
    default: false,
  },
  hideScrobbles: {
    description: 'Hide scrobbles',
    default: false,
  },
  hideScrobblesAfter: {
    description: 'Hide scrobbles older than',
    default: '2d',
  },
  maxThumbnails: {
    description: 'Maximum attachments to show',
    default: 16,
  },
  loopVideo: {
    description: 'Loop videos',
    default: true,
  },
  loopVideoSilentOnly: {
    description: 'Loop only videos without sound',
    default: true,
  },
  /// This is not the streaming API configuration, but rather an option
  /// for automatically loading new posts into the timeline without
  /// the user clicking the Show New button.
  streaming: {
    description: 'Automatically show new posts',
    default: false,
  },
  pauseOnUnfocused: {
    description: 'Pause showing new posts when tab is unfocused',
    default: true,
  },
  emojiReactionsOnTimeline: {
    description: 'Show emoji reactions on timeline',
    default: true,
  },
  alwaysShowNewPostButton: {
    description: 'Always show mobile "new post" button, even in desktop mode',
    default: false,
  },
  autohideFloatingPostButton: {
    description: 'Automatically hide mobile "new post" button when scrolling down',
    default: false,
  },
  stopGifs: {
    description: 'Play animated gifs on hover only',
    default: true,
  },
  replyVisibility: {
    description: 'Type of replies to show',
    default: 'all',
  },
  thirdColumnMode: {
    description: 'What to display in third column',
    default: 'notifications',
  },
  notificationVisibility: {
    description: 'What types of notifications to show',
    default: {
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
  },
  notificationNative: {
    description: 'What type of notifications to show desktop notification for',
    default: {
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
  },
  webPushNotifications: {
    description: 'Use WebPush',
    default: false,
  },
  webPushAlwaysShowNotifications: {
    description: 'Ignore filter when using WebPush',
    default: false,
  },
  interfaceLanguage: {
    description: 'UI language',
    default: browserLocale,
  },
  hideScopeNotice: {
    description: 'Hide scope notification',
    default: false,
  },
  scopeCopy: {
    description: 'Copy scope like mastodon does',
    default: true,
  },
  subjectLineBehavior: {
    description: 'How to treat subject line',
    default: 'email',
  },
  alwaysShowSubjectInput: {
    description: 'Always show subject line field',
    default: true,
  },
  minimalScopesMode: {
    description: 'Minimize amount of options shown in scope selector',
    default: false,
  },

  // This hides statuses filtered via a word filter
  hideFilteredStatuses: {
    description: 'Hide wordfiltered entirely',
    default: false,
  },

  // Confirmations
  modalOnRepeat: {
    description: 'Show confirmation modal for repeat',
    default: false,
  },
  modalOnUnfollow: {
    description: 'Show confirmation modal for unfollow',
    default: false,
  },
  modalOnBlock: {
    description: 'Show confirmation modal for block',
    default: true,
  },
  modalOnMute: {
    description: 'Show confirmation modal for mute',
    default: false,
  },
  modalOnMuteConversation: {
    description: 'Show confirmation modal for mute conversation',
    default: false,
  },
  modalOnMuteDomain: {
    description: 'Show confirmation modal for mute domain',
    default: true,
  },
  modalOnDelete: {
    description: 'Show confirmation modal for delete',
    default: true,
  },
  modalOnLogout: {
    description: 'Show confirmation modal for logout',
    default: true,
  },
  modalOnApproveFollow: {
    description: 'Show confirmation modal for approve follow',
    default: false,
  },
  modalOnDenyFollow: {
    description: 'Show confirmation modal for deny follow',
    default: false,
  },
  modalOnRemoveUserFromFollowers: {
    description: 'Show confirmation modal for follower removal',
    default: false,
  },

  // Expiry confirmations/default actions
  onMuteDefaultAction: {
    description: 'Default action when muting user',
    default: 'ask',
  },
  onBlockDefaultAction: {
    description: 'Default action when blocking user',
    default: 'ask',
  },

  modalMobileCenter: {
    description: 'Center mobile dialogs vertically',
    default: false,
  },
  playVideosInModal: {
    description: 'Play videos in gallery view',
    default: false,
  },
  useContainFit: {
    description: 'Use object-fit: contain for attachments',
    default: true,
  },
  disableStickyHeaders: {
    description: 'Disable sticky headers',
    default: false,
  },
  showScrollbars: {
    description: 'Always show scrollbars',
    default: false,
  },
  userPopoverAvatarAction: {
    description: 'What to do when clicking popover avatar',
    default: 'open',
  },
  userPopoverOverlay: {
    description: 'Overlay user popover with centering on avatar',
    default: false,
  },
  userCardLeftJustify: {
    description: 'Justify user bio to the left',
    default: false,
  },
  userCardHidePersonalMarks: {
    description: 'Hide highlight/personal note in user view',
    default: false,
  },
  forcedRoundness: {
    description: 'Force roundness of the theme',
    default: -1,
  },
  greentext: {
    description: 'Highlight plaintext >quotes',
    default: false,
  },
  mentionLinkShowTooltip: {
    description: 'Show tooltips for mention links',
    default: true,
  },
  mentionLinkShowAvatar: {
    description: 'Show avatar next to mention link',
    default: false,
  },
  mentionLinkFadeDomain: {
    description: 'Mute (fade) domain name in mention links if configured to show it',
    default: true,
  },
  mentionLinkShowYous: {
    description: 'Show (you)s when you are mentioned',
    default: false,
  },
  mentionLinkBoldenYou: {
    description: 'Boldern mentionlink of you',
    default: true,
  },
  hidePostStats: {
    description: 'Hide post stats (rt, favs)',
    default: false,
  },
  hideBotIndication: {
    description: 'Hide bot indicator',
    default: false,
  },
  hideUserStats: {
    description: 'Hide user stats (followers etc)',
    default: false,
  },
  virtualScrolling: {
    description: 'Timeline virtual scrolling',
    default: true,
  },
  sensitiveByDefault: {
    description: 'Assume attachments are NSFW by default',
    default: false,
  },
  conversationDisplay: {
    description: 'Style of conversation display',
    default: 'linear',
  },
  conversationTreeAdvanced: {
    description: 'Advanced features of tree view conversation',
    default: false,
  },
  conversationOtherRepliesButton: {
    description: 'Where to show "other replies" in tree conversation view',
    default: 'below',
  },
  conversationTreeFadeAncestors: {
    description: 'Fade ancestors in tree conversation view',
    default: false,
  },
  showExtraNotifications: {
    description: 'Show extra notifications (chats, announcements etc) in notification panel',
    default: true,
  },
  showExtraNotificationsTip: {
    description: 'Show tip for extra notifications (that user can remove them)',
    default: true,
  },
  showChatsInExtraNotifications: {
    description: 'Show chat messages in notifications',
    default: true,
  },
  showAnnouncementsInExtraNotifications: {
    description: 'Show announcements in notifications',
    default: true,
  },
  showFollowRequestsInExtraNotifications: {
    description: 'Show follow requests in notifications',
    default: true,
  },
  maxDepthInThread: {
    description: 'Maximum depth in tree conversation view',
    default: 6,
  },
  autocompleteSelect: {
    description: '',
    default: false,
  },
  closingDrawerMarksAsSeen: {
    description: 'Closing mobile notification pane marks everything as seen',
    default: true,
  },
  unseenAtTop: {
    description: 'Show unseen notifications above others',
    default: false,
  },
  ignoreInactionableSeen: {
    description: 'Treat inactionable (fav, rt etc) notifications as "seen"',
    default: false,
  },
  unsavedPostAction: {
    description: 'What to do if post is aborted',
    default: 'confirm',
  },
  autoSaveDraft: {
    description: 'Save drafts automatically',
    default: false,
  },
  useAbsoluteTimeFormat: {
    description: 'Use absolute time format',
    default: false,
  },
  absoluteTimeFormatMinAge: {
    description: 'Show absolute time format only after this post age',
    default: '0d',
  },
  absoluteTime12h: {
    description: 'Use 24h time format',
    default: '24h',
  },
}
export const instanceDefaultConfig = convertDefinitions(instanceDefaultConfigDefinitions)

export const defaultConfigLocal = {
  hideAttachments: false,
  hideAttachmentsInConv: false,
  hideNsfw: true,
  useOneClickNsfw: false,
  preloadImage: true,
  postContentType: 'text/plain',
  sidebarRight: false,
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
  alwaysUseJpeg: false,
  imageCompression: true,
  useStreamingApi: false,
  underlay: 'none',
  fontInterface: undefined,
  fontInput: undefined,
  fontPosts: undefined,
  fontMonospace: undefined,
  themeDebug: false, // debug mode that uses computed backgrounds instead of real ones to debug contrast functions
  forceThemeRecompilation: false, //  flag that forces recompilation on boot even if cache exists
}

export const LOCAL_ONLY_KEYS = new Set(Object.keys(defaultConfigLocal))

export const makeUndefined = (c) =>
  Object.fromEntries(Object.keys(c).map((key) => [key, undefined]))

/// For properties with special processing or properties that does not
/// make sense to be overriden on a instance-wide level.
export const defaultState = {
  // Set these to undefined so it does not interfere with default settings check
  ...makeUndefined(instanceDefaultConfig),
  ...makeUndefined(defaultConfigLocal),
  // If there are any configurations that does not make sense to
  // have instance-wide default, put it here and explain why.

  // # Special processing
  // ## Theme  stuff
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
}
