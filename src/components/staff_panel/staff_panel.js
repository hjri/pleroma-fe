import { groupBy, map } from 'lodash-es'
import { mapState } from 'pinia'

import BasicUserCard from 'src/components/basic_user_card/basic_user_card.vue'

import { useInstanceStore } from 'src/stores/instance.js'
import { useUsersStore } from 'src/stores/users.js'

const StaffPanel = {
  created() {
    const nicknames = useInstanceStore().staffAccounts
    nicknames.forEach((name) => useUsersStore().fetchUserIfMissing({ name }))
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
    ...mapState(useUsersStore, ['findUserByName']),
    ...mapState(useInstanceStore, ['staffAccounts']),
  },
}

export default StaffPanel
