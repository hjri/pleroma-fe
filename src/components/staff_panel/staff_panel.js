import { map, groupBy } from 'lodash'
import { mapGetters, mapState } from 'vuex'

import BasicUserCard from '../basic_user_card/basic_user_card.vue'

import { useInstanceStore } from 'src/stores/instance.js'

const StaffPanel = {
  created() {
    const nicknames = useInstanceStore().staffAccounts
    nicknames.forEach((nickname) =>
      this.$store.dispatch('fetchUserIfMissing', nickname),
    )
  },
  components: {
    BasicUserCard,
  },
  computed: {
    groupedStaffAccounts() {
      const staffAccounts = map(this.staffAccounts, this.findUserByName).filter(
        (_) => _,
      )
      const groupedStaffAccounts = groupBy(staffAccounts, 'role')

      return [
        { role: 'admin', users: groupedStaffAccounts.admin },
        { role: 'moderator', users: groupedStaffAccounts.moderator },
      ].filter((group) => group.users)
    },
    ...mapGetters(['findUserByName']),
    ...mapState({
      staffAccounts: (state) => useInstanceStore().staffAccounts,
    }),
  },
}

export default StaffPanel
