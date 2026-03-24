import { get, set } from 'lodash'

const browserLocale = (navigator.language || 'en').split('-')[0]

export const convertDefinitions = (definitions) =>
  Object.fromEntries(
    Object.entries(definitions).map(([k, v]) => {
      const defaultValue = v.default ?? null
      return [k, defaultValue]
    }),
  )

/// Instance config entries provided by static config or pleroma api
/// Put settings here only if it does not make sense for a normal user
/// to override it.
export const INSTANCE_IDENTITY_DEFAULT_DEFINITIONS = {
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
export const INSTANCE_IDENTITY_DEFAULT = convertDefinitions(
  INSTANCE_IDENTITY_DEFAULT_DEFINITIONS,
)

/// This object contains setting entries that makes sense
/// at the user level. The defaults can also be overriden by
/// instance admins in the frontend_configuration endpoint or static config.
export const INSTANCE_DEFAULT_CONFIG_DEFINITIONS = {
  expertLevel: {
    description:
      'Used to track which settings to show and hide in settings modal',
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
  hideMutedPosts: {
    // bad name
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
    description:
      'Automatically hide mobile "new post" button when scrolling down',
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
    description:
      'Mute (fade) domain name in mention links if configured to show it',
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
    description:
      'Show extra notifications (chats, announcements etc) in notification panel',
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
  themeChecksum: {
    description: 'Checksum of theme used',
    type: 'string',
    required: false,
  },
}
export const INSTANCE_DEFAULT_CONFIG = convertDefinitions(
  INSTANCE_DEFAULT_CONFIG_DEFINITIONS,
)

export const LOCAL_DEFAULT_CONFIG_DEFINITIONS = {
  // TODO these two used to be separate but since separation feature got broken it doesn't matter
  hideAttachments: {
    description: 'Hide attachments in timeline',
    default: false,
  },
  hideAttachmentsInConv: {
    description: 'Hide attachments in coversation',
    default: false,
  },
  hideNsfw: {
    description: 'Hide nsfw posts',
    default: true,
  },
  useOneClickNsfw: {
    description: 'Open NSFW images directly in media modal',
    default: false,
  },
  preloadImage: {
    description: 'Preload images for NSFW',
    default: true,
  },
  postContentType: {
    description: 'Default post content type',
    default: 'text/plain',
  },
  sidebarRight: {
    description: 'Reverse order of columns',
    default: false,
  },
  sidebarColumnWidth: {
    description: 'Sidebar column width',
    default: '25rem',
  },
  contentColumnWidth: {
    description: 'Middle column width',
    default: '45rem',
  },
  notifsColumnWidth: {
    description: 'Notifications column width',
    default: '25rem',
  },
  themeEditorMinWidth: {
    description: 'Hack for theme editor on mobile',
    default: '0rem',
  },
  emojiReactionsScale: {
    description: 'Emoji reactions scale factor',
    default: 0.5,
  },
  textSize: {
    description: 'Font size',
    default: '1rem',
  },
  emojiSize: {
    description: 'Emoji size',
    default: '2.2rem',
  },
  navbarSize: {
    description: 'Navbar size',
    default: '3.5rem',
  },
  panelHeaderSize: {
    description: 'Panel header size',
    default: '3.2rem',
  },
  navbarColumnStretch: {
    description: 'Stretch navbar to match columns width',
    default: false,
  },
  mentionLinkDisplay: {
    description: 'How to display mention links',
    default: 'short',
  },
  imageCompression: {
    description: 'Image compression (WebP/JPEG)',
    default: true,
  },
  alwaysUseJpeg: {
    description: 'Compress images using JPEG only',
    default: false,
  },
  useStreamingApi: {
    description: 'Streaming API (WebSocket)',
    default: false,
  },
  underlay: {
    description: 'Underlay override',
    required: true,
    default: 'none',
  },
  fontInterface: {
    description: 'Interface font override',
    type: 'string',
    default: null,
  },
  fontInput: {
    description: 'Input font override',
    type: 'string',
    default: null,
  },
  fontPosts: {
    description: 'Post font override',
    type: 'string',
    default: null,
  },
  fontMonospace: {
    description: 'Monospace font override',
    type: 'string',
    default: null,
  },
  themeDebug: {
    description:
      'Debug mode that uses computed backgrounds instead of real ones to debug contrast functions',
    default: false,
  },
  forceThemeRecompilation: {
    description: 'Flag that forces recompilation on boot even if cache exists',
    default: false,
  },
}
export const LOCAL_DEFAULT_CONFIG = convertDefinitions(
  LOCAL_DEFAULT_CONFIG_DEFINITIONS,
)

export const LOCAL_ONLY_KEYS = new Set(Object.keys(LOCAL_DEFAULT_CONFIG))

export const THEME_CONFIG_DEFINITIONS = {
  theme: {
    description: 'Very old theme store, stores preset name, still in use',
    default: null,
  },
  colors: {
    description: 'VERY old theme store, just colors of V1, probably not even used anymore',
    default: {},
  },
  // V2
  customTheme: {
    description: '"Snapshot", previously was used as actual theme store for V2 so it\'s still used in case of PleromaFE downgrade event.',
    default: null,
  },
  customThemeSource: {
    description: '"Source", stores original theme data',
    default: null,
  },
  // V3
  style: {
    description: 'Style name for builtins',
    default: null,
  },
  styleCustomData: {
    description: 'Custom style data (i.e. not builtin)',
    default: null,
  },
  palette: {
    description: 'Palette name for builtins',
    default: null,
  },
  paletteCustomData: {
    description: 'Custom palette data (i.e. not builtin)',
    default: null,
  },
}
export const THEME_CONFIG = convertDefinitions(
  THEME_CONFIG_DEFINITIONS,
)

export const makeUndefined = (c) =>
  Object.fromEntries(Object.keys(c).map((key) => [key, undefined]))

/// For properties with special processing or properties that does not
/// make sense to be overriden on a instance-wide level.
export const defaultState = {
  // Set these to undefined so it does not interfere with default settings check
  ...makeUndefined(INSTANCE_DEFAULT_CONFIG),
  ...makeUndefined(LOCAL_DEFAULT_CONFIG),
  ...makeUndefined(THEME_CONFIG),
}

export const validateSetting = ({
  value,
  path,
  definition,
  throwError,
  defaultState,
}) => {
  if (value === undefined) return // only null is allowed as missing value
  if (get(defaultState, path) === undefined) {
    const string = `Unknown instance option ${path}, value: ${value}`

    if (throwError) {
      throw new Error(string)
    } else {
      console.error(string)
      return value
    }
  }

  let { required, type, default: defaultValue } = definition

  if (type == null && defaultValue != null) {
    type = typeof defaultValue
  }

  if (required && value == null) {
    const string = `Value required for setting ${path} but was provided nullish; defaulting`

    if (throwError) {
      throw new Error(string)
    } else {
      console.error(string)
      return defaultValue
    }
  }

  if (value !== null && type != null && typeof value !== type) {
    const string = `Invalid type for setting ${path}: expected type ${type}, got ${typeof value}, value ${value}; defaulting`

    if (throwError) {
      throw new Error(string)
    } else {
      console.error(string)
      return defaultValue
    }
  }

  return value
}
