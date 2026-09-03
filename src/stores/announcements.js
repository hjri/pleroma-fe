import { defineStore } from 'pinia'

import { useOAuthStore } from 'src/stores/oauth.js'
import { useUsersStore } from 'src/stores/users.js'

import { dismissAnnouncement, getAnnouncements } from 'src/api/user.js'

const FETCH_ANNOUNCEMENT_INTERVAL_MS = 1000 * 60 * 5

export const useAnnouncementsStore = defineStore('announcements', {
  state: () => ({
    announcements: [],
    supportsAnnouncements: true,
    fetchAnnouncementsTimer: undefined,
    adminActions: {},
    userActions: {},
  }),
  getters: {
    unreadAnnouncementsCount() {
      if (!useUsersStore().currentUser) {
        return 0
      }

      const unread = this.announcements.filter(
        (announcement) => !(announcement.inactive || announcement.read),
      )
      return unread.length
    },
  },
  actions: {
    async fetchAnnouncements() {
      if (!this.supportsAnnouncements) return

      const currentUser = useUsersStore().currentUser
      const isAdmin =
        currentUser &&
        currentUser.privileges.has('announcements_manage_announcements')

      try {
        if (isAdmin) {
          this.adminActions = await import('src/api/admin.js')
        } else {
          const all = await getAnnouncements({
            credentials: useOAuthStore().token,
          })
          return all.data
        }

        const { data: all } = await this.adminActions.getAnnouncements({
          credentials: useOAuthStore().token,
        })

        const { data: visible } = await getAnnouncements({
          credentials: useOAuthStore().token,
        })

        const visibleObject = visible.reduce((a, c) => {
          a[c.id] = c
          return a
        }, {})

        const getWithinVisible = (announcement) =>
          visibleObject[announcement.id]

        all.forEach((announcement) => {
          const visibleAnnouncement = getWithinVisible(announcement)
          if (!visibleAnnouncement) {
            announcement.inactive = true
          } else {
            announcement.read = visibleAnnouncement.read
          }
        })

        this.announcements = all
      } catch (error) {
        // If and only if backend does not support announcements, it would return 404.
        // In this case, silently ignores it.
        if (error?.statusCode === 404) {
          this.supportsAnnouncements = false
        } else {
          throw error
        }
      }
    },
    markAnnouncementAsRead(id) {
      return dismissAnnouncement({
        id,
        credentials: useOAuthStore().token,
      }).then(() => {
        const index = this.announcements.findIndex((a) => a.id === id)

        if (index < 0) {
          return
        }

        this.announcements[index].read = true
      })
    },
    startFetching() {
      if (this.fetchAnnouncementsTimer) {
        return
      }

      const interval = setInterval(
        () => this.fetchAnnouncements(),
        FETCH_ANNOUNCEMENT_INTERVAL_MS,
      )
      this.fetchAnnouncementsTimer = interval

      return this.fetchAnnouncements()
    },
    stopFetching() {
      const interval = this.fetchAnnouncementsTimer
      this.fetchAnnouncementsTimer = undefined
      clearInterval(interval)
    },
    postAnnouncement({ content, startsAt, endsAt, allDay }) {
      return this.adminActions
        .postAnnouncement({
          credentials: useOAuthStore().token,
          content,
          startsAt,
          endsAt,
          allDay,
        })
        .then(() => {
          return this.fetchAnnouncements()
        })
    },
    editAnnouncement({ id, content, startsAt, endsAt, allDay }) {
      return this.adminActions
        .editAnnouncement({
          id,
          content,
          startsAt,
          endsAt,
          allDay,
          credentials: useOAuthStore().token,
        })
        .then(() => {
          return this.fetchAnnouncements()
        })
    },
    deleteAnnouncement(id) {
      return this.adminActions
        .deleteAnnouncement({
          id,
          credentials: useOAuthStore().token,
        })
        .then(() => {
          return this.fetchAnnouncements()
        })
    },
  },
})
