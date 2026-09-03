import { last } from 'lodash-es'

import ConfirmModal from 'src/components/confirm_modal/confirm_modal.vue'
import Popover from 'src/components/popover/popover.vue'

import { useAdminSettingsStore } from 'src/stores/admin_settings.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useUsersStore } from 'src/stores/users.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'

library.add(faChevronDown)

const FORCE_NSFW = 'mrf_tag:media-force-nsfw'
const STRIP_MEDIA = 'mrf_tag:media-strip'
const FORCE_UNLISTED = 'mrf_tag:force-unlisted'
const DISABLE_REMOTE_SUBSCRIPTION = 'mrf_tag:disable-remote-subscription'
const DISABLE_ANY_SUBSCRIPTION = 'mrf_tag:disable-any-subscription'
const SANDBOX = 'mrf_tag:sandbox'
const QUARANTINE = 'mrf_tag:quarantine'
const TAGS = new Set([
  FORCE_NSFW,
  STRIP_MEDIA,
  FORCE_UNLISTED,
  DISABLE_REMOTE_SUBSCRIPTION,
  DISABLE_ANY_SUBSCRIPTION,
  SANDBOX,
  QUARANTINE,
])

const ENTRIES = [
  {
    check: '!state:activated',
    label: 'user_card.admin_menu.activate_account',
  },
  {
    check: 'state:activated',
    label: 'user_card.admin_menu.deactivate_account',
  },
  {
    separator: true,
  },
  {
    check: '!state:confirmed',
    label: 'user_card.admin_menu.confirm_account',
  },
  {
    check: 'action:resend_confirmation',
    conditions: ['!state:confirmed'],
    label: 'user_card.admin_menu.resend_confirmation',
  },
  // No API for revocation
  // {
  //   check: 'state:confirmed',
  //   label: 'user_card.admin_menu.unconfirm_account',
  // },
  {
    check: '!state:approved',
    conditions: ['property:local'],
    label: 'user_card.admin_menu.approve_account',
  },
  // No API for revocation
  // {
  //   check: 'state:approved',
  //   label: 'user_card.admin_menu.unapprove_account',
  // },
  {
    check: '!state:suggested',
    // conditions: ['property:local'], // TODO Should we allow non-local users in suggested?
    label: 'user_card.admin_menu.suggest_account',
  },
  {
    check: 'state:suggested',
    label: 'user_card.admin_menu.remove_suggested_account',
  },
  {
    separator: true,
  },
  {
    check: 'action:statuses',
    label: 'user_card.admin_menu.show_statuses',
    conditions: ['count:1'],
  },
  {
    separator: true,
  },
  {
    check: 'action:disable_mfa',
    label: 'user_card.admin_menu.disable_mfa',
  },
  {
    check: 'action:require_password_change',
    label: 'user_card.admin_menu.require_password_change',
  },
  {
    separator: true,
  },
  {
    check: '!rights:moderator',
    label: 'user_card.admin_menu.grant_moderator',
    conditions: ['property:local', 'state:activated'],
  },
  {
    check: 'rights:moderator',
    label: 'user_card.admin_menu.revoke_moderator',
    conditions: ['property:local', 'state:activated'],
  },
  {
    check: '!rights:admin',
    label: 'user_card.admin_menu.grant_admin',
    conditions: ['property:local', 'state:activated'],
  },
  {
    check: 'rights:admin',
    label: 'user_card.admin_menu.revoke_admin',
    conditions: ['property:local', 'state:activated'],
  },
  {
    separator: true,
  },
  {
    check: FORCE_NSFW,
    label: 'user_card.admin_menu.force_nsfw',
  },
  {
    check: STRIP_MEDIA,
    label: 'user_card.admin_menu.strip_media',
  },
  {
    check: FORCE_UNLISTED,
    label: 'user_card.admin_menu.force_unlisted',
  },
  {
    check: SANDBOX,
    label: 'user_card.admin_menu.sandbox',
  },
  {
    check: DISABLE_ANY_SUBSCRIPTION,
    conditions: ['property:local'],
    label: 'user_card.admin_menu.disable_any_subscription',
  },
  {
    check: DISABLE_REMOTE_SUBSCRIPTION,
    conditions: ['property:local'],
    label: 'user_card.admin_menu.disable_remote_subscription',
  },
  {
    check: QUARANTINE,
    conditions: ['property:local'],
    label: 'user_card.admin_menu.quarantine',
  },
  {
    separator: true,
  },
  {
    check: 'action:delete',
    label: 'user_card.admin_menu.delete_account',
  },
]

const ModerationTools = {
  props: {
    users: {
      type: Array,
      required: true,
    },
  },
  created() {
    if (this.users.length !== 1) return
    useAdminSettingsStore().getUserData({ user: this.users[0] })
  },
  data() {
    return {
      open: false,
      confirmDialogShow: false,
      confirmDialogTitle: null,
      confirmDialogContent: null,
      confirmDialogConfirm: null,
      confirmDialogAction: null,
      confirmDialogGroup: null,
      confirmDialogName: null,
    }
  },
  components: {
    ConfirmModal,
    Popover,
  },
  computed: {
    ready() {
      return this.users.every((u) => u.adminData)
    },
    entries() {
      return ENTRIES.map(({ check, label, separator, conditions }) => {
        if (separator) return 'separator'
        const [, negateToken, group, name] =
          /^([!~]?)([a-z-_]+):([a-z-_]+)$/.exec(check)

        const hasTag = this.tagsSet.has(`${group}:${name}`)
        const noTag = this.tagsSet.has(`!${group}:${name}`)
        const maybeTag = this.tagsSet.has(`~${group}:${name}`)

        // We are checking for condition to show element, i.e. only show "activate" if user is "deactivated"
        const checkNegated = negateToken === '!' || negateToken === '~'

        // Naturally, new value should also be the same
        const value = checkNegated

        const action = (() => {
          switch (group) {
            case 'rights':
              return () => this.setRight(name, value)
            case 'state':
              return () => this.setStatus(name, value)
            case 'mrf_tag':
              return () => this.setTag(`${group}:${name}`, noTag)
            case 'action': {
              switch (name) {
                case 'delete':
                  return () => this.deleteUsers()
                case 'resend_confirmation':
                  return () => this.resendConfirmationEmail()
                case 'disable_mfa':
                  return () => this.disableMFA()
                case 'statuses':
                  return () =>
                    this.$router.push(`/users/\$${this.users[0].id}/admin_view`)
                case 'require_password_change':
                  return () => this.requirePasswordChange()
                default:
                  throw new Error(`Unknown action group: ${name}`)
              }
            }
            default:
              throw new Error(`Unknown moderation group: ${group}`)
          }
        })()

        let checkboxClass = ''
        if (maybeTag) {
          checkboxClass = 'menu-checkbox-indeterminate'
        } else if (hasTag) {
          checkboxClass = 'menu-checkbox-checked'
        }

        return {
          check,
          negateToken,
          checkbox: group === 'mrf_tag',
          checkboxClass,
          conditions,
          group,
          name,
          action,
          label,
          value,
        }
      })
        .filter((entry) => {
          if (entry === 'separator') return true
          const { group, name, value, conditions } = entry

          if (conditions) {
            // Checking that all items match positive criteria
            const positive = conditions.every((condition) =>
              this.totalSet.has(condition),
            )
            // Checking that there are no items that don't match criteria
            const negative = conditions.some((condition) =>
              this.totalSet.has('!' + condition),
            )
            if (!(positive && !negative)) return false
          }

          switch (group) {
            case 'action':
              if (name === 'statuses') return this.privileged('users_read')
              else return true
            case 'rights':
              return this.canGrantRole(name, value)
            case 'state':
              return this.canChangeState(name, value)
            case 'mrf_tag':
              return this.canUseTagPolicy
            default: {
              throw new Error(`Unknown moderation group: ${group}`)
            }
          }
        })
        .reduce((acc, entry, index) => {
          // Removing any double separators as well
          // as separators at very end and bery beginning
          if (entry === 'separator') {
            if (
              acc.length === 0 ||
              last(acc) === 'separator' ||
              index === ENTRIES.length - 1
            ) {
              return acc
            }
          }
          return [...acc, entry]
        }, [])
    },
    rightsSet() {
      return this.users.reduce((acc, user) => {
        if (user.rights.admin) {
          acc.add('rights:admin')
        } else {
          acc.add('!rights:admin')
        }
        if (user.rights.moderator) {
          acc.add('rights:moderator')
        } else {
          acc.add('!rights:moderator')
        }
        return acc
      }, new Set())
    },
    stateSet() {
      return this.users.reduce((acc, user) => {
        if (!user.deactivated) {
          acc.add('state:activated')
        } else {
          acc.add('!state:activated')
        }
        if (user.adminData?.is_confirmed) {
          acc.add('state:confirmed')
        } else {
          acc.add('!state:confirmed')
        }
        if (user.adminData?.is_approved) {
          acc.add('state:approved')
        } else {
          acc.add('!state:approved')
        }
        if (user.adminData?.is_suggested) {
          acc.add('state:suggested')
        } else {
          acc.add('!state:suggested')
        }
        return acc
      }, new Set())
    },
    tagsSet() {
      const present = new Set()
      const missing = new Set()

      this.users.forEach((user) => {
        TAGS.forEach((tag) => {
          if (user.tags.has(tag)) {
            present.add(tag)
          } else {
            missing.add(tag)
          }
        })
      })

      const result = new Set()

      // Each tag can have three states for given group of users
      TAGS.forEach((tag) => {
        if (present.has(tag) && missing.has(tag)) {
          // Some users have tag, some don't: "~tag"
          result.add(`~${tag}`)
        } else if (missing.has(tag)) {
          // No users have tag: "!tag"
          result.add(`!${tag}`)
        } else {
          // All users have tag: "tag"
          result.add(tag)
        }
      })

      return result
    },
    propertySet() {
      return this.users.reduce((acc, user) => {
        if (user.is_local) {
          acc.add('property:local')
        } else {
          acc.add('!property:local')
        }
        return acc
      }, new Set())
    },
    disabled() {
      return !this.ready || this.users.length === 0
    },
    totalSet() {
      return new Set([
        ...this.rightsSet,
        ...this.stateSet,
        ...this.tagsSet,
        ...this.propertySet,
        `count:${this.users.length}`,
      ])
    },
    canDeleteAccount() {
      return this.privileged('users_delete')
    },
    canUseTagPolicy() {
      return (
        useInstanceCapabilitiesStore().tagPolicyAvailable &&
        this.privileged('users_manage_tags')
      )
    },
    isAdmin() {
      return useUsersStore().currentUser.role === 'admin'
    },
  },
  methods: {
    canGrantRole(name, value) {
      const setEntry = `${value ? '!' : ''}rights:${name}`

      return this.isAdmin && this.totalSet.has(setEntry)
    },
    canChangeState(name, value) {
      const setEntry = `${value ? '!' : ''}state:${name}`
      const privilege = (() => {
        switch (name) {
          case 'activated':
            return 'users_manage_activation_state'
          case 'approved':
            return 'users_manage_invites'
          case 'confirmed':
            return 'users_manage_credentials'
          default:
            return null
        }
      })()

      return this.privileged(privilege) && this.totalSet.has(setEntry)
    },
    doConfirmDialogAction() {
      if (typeof this.confirmDialogAction !== 'function') {
        console.error('Confirm Dialog action is not a function!!')
      }

      this.confirmDialogAction()
      this.clearConfirmDialog()
    },
    clearConfirmDialog() {
      this.confirmDialogShow = false
      this.confirmDialogTitle = null
      this.confirmDialogContent = null
      this.confirmDialogContent2 = null
      this.confirmDialogDanger = false
      this.confirmDialogConfirm = null
      this.confirmDialogAction = null
      this.confirmDialogGroup = null
      this.confirmDialogName = null
    },
    privileged(privilege) {
      if (this.isAdmin) return true
      return useUsersStore().currentUser.privileges.has(privilege)
    },
    setTag(tag, value) {
      useAdminSettingsStore().setUsersTags({
        users: this.users,
        value,
        tags: [tag],
      })
    },
    setRight(right, value) {
      useAdminSettingsStore().setUsersRight({ users: this.users, value, right })
    },
    setStatus(name, value) {
      const noun = (() => {
        switch (name) {
          case 'activated':
            return 'Activation'
          case 'confirmed':
            return 'Confirmation'
          case 'approved':
            return 'Approval'
          case 'suggested':
            return 'Suggestion'
        }
      })()

      useAdminSettingsStore()[`setUsers${noun}Status`]({
        users: this.users,
        value,
      })
    },
    resendConfirmationEmail() {
      useAdminSettingsStore().resendConfirmationEmail({ users: this.users })
    },
    requirePasswordChange() {
      useAdminSettingsStore().requirePasswordChange({ users: this.users })
    },
    disableMFA() {
      this.users.forEach((user) => {
        useAdminSettingsStore().disableMFA({ user })
      })
    },
    deleteUsers() {
      const { id, name } = this.users[0]

      useAdminSettingsStore()
        .deleteUsers({ users: this.users })
        .then((userIds) => {
          if (userIds.length > 1) return

          const isProfile =
            this.$route.name === 'external-user-profile' ||
            this.$route.name === 'user-profile'
          const isTargetUser =
            this.$route.params.name === name || this.$route.params.id === id

          if (isProfile && isTargetUser) {
            window.history.back()
          }
        })
    },
    setOpen(value) {
      this.open = value
    },
    maybeShowConfirm({ group, name, action, value }) {
      this.confirmDialogName = name
      this.confirmDialogGroup = group
      this.confirmDialogAction = () => action()

      switch (group) {
        case 'action': {
          switch (name) {
            case 'delete': {
              this.confirmDialogShow = true
              this.confirmDialogTitle = this.$t(
                'user_card.admin_menu.confirm_modal.delete_title',
              )
              this.confirmDialogDanger = true
              this.confirmDialogContent =
                'user_card.admin_menu.confirm_modal.delete_content'
              this.confirmDialogContent2 =
                'user_card.admin_menu.confirm_modal.delete_content_2'
              this.confirmDialogConfirm = this.$t(
                'user_card.admin_menu.confirm_modal.delete',
              )
              break
            }
            case 'resend_confirmation': {
              this.confirmDialogShow = true
              this.confirmDialogTitle = this.$t(
                'user_card.admin_menu.confirm_modal.resend_confirmation_title',
              )
              this.confirmDialogContent =
                'user_card.admin_menu.confirm_modal.resend_confirmation_content'
              this.confirmDialogConfirm = this.$t(
                'user_card.admin_menu.confirm_modal.send',
              )
              break
            }
            case 'disable_mfa': {
              this.confirmDialogShow = true
              this.confirmDialogTitle = this.$t(
                'user_card.admin_menu.confirm_modal.disable_mfa_title',
              )
              this.confirmDialogContent =
                'user_card.admin_menu.confirm_modal.disable_mfa_content'
              this.confirmDialogConfirm = this.$t('settings.confirm')
              break
            }
            case 'require_password_change': {
              this.confirmDialogShow = true
              this.confirmDialogTitle = this.$t(
                'user_card.admin_menu.confirm_modal.require_password_change_title',
              )
              this.confirmDialogContent =
                'user_card.admin_menu.confirm_modal.require_password_change_content'
              this.confirmDialogConfirm = this.$t('settings.confirm')
              break
            }
          }
          break
        }
        case 'state': {
          switch (name) {
            case 'activated': {
              this.confirmDialogShow = true

              this.confirmDialogTitle = this.$t(
                'user_card.admin_menu.confirm_modal.activate_title',
              )
              this.confirmDialogContent = value
                ? 'user_card.admin_menu.confirm_modal.activate_content'
                : 'user_card.admin_menu.confirm_modal.deactivate_content'
              this.confirmDialogConfirm = value
                ? this.$t('user_card.admin_menu.confirm_modal.activate')
                : this.$t('user_card.admin_menu.confirm_modal.deactivate')
              break
            }
            // Confirmation and Approval statuses cannot be revokedn(no API)
            case 'confirmed': {
              this.confirmDialogTitle = this.$t(
                'user_card.admin_menu.confirm_modal.confirm_title',
              )
              this.confirmDialogContent = //value
                /*?*/ 'user_card.admin_menu.confirm_modal.confirm_content'
              //: 'user_card.admin_menu.confirm_modal.confirm_revoke_content'
              this.confirmDialogConfirm = value
              /*?*/ this.$t('user_card.admin_menu.confirm_modal.confirm')
              //: this.$t('user_card.admin_menu.confirm_modal.revoke')
              break
            }
            case 'approved': {
              this.confirmDialogTitle = this.$t(
                'user_card.admin_menu.confirm_modal.approval_title',
              )
              this.confirmDialogContent = //value
                /*?*/ 'user_card.admin_menu.confirm_modal.approval_content'
              //: 'user_card.admin_menu.confirm_modal.approval_revoke_content'
              this.confirmDialogConfirm = value
              /*?*/ this.$t('user_card.admin_menu.confirm_modal.approve')
              //: this.$t('user_card.admin_menu.confirm_modal.revoke')
              break
            }
            case 'suggested': {
              this.confirmDialogTitle = this.$t(
                'user_card.admin_menu.confirm_modal.suggest_title',
              )
              this.confirmDialogContent = value
                ? 'user_card.admin_menu.confirm_modal.add_suggest_content'
                : 'user_card.admin_menu.confirm_modal.remove_suggest_content'
              this.confirmDialogConfirm = value
                ? this.$t('user_card.admin_menu.confirm_modal.add')
                : this.$t('user_card.admin_menu.confirm_modal.remove')
              break
            }
          }
          break
        }
        case 'rights': {
          this.confirmDialogTitle = this.$t(
            'user_card.admin_menu.confirm_modal.user_rights_title',
          )
          this.confirmDialogContent = value
            ? 'user_card.admin_menu.confirm_modal.grant_role_content'
            : 'user_card.admin_menu.confirm_modal.revoke_role_content'
          this.confirmDialogConfirm = value
            ? this.$t('user_card.admin_menu.confirm_modal.grant')
            : this.$t('user_card.admin_menu.confirm_modal.revoke')
          break
        }
        case 'mrf_tag': {
          this.confirmDialogTitle = this.$t(
            'user_card.admin_menu.user_tag_title',
          )
          this.confirmDialogContent = value
            ? 'user_card.admin_menu.confirm_modal.assign_tag_content'
            : 'user_card.admin_menu.confirm_modal.unassign_tag_content'
          this.confirmDialogConfirm = value
            ? this.$t('user_card.admin_menu.confirm_modal.assign')
            : this.$t('user_card.admin_menu.confirm_modal.unassign')
          break
        }
      }

      if (this.users.length > 1) {
        this.confirmDialogShow = true
      }

      if (!this.confirmDialogShow) {
        this.doConfirmDialogAction()
      }
    },
  },
}

export default ModerationTools
