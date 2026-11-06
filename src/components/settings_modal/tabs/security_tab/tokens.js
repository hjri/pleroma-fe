import { storeToRefs } from 'pinia'
import { ref, computed, defineAsyncComponent } from 'vue'
import { useOAuthTokensStore } from 'src/stores/oauth_tokens.js'
import { useI18n } from 'vue-i18n'
import wait from 'src/services/wait/wait.js'
import localeService from 'src/services/locale/locale.service.js'
import Checkbox from 'src/components/checkbox/checkbox.vue'

const Tokens = {
  components: {
    ConfirmModal: defineAsyncComponent(
      () => import('src/components/confirm_modal/confirm_modal.vue'),
    ),
    Checkbox,
  },
  setup() {
    const { locale } = useI18n()
    const showConfirm = ref(false)

    const {
      tokens,
      usTokens,
    } = storeToRefs(useOAuthTokensStore())
    const {
      fetchTokens,
      revokeToken,
    } = useOAuthTokensStore()
    fetchTokens()

    const allTokens = computed(() => [
      ...usTokens.value,
      ...tokens.value,
    ].map((t) => ({
      ...t,
      validLocalized: t.validUntil.toLocaleDateString(
        localeService.internalToBrowserLocale(locale),
      )
    })))

    const selected = ref(new Set())
    const allSelected = computed(() => selected.value.size >= tokens.value.length)
    const someSelected = computed(() => selected.value.size > 0 && !allSelected.value)
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

    const revokeQueue = ref([])
    const revokeTokens = async () => {
      revokeQueue.value = [...selected.value]

      try {
        const maxAttempts = 3
        let attempts = 0
        while (revokeQueue.value.length > 0) {
          try {
            const id = revokeQueue.value.shift()

            attempts++
            await revokeToken(id)
            attempts = 0

            selected.value.delete(id)
          } catch (e) {
            console.error('Error revoking token:' + e)
            if (attempts > maxAttempts) {
              throw e
            }
          } finally {
            if (revokeQueue.value.length > 0) {
              await wait(250)
            }
          }
        }
      } catch (e) {
        revokeQueue.value = []
      }
    }

    const revokeAbort = () => {
      revokeQueue.value = []
    }

    return {
      showConfirm,

      selected,
      toggleSelect,
      toggleSelectAll,
      allSelected,
      someSelected,

      allTokens,

      revokeQueue,
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
