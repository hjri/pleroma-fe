import { storeToRefs } from 'pinia'
import { computed, defineAsyncComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Checkbox from 'src/components/checkbox/checkbox.vue'
import Timeago from 'src/components/timeago/timeago.vue'

import { useOAuthTokensStore } from 'src/stores/oauth_tokens.js'

import localeService from 'src/services/locale/locale.service.js'
import wait from 'src/services/wait/wait.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faCircleNotch, faTimes } from '@fortawesome/free-solid-svg-icons'

library.add(faCircleNotch, faTimes)

const Tokens = {
  components: {
    ConfirmModal: defineAsyncComponent(
      () => import('src/components/confirm_modal/confirm_modal.vue'),
    ),
    Checkbox,
    Timeago,
  },
  setup() {
    const { locale } = useI18n()

    // Data
    const { tokens, usTokens } = storeToRefs(useOAuthTokensStore())
    const { fetchTokens, revokeToken } = useOAuthTokensStore()

    fetchTokens()

    const noUs = computed(() => usTokens.value.length === 0)
    const allTokens = computed(() =>
      [...usTokens.value, ...tokens.value].map((t) => ({
        ...t,
        validLocalized: t.validUntil.toLocaleDateString(
          localeService.internalToBrowserLocale(locale.value),
        ),
      })),
    )

    // Selection
    const selected = ref(new Set())
    const allSelected = computed(
      () =>
        selected.value.size > 0 && selected.value.size >= tokens.value.length,
    )
    const someSelected = computed(
      () => selected.value.size > 0 && !allSelected.value,
    )
    const toggleSelect = (id, value) => {
      if (value) {
        selected.value.add(id)
      } else {
        selected.value.delete(id)
      }
    }
    const toggleSelectAll = (value) => {
      if (value) {
        selected.value = new Set(tokens.value.map(({ id }) => id))
      } else {
        selected.value = new Set()
      }
    }

    // Queue management
    const showConfirm = ref(false)
    const revokeQueue = ref([])
    const revokeSingleToken = (id) => {
      revokeQueue.value = [id]
      showConfirm.value = true
    }
    const revokeSelected = () => {
      revokeQueue.value = [...selected.value]
      showConfirm.value = true
    }

    // Queue execution
    const error = ref(null)
    const revokeProgress = ref(false)
    const revokeTokens = async () => {
      if (revokeQueue.value.length === 0) return
      showConfirm.value = false
      revokeProgress.value = true
      try {
        const maxAttempts = 3
        let attempts = 0
        let id = revokeQueue.value.shift()
        while (revokeProgress.value) {
          try {
            attempts++
            await revokeToken(id)
            attempts = 0

            selected.value.delete(id)
            id = revokeQueue.value.shift()
          } catch (e) {
            console.error('Error revoking token:' + e)

            const recoverable = (() => {
              if (e.statusCode) {
                if (e.statusCode >= 400 && e.statusCode < 500) {
                  // 4xx - "We Messed Up"
                  if (e.statusCode === 429) {
                    return true // Throttled / Too Many Requests
                  } else {
                    return false
                  }
                } else {
                  // 5xx - "Server Messed Up", should potentially be recoverable
                  return true
                }
              } else {
                // Probably recoverable
                return true
              }
            })()

            if (attempts > maxAttempts || !recoverable) {
              throw e
            } else {
              await wait(1000)
            }
          } finally {
            if (id !== undefined) {
              await wait(250)
            } else {
              revokeProgress.value = false
            }
          }
        }
      } catch (e) {
        revokeQueue.value = []
        error.value = e
      } finally {
        revokeProgress.value = false
      }
    }
    const revokeAbort = () => {
      revokeQueue.value = []
      revokeProgress.value = false
      showConfirm.value = false
    }

    return {
      noUs,
      allTokens,

      selected,
      toggleSelect,
      toggleSelectAll,
      allSelected,
      someSelected,

      showConfirm,
      error,
      revokeQueue,
      revokeSingleToken,
      revokeSelected,

      revokeProgress,
      revokeTokens,
      revokeAbort,
    }
  },
  methods: {
    revokeToken(id) {
      if (window.confirm(`${this.$i18n.t('settings.revoke_token')}?`)) {
        useOAuthTokensStore().revokeToken(id)
      }
    },
  },
}

export default Tokens
