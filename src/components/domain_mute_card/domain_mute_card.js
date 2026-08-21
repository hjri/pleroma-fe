import ProgressButton from 'src/components/progress_button/progress_button.vue'

import { useUsersStore } from 'src/stores/users.js'

const DomainMuteCard = {
  props: ['domain'],
  components: {
    ProgressButton,
  },
  computed: {
    user() {
      return useUsersStore().currentUser
    },
    muted() {
      return this.user.domainMutes.has(this.domain)
    },
  },
  methods: {
    unmuteDomain() {
      return useUsersStore().unmuteDomain(this.domain)
    },
    muteDomain() {
      return useUsersStore().muteDomain(this.domain)
    },
  },
}

export default DomainMuteCard
