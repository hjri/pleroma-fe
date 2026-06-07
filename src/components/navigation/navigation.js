// routes that take :username property
export const USERNAME_ROUTES = new Set([
  'dms',
  'interactions',
  'notifications',
  'chat',
  'chats',
])

// routes that take :name property
export const NAME_ROUTES = new Set(['user-profile', 'legacy-user-profile'])

export const TIMELINES = {
  home: {
    route: 'friends',
    icon: 'home',
    label: 'nav.home_timeline',
    criteria: ['!private'],
  },
  public: {
    route: 'public-timeline',
    anon: true,
    icon: 'users',
    label: 'nav.public_tl',
    criteria: ['!private'],
  },
  bubble: {
    route: 'bubble',
    anon: true,
    icon: 'city',
    label: 'nav.bubble',
    criteria: ['!private', 'federating', 'supportsBubbleTimeline'],
  },
  twkn: {
    route: 'public-external-timeline',
    anon: true,
    icon: 'globe',
    label: 'nav.twkn',
    criteria: ['!private', 'federating'],
  },
  // bookmarks are still technically a timeline so we should show it in the dropdown
  bookmarks: {
    route: 'bookmarks',
    icon: 'bookmark',
    label: 'nav.bookmarks',
  },
  favorites: {
    routeObject: { name: 'user-profile', query: { tab: 'favorites' } },
    icon: 'star',
    label: 'user_card.favorites',
  },
  dms: {
    route: 'dms',
    icon: 'envelope',
    label: 'nav.dms',
  },
}

export const ROOT_ITEMS = {
  bookmarks: {
    route: 'bookmarks',
    icon: 'bookmark',
    label: 'nav.bookmarks',
    // shows bookmarks entry in a better suited location
    // hides it when bookmark folders are supported since
    // we show custom component instead of it
    criteria: ['!supportsBookmarkFolders'],
  },
  interactions: {
    route: 'interactions',
    icon: 'bell',
    label: 'nav.interactions',
  },
  chats: {
    route: 'chats',
    icon: 'comments',
    label: 'nav.chats',
    badgeStyle: 'notification',
    badgeGetter: 'unreadChatCount',
    criteria: ['chats'],
  },
  friendRequests: {
    route: 'friend-requests',
    icon: 'user-plus',
    label: 'nav.friend_requests',
    badgeStyle: 'notification',
    criteria: ['lockedUser'],
    badgeGetter: 'followRequestCount',
  },
  about: {
    route: 'about',
    anon: true,
    icon: 'info-circle',
    label: 'nav.about',
  },
  announcements: {
    route: 'announcements',
    icon: 'bullhorn',
    label: 'nav.announcements',
    store: 'announcements',
    badgeStyle: 'notification',
    badgeGetter: 'unreadAnnouncementCount',
    criteria: ['announcements'],
  },
  drafts: {
    route: 'drafts',
    icon: 'file-pen',
    label: 'nav.drafts',
    badgeStyle: 'neutral',
    badgeGetter: 'draftCount',
  },
}

export function routeTo(item, currentUser) {
  if (!item.route && !item.routeObject) return null

  let route

  if (item.routeObject) {
    route = item.routeObject
  } else {
    route = { name: item.anon || currentUser ? item.route : item.anonRoute }
  }

  if (USERNAME_ROUTES.has(route.name)) {
    route.params = { username: currentUser.screen_name }
  } else if (NAME_ROUTES.has(route.name)) {
    route.params = { name: currentUser.screen_name }
  }

  return route
}
