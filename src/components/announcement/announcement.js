import { mapState } from 'pinia'

import AnnouncementEditor from 'src/components/announcement_editor/announcement_editor.vue'
import localeService from '../../services/locale/locale.service.js'

import { useAnnouncementsStore } from 'src/stores/announcements.js'
import { useUsersStore } from 'src/stores/users.js'

const Announcement = {
  components: {
    AnnouncementEditor,
  },
  data() {
    return {
      editing: false,
      editedAnnouncement: {
        content: '',
        startsAt: undefined,
        endsAt: undefined,
        allDay: undefined,
      },
      editError: '',
    }
  },
  props: {
    announcement: Object,
  },
  computed: {
    ...mapState(useUsersStore, ['currentUser']),
    canEditAnnouncement() {
      return this.currentUser?.privileges.has(
        'announcements_manage_announcements',
      )
    },
    content() {
      return this.announcement.content
    },
    isRead() {
      return this.announcement.read
    },
    publishedAt() {
      const time = this.announcement.published_at
      if (!time) {
        return
      }

      return this.formatTimeOrDate(
        time,
        localeService.internalToBrowserLocale(this.$i18n.locale),
      )
    },
    startsAt() {
      const time = this.announcement.starts_at
      if (!time) {
        return
      }

      return this.formatTimeOrDate(
        time,
        localeService.internalToBrowserLocale(this.$i18n.locale),
      )
    },
    endsAt() {
      const time = this.announcement.ends_at
      if (!time) {
        return
      }

      return this.formatTimeOrDate(
        time,
        localeService.internalToBrowserLocale(this.$i18n.locale),
      )
    },
    inactive() {
      return this.announcement.inactive
    },
  },
  methods: {
    markAsRead() {
      if (!this.isRead) {
        return useAnnouncementsStore().markAnnouncementAsRead(
          this.announcement.id,
        )
      }
    },
    deleteAnnouncement() {
      return useAnnouncementsStore().deleteAnnouncement(this.announcement.id)
    },
    formatTimeOrDate(time, locale) {
      const d = new Date(time)
      return this.announcement.all_day
        ? d.toLocaleDateString(locale)
        : d.toLocaleString(locale)
    },
    enterEditMode() {
      this.editedAnnouncement.content = this.announcement.pleroma.raw_content
      this.editedAnnouncement.startsAt = this.announcement.starts_at
      this.editedAnnouncement.endsAt = this.announcement.ends_at
      this.editedAnnouncement.allDay = this.announcement.all_day
      this.editing = true
    },
    submitEdit() {
      useAnnouncementsStore()
        .editAnnouncement({
          id: this.announcement.id,
          ...this.editedAnnouncement,
        })
        .then(() => {
          this.editing = false
        })
        .catch((error) => {
          this.editError = error.error
        })
    },
    cancelEdit() {
      this.editing = false
    },
    clearError() {
      this.editError = undefined
    },
  },
}

export default Announcement
