import Checkbox from 'src/components/checkbox/checkbox.vue'
import UserCard from 'src/components/user_card/user_card.vue'
import BooleanSetting from '../helpers/boolean_setting.vue'
import SharedComputedObject from '../helpers/shared_computed_object.js'

import { useOAuthStore } from 'src/stores/oauth.js'
import { useUsersStore } from 'src/stores/users.js'

import { updateProfile } from 'src/api/user.js'

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
      locked: useUsersStore().currentUser.locked,
    }
  },
  components: {
    UserCard,
    Checkbox,
    BooleanSetting,
  },
  computed: {
    user() {
      return useUsersStore().currentUser
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
        .then((result) => {
          useUsersStore().addNewUsers(result)
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
