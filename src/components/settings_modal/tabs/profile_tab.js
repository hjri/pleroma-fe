import Checkbox from 'src/components/checkbox/checkbox.vue'
import UserCard from 'src/components/user_card/user_card.vue'
import BooleanSetting from '../helpers/boolean_setting.vue'
import SharedComputedObject from '../helpers/shared_computed_object.js'

import { useOAuthStore } from 'src/stores/oauth.js'

import { updateProfile } from 'src/services/api/user.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faCircleNotch,
  faPlus,
  faTimes,
} from '@fortawesome/free-solid-svg-icons'

library.add(faTimes, faPlus, faCircleNotch)

const ProfileTab = {
  data() {
    return {
      // Whether user is locked or not
      locked: this.$store.state.users.currentUser.locked,
    }
  },
  components: {
    UserCard,
    Checkbox,
    BooleanSetting,
  },
  computed: {
    user() {
      return this.$store.state.users.currentUser
    },
    ...SharedComputedObject(),
  },
  methods: {
    updateProfile() {
      const params = {
        locked: this.locked,
      }
      updateProfile({
        params,
        credentials: useOAuthStore().token,
      })
        .then((user) => {
          this.$store.commit('addNewUsers', [user])
          this.$store.commit('setCurrentUser', user)
        })
        .catch((error) => {
          this.displayUploadError(error)
        })
    },
  },
  watch: {
    locked() {
      this.updateProfile()
    },
  },
}

export default ProfileTab
