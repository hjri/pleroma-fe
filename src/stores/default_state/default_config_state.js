import { get } from 'lodash-es'

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
  name: {
    description: 'Instance Name',
    type: 'string',
    required: false,
  },
}
export const INSTANCE_IDENTITY_DEFAULT = convertDefinitions(
  INSTANCE_IDENTITY_DEFAULT_DEFINITIONS,
)
export const INSTANCE_IDENTIY_EXTERNAL = new Set([
  'tos',
  'instanceSpecificPanelContent',
])

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
    label: 'settings.hide_isp',
  },
  allowForeignUserBackground: {
    description: "Allow other user's profiles to override wallpaper",
    default: true,
    label: 'settings.foreign_user_background',
  },
  hideInstanceWallpaper: {
    description: 'Hide Instance default background',
    default: false,
    label: 'settings.hide_wallpaper',
  },
  hideShoutbox: {
    description: 'Hide shoutbox if present',
    default: false,
    label: 'settings.hide_shoutbox',
  },
  hideMutedPosts: {
    // bad name
    description: 'Hide posts of muted users entirely',
    default: false,
    parent: 'hideFilteredStatuses',
    parentInvert: true,
    label: 'settings.hide_muted_posts',
  },
  hideMutedThreads: {
    description: 'Hide muted threads entirely',
    default: true,
    parent: 'hideFilteredStatuses',
    parentInvert: true,
    label: 'settings.hide_muted_threads',
  },
  hideWordFilteredPosts: {
    description: 'Hide wordfiltered posts entirely',
    parent: 'hideFilteredStatuses',
    parentInvert: true,
    default: false,
    label: 'settings.hide_filtered_statuses',
  },
  muteBotStatuses: {
    description: 'Mute posts made by bots',
    default: false,
    label: 'settings.mute_bot_posts',
  },
  muteSensitiveStatuses: {
    description: 'Mute posts marked as NSFW',
    default: false,
    label: 'settings.mute_sensitive_posts',
  },
  collapseMessageWithSubject: {
    description: 'Collapse posts with subject',
    default: false,
    label: 'settings.collapse_subject',
  },
  padEmoji: {
    description: 'Pad emoji with spaces when using emoji picker',
    default: true,
    label: 'settings.pad_emoji',
  },
  hideScrobbles: {
    description: 'Hide scrobbles',
    default: false,
    label: 'settings.hide_scrobbles',
  },
  hideScrobblesAfter: {
    description: 'Hide scrobbles older than',
    default: '2d',
    label: 'settings.hide_scrobbles_after',
    units: ['m', 'h', 'd'],
    unitSet: 'time',
  },
  maxThumbnails: {
    description: 'Maximum attachments to show',
    default: 16,
    label: 'settings.max_thumbnails',
    min: 0,
  },
  loopVideo: {
    description: 'Loop videos',
    default: true,
    expert: 1,
    label: 'settings.use_one_click_nsfw',
  },
  loopVideoSilentOnly: {
    description: 'Loop only videos without sound',
    default: true,
    expert: 1,
    parent: 'loopVideo',
    label: 'settings.loop_video_silent_only',
  },
  /// This is not the streaming API configuration, but rather an option
  /// for automatically loading new posts into the timeline without
  /// the user clicking the Show New button.
  streaming: {
    description: 'Automatically show new posts',
    default: false,
    label: 'settings.streaming',
  },
  pauseOnUnfocused: {
    description: 'Pause showing new posts when tab is unfocused',
    default: true,
    parent: 'streaming',
    label: 'settings.pause_on_unfocused',
  },
  timelinePagination: {
    description: 'Use pagination instead of infinite scrolling',
    default: false,
    label: 'settings.timeline_pagination',
  },
  emojiReactionsOnTimeline: {
    description: 'Show emoji reactions on timeline',
    default: true,
    expert: 1,
    label: 'settings.emoji_reactions_on_timeline',
  },
  alwaysShowNewPostButton: {
    description: 'Always show mobile "new post" button, even in desktop mode',
    default: false,
    expert: 1,
    label: 'settings.always_show_post_button',
  },
  autohideFloatingPostButton: {
    description:
      'Automatically hide mobile "new post" button when scrolling down',
    default: false,
    expert: 1,
    label: 'settings.autohide_floating_post_button',
  },
  stopGifs: {
    description: 'Play animated gifs on hover only',
    default: true,
    label: 'settings.stop_gifs',
  },
  nonSquareEmoji: {
    description: 'Allow emoji to be non-square (max 3:1 aspect)',
    default: true,
    label: 'settings.non_square_emoji',
  },
  pauseMfm: {
    description: 'Pause MFM animations',
    default: true,
    label: 'settings.pause_mfm',
  },
  scaleMfm: {
    description: 'Scale MFM animation with emoji size',
    default: false,
    label: 'settings.scale_mfm',
  },
  replyVisibility: {
    description: 'Type of replies to show',
    default: 'all',
    label: 'settings.replies_in_timeline',
    options: ['all', 'following', 'self'],
    optionLabel: (key) => `settings.reply_visibility_${key}`,
  },
  thirdColumnMode: {
    description: 'What to display in third column',
    default: 'notifications',
    label: 'settings.third_column_mode',
    options: ['none', 'notifications', 'postform'],
    optionLabel: (key) => `settings.third_column_mode_${key}`,
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
    expert: 1,
    label: 'settings.enable_web_push_notifications',
  },
  webPushAlwaysShowNotifications: {
    description: 'Ignore filter when using WebPush',
    parent: 'webPushNotifications',
    default: false,
    label: 'settings.enable_web_push_always_show',
  },
  interfaceLanguage: {
    description: 'UI language',
    default: [browserLocale],
  },
  hideScopeNotice: {
    description: 'Hide scope notification',
    default: false,
  },
  scopeCopy: {
    description: 'Copy scope like mastodon does',
    default: true,
    label: 'settings.scope_copy',
  },
  subjectLineBehavior: {
    description: 'How to treat subject line',
    default: 'email',
    label: 'settings.subject_line_behavior',
    options: ['email', 'noop', 'masto'],
    optionLabel: (key) =>
      `settings.subject_line_${key === 'masto' ? 'mastodon' : key}`,
  },
  alwaysShowSubjectInput: {
    description: 'Always show subject line field',
    default: true,
    label: 'settings.subject_input_always_show',
  },
  minimalScopesMode: {
    description: 'Minimize amount of options shown in scope selector',
    default: false,
    label: 'settings.minimal_scopes_mode',
  },

  // This hides statuses filtered via a word filter
  hideFilteredStatuses: {
    description: 'Hide wordfiltered entirely',
    default: false,
    expert: 1,
    parent: 'hideWordFilteredPosts',
    parentInvert: true,
    label: 'settings.hide_muted_statuses',
  },

  // Confirmations
  modalOnRepeat: {
    description: 'Show confirmation modal for repeat',
    default: false,
    label: 'settings.confirm_dialogs_repeat',
  },
  modalOnUnfollow: {
    description: 'Show confirmation modal for unfollow',
    default: false,
    label: 'settings.confirm_dialogs_unfollow',
  },
  modalOnBlock: {
    description: 'Show confirmation modal for block',
    default: true,
    label: 'settings.confirm_dialogs_block',
  },
  modalOnMuteConversation: {
    description: 'Show confirmation modal for mute conversation',
    default: false,
    label: 'settings.confirm_dialogs_mute_conversation',
  },
  modalOnMuteDomain: {
    description: 'Show confirmation modal for mute domain',
    default: true,
    label: 'settings.confirm_dialogs_mute_domain',
  },
  modalOnDelete: {
    description: 'Show confirmation modal for delete',
    default: true,
    label: 'settings.confirm_dialogs_delete',
  },
  modalOnLogout: {
    description: 'Show confirmation modal for logout',
    default: true,
    label: 'settings.confirm_dialogs_logout',
  },
  modalOnApproveFollow: {
    description: 'Show confirmation modal for approve follow',
    default: false,
    label: 'settings.confirm_dialogs_approve_follow',
  },
  modalOnDenyFollow: {
    description: 'Show confirmation modal for deny follow',
    default: false,
    label: 'settings.confirm_dialogs_deny_follow',
  },
  modalOnRemoveUserFromFollowers: {
    description: 'Show confirmation modal for follower removal',
    default: false,
    label: 'settings.confirm_dialogs_remove_follower',
  },

  // Expiry confirmations/default actions
  onMuteDefaultAction: {
    description: 'Default action when muting user',
    default: 'ask',
    label: 'user_card.default_expiration_time',
    units: ['s', 'm', 'h', 'd'],
    unitSet: 'time',
    min: 0,
  },
  onBlockDefaultAction: {
    description: 'Default action when blocking user',
    default: 'ask',
    label: 'user_card.default_expiration_time',
    units: ['s', 'm', 'h', 'd'],
    unitSet: 'time',
    min: 0,
  },

  modalMobileCenter: {
    description: 'Center mobile dialogs vertically',
    default: false,
    label: 'settings.mobile_center_dialog',
  },
  playVideosInModal: {
    description: 'Play videos in gallery view',
    default: false,
    expert: 1,
    label: 'settings.play_videos_in_modal',
  },
  useContainFit: {
    description: 'Use object-fit: contain for attachments',
    default: true,
    expert: 1,
    label: 'settings.use_contain_fit',
  },
  disableStickyHeaders: {
    description: 'Disable sticky headers',
    default: false,
    label: 'settings.disable_sticky_headers',
  },
  showScrollbars: {
    description: 'Always show scrollbars',
    default: false,
    label: 'settings.show_scrollbars',
  },
  userPopoverAvatarAction: {
    description: 'What to do when clicking popover avatar',
    default: 'open',
    label: 'settings.user_popover_avatar_action',
    options: ['close', 'zoom', 'open'],
    optionLabel: (key) => `settings.user_popover_avatar_action_${key}`,
  },
  userPopoverOverlay: {
    description: 'Overlay user popover with centering on avatar',
    default: false,
    expert: 1,
    label: 'settings.user_popover_avatar_overlay',
  },
  userCardLeftJustify: {
    description: 'Justify user bio to the left',
    default: false,
    label: 'settings.user_card_left_justify',
  },
  userCardHidePersonalMarks: {
    description: 'Hide highlight/personal note in user view',
    default: false,
    label: 'settings.user_card_hide_personal_marks',
  },
  forcedRoundness: {
    description: 'Force roundness of the theme',
    default: -1,
    label: 'settings.style.themes3.hacks.force_interface_roundness',
    optionLabel: (key) =>
      `settings.style.themes3.hacks.forced_roundness_mode_${key}`,
    options: ['disabled', 'sharp', 'nonsharp', 'round'].map((mode, i) => [
      mode,
      i - 1,
    ]),
  },
  greentext: {
    description: 'Highlight plaintext >quotes',
    default: false,
  },
  mentionLinkShowTooltip: {
    description: 'Show tooltips for mention links',
    default: true,
    expert: 1,
    label: 'settings.mention_link_use_tooltip',
  },
  mentionLinkShowAvatar: {
    description: 'Show avatar next to mention link',
    default: false,
    label: 'settings.mention_link_show_avatar',
  },
  mentionLinkFadeDomain: {
    description:
      'Mute (fade) domain name in mention links if configured to show it',
    default: true,
    label: 'settings.mention_link_fade_domain',
  },
  mentionLinkShowYous: {
    description: 'Show (you)s when you are mentioned',
    default: false,
    expert: 1,
    label: 'settings.show_yous',
  },
  mentionLinkBoldenYou: {
    description: 'Boldern mentionlink of you',
    default: true,
    expert: 1,
    label: 'settings.mention_link_bolden_you',
  },
  hidePostStats: {
    description: 'Hide post stats (rt, favs)',
    default: false,
    label: 'settings.hide_post_stats',
  },
  hideBotIndication: {
    description: 'Hide bot indicator',
    default: false,
    label: 'settings.hide_actor_type_indication',
  },
  hideUserStats: {
    description: 'Hide user stats (followers etc)',
    default: false,
    label: 'settings.hide_user_stats',
  },
  sensitiveByDefault: {
    description: 'Assume attachments are NSFW by default',
    default: false,
    label: 'settings.sensitive_by_default',
  },
  conversationDisplay: {
    description: 'Style of conversation display',
    default: 'linear',
    label: 'settings.conversation_display',
    options: ['tree', 'linear'],
    optionLabel: (key) => `settings.conversation_display_${key}`,
  },
  conversationTreeAdvanced: {
    description: 'Advanced features of tree view conversation',
    default: false,
    label: 'settings.tree_advanced',
  },
  conversationOtherRepliesButton: {
    description: 'Where to show "other replies" in tree conversation view',
    default: 'below',
    expert: 1,
    label: 'settings.conversation_other_replies_button',
    options: ['below', 'inside'],
    optionLabel: (key) => `settings.conversation_other_replies_button_${key}`,
  },
  conversationTreeFadeAncestors: {
    description: 'Fade ancestors in tree conversation view',
    default: false,
    expert: 1,
    label: 'settings.tree_fade_ancestors',
  },
  showExtraNotifications: {
    description:
      'Show extra notifications (chats, announcements etc) in notification panel',
    default: true,
    label: 'settings.notification_show_extra',
  },
  showExtraNotificationsTip: {
    description: 'Show tip for extra notifications (that user can remove them)',
    default: true,
    label: 'settings.notification_extra_tip',
    parent: 'showExtraNotifications',
  },
  showChatsInExtraNotifications: {
    description: 'Show chat messages in notifications',
    default: true,
    label: 'settings.notification_extra_chats',
    parent: 'showExtraNotifications',
  },
  showAnnouncementsInExtraNotifications: {
    description: 'Show announcements in notifications',
    default: true,
    label: 'settings.notification_extra_announcements',
    parent: 'showExtraNotifications',
  },
  showFollowRequestsInExtraNotifications: {
    description: 'Show follow requests in notifications',
    default: true,
    label: 'settings.notification_extra_follow_requests',
    parent: 'showExtraNotifications',
  },
  maxDepthInThread: {
    description: 'Maximum depth in tree conversation view',
    default: 6,
    expert: 1,
    label: 'settings.max_depth_in_thread',
    min: 3,
  },
  autocompleteSelect: {
    description: '',
    default: false,
    expert: 1,
    label: 'settings.autocomplete_select_first',
  },
  closingDrawerMarksAsSeen: {
    description: 'Closing mobile notification pane marks everything as seen',
    default: true,
    label: 'settings.notification_setting_drawer_marks_as_seen',
  },
  unseenAtTop: {
    description: 'Show unseen notifications above others',
    expert: 1,
    default: false,
    label: 'settings.notification_setting_unseen_at_top',
  },
  ignoreInactionableSeen: {
    description: 'Treat inactionable (fav, rt etc) notifications as "seen"',
    default: false,
    label: 'settings.notification_setting_ignore_inactionable_seen',
  },
  unsavedPostAction: {
    description: 'What to do if post is aborted',
    default: 'confirm',
    expert: 1,
    label: 'settings.unsaved_post_action',
    options: ['save', 'discard', 'confirm'],
    optionLabel: (key) => `settings.unsaved_post_action_${key}`,
  },
  autoSaveDraft: {
    description: 'Save drafts automatically',
    default: false,
    label: 'settings.auto_save_draft',
  },
  useAbsoluteTimeFormat: {
    description: 'Use absolute time format',
    default: false,
    label: 'settings.absolute_time_format',
  },
  absoluteTimeFormatMinAge: {
    description: 'Show absolute time format only after this post age',
    default: '0d',
    label: 'settings.absolute_time_format_min_age',
    min: 0,
    unitSet: 'time',
    units: ['s', 'm', 'h', 'd'],
  },
  absoluteTime12h: {
    description: 'Use 24h time format',
    default: '24h',
    label: 'settings.absolute_time_format_12h',
    options: ['24h', '12h'],
    optionLabel: (key) => `settings.absolute_time_format_12h_${key}`,
  },
  themeChecksum: {
    description: 'Checksum of theme used',
    type: 'string',
    required: false,
  },
  highlights: {
    description: 'User highlights',
    type: 'object',
    required: false,
    default: {},
  },
  underlay: {
    description: 'Underlay override',
    required: true,
    default: 'none',
    label: 'settings.style.themes3.hacks.underlay_overrides',
    optionLabel: (key) =>
      `settings.style.themes3.hacks.underlay_override_mode_${key}`,
    options: ['none', 'opaque', 'transparent'],
  },
  underlineLinks: {
    description: 'Force links to have underline decoration',
    default: false,
    label: 'settings.underline_links',
  },
  widthEfficientPostLayout: {
    description: 'Force post content to take full width',
    default: false,
    label: 'settings.width_efficient_post_layout',
  },
  compactProfiles: {
    description: 'Reduce profile height on user pages',
    default: false,
    label: 'settings.compact_profiles',
  },
}
export const INSTANCE_DEFAULT_CONFIG = convertDefinitions(
  INSTANCE_DEFAULT_CONFIG_DEFINITIONS,
)

const LOCAL_DEFAULT_CONFIG_DEFINITIONS_RAW = {
  // TODO these two used to be separate but since separation feature got broken it doesn't matter
  hideAttachments: {
    description: 'Hide attachments in timeline',
    default: false,
    label: 'settings.hide_attachments_in_tl',
  },
  hideAttachmentsInConv: {
    description: 'Hide attachments in coversation',
    default: false,
    label: 'settings.hide_attachments_in_convo',
  },
  hideNsfw: {
    description: 'Hide nsfw posts',
    default: true,
    label: 'settings.nsfw_clickthrough',
  },
  useOneClickNsfw: {
    description: 'Open NSFW images directly in media modal',
    default: false,
    expert: 1,
    parent: 'hideNsfw',
    label: 'settings.use_one_click_nsfw',
  },
  preloadImage: {
    description: 'Preload images for NSFW',
    default: true,
    expert: 1,
    parent: 'hideNsfw',
    label: 'settings.preload_images',
  },
  postContentType: {
    description: 'Default post content type',
    default: 'text/plain',
    label: 'settings.default_post_status_content_type',
    // Options are derived from instance capabilities
  },
  sidebarRight: {
    description: 'Reverse order of columns',
    default: false,
    label: 'settings.right_sidebar',
  },
  sidebarColumnWidth: {
    description: 'Sidebar column width',
    default: '25rem',
    expert: 1,
    label: 'settings.column_sizes_sidebar',
  },
  contentColumnWidth: {
    description: 'Middle column width',
    default: '45rem',
    expert: 1,
    label: 'settings.column_sizes_content',
  },
  notifsColumnWidth: {
    description: 'Notifications column width',
    default: '25rem',
    expert: 1,
    label: 'settings.column_sizes_notifs',
  },
  themeEditorMinWidth: {
    description: 'Hack for theme editor on mobile',
    default: '0rem',
    expert: 1,
    label: 'settings.theme_editor_min_width',
    units: ['px', 'rem'],
    step: 0.1,
    min: 0,
  },
  emojiReactionsScale: {
    description: 'Emoji reactions scale factor',
    default: 0.5,
    label: 'settings.emoji_reactions_scale',
  },
  textSize: {
    description: 'Font size',
    default: '1rem',
    label: 'settings.text_size',
    units: ['px', 'rem'],
    step: 0.1,
    resetDefault: { px: 14, rem: 1 },
    timed: true,
  },
  emojiSize: {
    description: 'Emoji size',
    default: '2.2rem',
    label: 'settings.emoji_size',
    units: ['px', 'rem'],
    step: 0.1,
    resetDefault: { px: 32, rem: 2.2 },
  },
  navbarSize: {
    description: 'Navbar size',
    default: '3.5rem',
    label: 'settings.navbar_size',
    units: ['px', 'rem'],
    step: 0.1,
    resetDefault: { px: 55, rem: 3.5 },
  },
  panelHeaderSize: {
    description: 'Panel header size',
    default: '3.2rem',
    label: 'settings.panel_header_size',
    units: ['px', 'rem'],
    step: 0.1,
    resetDefault: { px: 52, rem: 3.2 },
    timed: true,
  },
  navbarColumnStretch: {
    description: 'Stretch navbar to match columns width',
    default: false,
    label: 'settings.navbar_column_stretch',
  },
  mentionLinkDisplay: {
    description: 'How to display mention links',
    default: 'short',
    label: 'settings.mention_link_display',
    options: ['short', 'full_for_remote', 'full'],
    optionLabel: (key) => `settings.mention_link_display_${key}`,
  },
  imageCompression: {
    description: 'Image compression (WebP/JPEG)',
    default: true,
    expert: 1,
    label: 'settings.image_compression',
  },
  alwaysUseJpeg: {
    description: 'Compress images using JPEG only',
    default: false,
    expert: 1,
    parent: 'imageCompression',
    label: 'settings.always_use_jpeg',
  },
  useStreamingApi: {
    description: 'Streaming API (WebSocket)',
    expert: 1,
    default: false,
    label: 'settings.useStreamingApi',
  },
  fontInterface: {
    description: 'Interface font override',
    type: 'string',
    default: null,
    label: 'settings.interface_font',
  },
  fontInput: {
    description: 'Input font override',
    type: 'string',
    default: null,
    label: 'settings.input_font',
  },
  fontPosts: {
    description: 'Post font override',
    type: 'string',
    default: null,
    label: 'settings.style.fonts.components.post',
  },
  fontMonospace: {
    description: 'Monospace font override',
    type: 'string',
    default: null,
    label: 'settings.style.fonts.components.monospace',
  },
  chatSubmitOnEnter: {
    description: 'Post status on enter key in chats and chat view',
    type: 'boolean',
    default: false,
    label: 'settings.submit_on_enter_in_chats',
  },
  themeDebug: {
    description:
      'Debug mode that uses computed backgrounds instead of real ones to debug contrast functions',
    default: false,
    expert: 1,
    label: 'settings.theme_debug',
  },
  forceThemeRecompilation: {
    description: 'Flag that forces recompilation on boot even if cache exists',
    default: false,
    expert: 1,
    label: 'settings.force_theme_recompilation_debug',
  },
}
export const LOCAL_DEFAULT_CONFIG_DEFINITIONS = Object.fromEntries(
  Object.entries(LOCAL_DEFAULT_CONFIG_DEFINITIONS_RAW).map(([k, v]) => [
    k,
    { ...v, localOnly: true },
  ]),
)
export const LOCAL_DEFAULT_CONFIG = convertDefinitions(
  LOCAL_DEFAULT_CONFIG_DEFINITIONS,
)

export const LOCAL_ONLY_KEYS = new Set(Object.keys(LOCAL_DEFAULT_CONFIG))

export const SYNC_DEFAULT_CONFIG_DEFINITIONS = {
  dontShowUpdateNotifs: {
    description: 'Never show update notification (pleroma-tan)',
    default: false,
  },
  collapseNav: {
    description: 'Collapse navigation panel to header only',
    default: false,
  },
  muteFilters: {
    description: 'Object containing mute filters',
    type: 'object',
    default: {},
  },
}
export const SYNC_DEFAULT_CONFIG = convertDefinitions(
  SYNC_DEFAULT_CONFIG_DEFINITIONS,
)
export const SYNC_ONLY_KEYS = new Set(Object.keys(SYNC_DEFAULT_CONFIG))

export const THEME_CONFIG_DEFINITIONS = {
  theme: {
    description: 'Very old theme store, stores preset name, still in use',
    default: null,
  },
  colors: {
    description:
      'VERY old theme store, just colors of V1, probably not even used anymore',
    default: {},
  },
  // V2
  customTheme: {
    description:
      '"Snapshot", previously was used as actual theme store for V2 so it\'s still used in case of PleromaFE downgrade event.',
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
export const THEME_CONFIG = convertDefinitions(THEME_CONFIG_DEFINITIONS)

export const makeUndefined = (c) =>
  Object.fromEntries(Object.keys(c).map((key) => [key, undefined]))

/// For properties with special processing or properties that does not
/// make sense to be overriden on a instance-wide level.
export const ROOT_CONFIG = {
  // Set these to undefined so it does not interfere with default settings check
  ...INSTANCE_DEFAULT_CONFIG,
  ...LOCAL_DEFAULT_CONFIG,
  ...SYNC_DEFAULT_CONFIG,
  ...THEME_CONFIG,
}

export const ROOT_CONFIG_DEFINITIONS = {
  ...INSTANCE_DEFAULT_CONFIG_DEFINITIONS,
  ...LOCAL_DEFAULT_CONFIG_DEFINITIONS,
  ...SYNC_DEFAULT_CONFIG_DEFINITIONS,
  ...THEME_CONFIG_DEFINITIONS,
}

const maybeThrow = (doThrow, error, fallback) => {
  if (doThrow) {
    throw new Error(error)
  } else {
    console.error(error)
    return fallback
  }
}
export const validateSetting = ({
  value,
  path: fullPath,
  definition,
  throwError,
  defaultState,
  validateObjects = true,
}) => {
  if (value === undefined) return undefined // only null is allowed as missing value
  if (definition === undefined) return undefined // invalid definition
  const path = fullPath.replace(/^simple./, '')
  const depth = path.split('.')
  if (
    validateObjects &&
    definition.type === 'object' &&
    path.split('.').length <= 1
  ) {
    console.error(
      `attempt to set object ${fullPath} instead of its children. ignoring.`,
    )
    return undefined
  }

  if (get(defaultState, path.split('.')[0]) === undefined) {
    const error = `Unknown option ${fullPath}, value: ${value}`

    return maybeThrow(throwError, error)
  }

  let { required, type, default: defaultValue } = definition

  if (type == null && defaultValue != null) {
    type = typeof defaultValue
  }

  if (required && value == null) {
    const error = `Value required for setting ${path} but was provided nullish; defaulting`

    return maybeThrow(throwError, error, defaultValue)
  }

  if (depth > 2 && value !== null && type != null && typeof value !== type) {
    const error = `Invalid type for setting ${path}: expected type ${type}, got ${typeof value}, value ${value}; defaulting`

    return maybeThrow(throwError, error, defaultValue)
  }

  return value
}
