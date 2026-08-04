import AuthForm from 'src/components/auth_form/auth_form.js'
import BookmarkTimeline from 'src/components/bookmark_timeline/bookmark_timeline.vue'
import BubbleTimeline from 'src/components/bubble_timeline/bubble_timeline.vue'
import ConversationPage from 'src/components/conversation-page/conversation-page.vue'
import DMs from 'src/components/dm_timeline/dm_timeline.vue'
import FriendsTimeline from 'src/components/friends_timeline/friends_timeline.vue'
import NavPanel from 'src/components/nav_panel/nav_panel.vue'
import PublicAndExternalTimeline from 'src/components/public_and_external_timeline/public_and_external_timeline.vue'
import PublicTimeline from 'src/components/public_timeline/public_timeline.vue'
import QuotesTimeline from 'src/components/quotes_timeline/quotes_timeline.vue'
import RemoteUserResolver from 'src/components/remote_user_resolver/remote_user_resolver.vue'
import TagTimeline from 'src/components/tag_timeline/tag_timeline.vue'

import { useInstanceStore } from 'src/stores/instance.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'

export default (store) => {
  const validateAuthenticatedRoute = (to, from, next) => {
    if (store.state.users.currentUser) {
      next()
    } else {
      next(
        useInstanceStore().instanceIdentity.redirectRootNoLogin || '/main/all',
      )
    }
  }

  let routes = [
    {
      name: 'root',
      path: '/',
      redirect: () => {
        return (
          (store.state.users.currentUser
            ? useInstanceStore().instanceIdentity.redirectRootLogin
            : useInstanceStore().instanceIdentity.redirectRootNoLogin) ||
          '/main/all'
        )
      },
    },
    {
      name: 'public-external-timeline',
      path: '/main/all',
      component: PublicAndExternalTimeline,
    },
    {
      name: 'public-timeline',
      path: '/main/public',
      component: PublicTimeline,
    },
    {
      name: 'friends',
      path: '/main/friends',
      component: FriendsTimeline,
      beforeEnter: validateAuthenticatedRoute,
    },
    { name: 'tag-timeline', path: '/tag/:tag', component: TagTimeline },
    { name: 'bookmarks', path: '/bookmarks', component: BookmarkTimeline },
    { name: 'bubble', path: '/bubble', component: BubbleTimeline },
    {
      name: 'conversation',
      path: '/notice/:id',
      component: ConversationPage,
      meta: { dontScroll: true },
    },
    {
      name: 'conversation2',
      path: '/conversation/:statusId',
      component: () => import('src/components/chat_view/chat_view.vue'),
      props: true,
      meta: { dontScroll: true },
      beforeEnter: validateAuthenticatedRoute,
    },
    { name: 'quotes', path: '/notice/:id/quotes', component: QuotesTimeline },
    {
      name: 'remote-user-profile-acct',
      path: '/remote-users/:_(@)?:username([^/@]+)@:hostname([^/@]+)',
      component: RemoteUserResolver,
      beforeEnter: validateAuthenticatedRoute,
    },
    {
      name: 'remote-user-profile',
      path: '/remote-users/:hostname/:username',
      component: RemoteUserResolver,
      beforeEnter: validateAuthenticatedRoute,
    },
    {
      name: 'external-user-profile',
      path: '/users/$:id',
      component: () => import('src/components/user_profile/user_profile.vue'),
    },
    {
      name: 'user-profile-admin-view',
      path: '/users/$:id/admin_view',
      component: () =>
        import('src/components/user_profile/user_profile_admin_view.vue'),
    },
    {
      name: 'interactions',
      path: '/users/:username/interactions',
      component: () => import('src/components/interactions/interactions.vue'),
      beforeEnter: validateAuthenticatedRoute,
    },
    {
      name: 'dms',
      path: '/users/:username/dms',
      component: DMs,
      beforeEnter: validateAuthenticatedRoute,
    },
    {
      name: 'registration',
      path: '/registration',
      component: () => import('src/components/registration/registration.vue'),
    },
    {
      name: 'password-reset',
      path: '/password-reset',
      component: () =>
        import('src/components/password_reset/password_reset.vue'),
      props: true,
    },
    {
      name: 'registration-token',
      path: '/registration/:token',
      component: () => import('src/components/registration/registration.vue'),
    },
    {
      name: 'friend-requests',
      path: '/friend-requests',
      component: () =>
        import('src/components/follow_requests/follow_requests.vue'),
      beforeEnter: validateAuthenticatedRoute,
    },
    {
      name: 'notifications',
      path: '/:username/notifications',
      component: () => import('src/components/notifications/notifications.vue'),
      props: () => ({ disableTeleport: true }),
      beforeEnter: validateAuthenticatedRoute,
    },
    {
      name: 'login',
      path: '/login',
      component: AuthForm,
    },
    {
      name: 'shout-panel',
      path: '/shout-panel',
      component: () => import('src/components/shout_panel/shout_panel.vue'),
      props: () => ({ floating: false }),
    },
    {
      name: 'oauth-callback',
      path: '/oauth-callback',
      component: () =>
        import('src/components/oauth_callback/oauth_callback.vue'),
      props: (route) => ({ code: route.query.code }),
    },
    {
      name: 'search',
      path: '/search',
      component: () => import('src/components/search/search.vue'),
      props: (route) => ({ query: route.query.query }),
    },
    {
      name: 'who-to-follow',
      path: '/who-to-follow',
      component: () => import('src/components/who_to_follow/who_to_follow.vue'),
      beforeEnter: validateAuthenticatedRoute,
    },
    {
      name: 'about',
      path: '/about',
      component: () => import('src/components/about/about.vue'),
    },
    {
      name: 'announcements',
      path: '/announcements',
      component: () =>
        import('src/components/announcements_page/announcements_page.vue'),
    },
    {
      name: 'drafts',
      path: '/drafts',
      component: () => import('src/components/drafts/drafts.vue'),
    },
    {
      name: 'user-profile',
      path: '/users/:name',
      component: () => import('src/components/user_profile/user_profile.vue'),
    },
    {
      name: 'legacy-user-profile',
      path: '/:name',
      component: () => import('src/components/user_profile/user_profile.vue'),
    },
    {
      name: 'lists',
      path: '/lists',
      component: () => import('src/components/lists/lists.vue'),
    },
    {
      name: 'lists-timeline',
      path: '/lists/:id',
      component: () =>
        import('src/components/lists_timeline/lists_timeline.vue'),
    },
    {
      name: 'lists-edit',
      path: '/lists/:id/edit',
      component: () => import('src/components/lists_edit/lists_edit.vue'),
    },
    {
      name: 'lists-new',
      path: '/lists/new',
      component: () => import('src/components/lists_edit/lists_edit.vue'),
    },
    {
      name: 'edit-navigation',
      path: '/nav-edit',
      component: NavPanel,
      props: () => ({ forceExpand: true, forceEditMode: true }),
      beforeEnter: validateAuthenticatedRoute,
    },
    {
      name: 'bookmark-folders',
      path: '/bookmark_folders',
      component: () =>
        import('src/components/bookmark_folders/bookmark_folders.vue'),
    },
    {
      name: 'bookmark-folder-new',
      path: '/bookmarks/new-folder',
      component: () =>
        import('src/components/bookmark_folder_edit/bookmark_folder_edit.vue'),
    },
    {
      name: 'bookmark-folder',
      path: '/bookmarks/:id',
      component: BookmarkTimeline,
    },
    {
      name: 'bookmark-folder-edit',
      path: '/bookmarks/:id/edit',
      component: () =>
        import('src/components/bookmark_folder_edit/bookmark_folder_edit.vue'),
    },
  ]

  if (useInstanceCapabilitiesStore().pleromaChatMessagesAvailable) {
    routes = routes.concat([
      {
        name: 'chat',
        path: '/users/:username/chats/:chatUserId',
        component: () => import('src/components/chat_view/chat_view.vue'),
        meta: { dontScroll: false },
        props: true,
        beforeEnter: validateAuthenticatedRoute,
      },
      {
        name: 'chats',
        path: '/users/:username/chats',
        component: () => import('src/components/chat_list/chat_list.vue'),
        meta: { dontScroll: false },
        beforeEnter: validateAuthenticatedRoute,
      },
    ])
  }

  return routes
}
