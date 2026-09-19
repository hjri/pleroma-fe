import { debounce } from 'lodash-es'
import { computed, ref, watch } from 'vue'

import BasicUserCard from 'src/components/basic_user_card/basic_user_card.vue'
import List from 'src/components/list/list.vue'

import { useSearchStore } from 'src/stores/search.js'
import { useUsersStore } from 'src/stores/users.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faCircleNotch,
  faPencil,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'

library.add(faCircleNotch, faPencil, faXmark)

const UserSelectorInput = {
  components: {
    BasicUserCard,
    List,
  },
  props: {
    modelValue: String,
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const usernameInput = ref('')
    watch(props.modelValue, () => {
      if (props.modelValue) {
        useUsersStore().fetchUserIfMissing({ id: props.modelValue })
      }
    })
    const editing = ref(!props.modelValue)
    const user = computed(() => {
      if (props.modelValue) {
        return useUsersStore().findUser(props.modelValue)
      }
      return null
    })

    const searchResults = ref([])
    const loading = ref(false)
    const outdated = computed(() => searchResults.value.length && loading.value)
    const debouncedLoad = debounce((newQuery) => {
      let cancelled = false
      if (newQuery) {
        useSearchStore()
          .searchUsers({ query: newQuery })
          .then((users) => {
            loading.value = false
            if (!cancelled) {
              searchResults.value = users
            }
          })
      } else {
        searchResults.value = []
        loading.value = false
      }
      return () => {
        cancelled = true
      }
    }, 1000)
    watch(usernameInput, (newQuery, _, onCleanup) => {
      loading.value = true
      const cancel = debouncedLoad(newQuery)
      onCleanup(() => {
        if (cancel) {
          cancel()
        }
      })
    })

    const selectUser = (user) => {
      emit('update:modelValue', user.id)
      editing.value = false
    }

    const clear = () => {
      emit('update:modelValue', '')
      editing.value = false
    }

    return {
      user,
      usernameInput,
      searchResults,
      loading,
      outdated,
      editing,
      selectUser,
      clear,
    }
  },
}

export default UserSelectorInput
