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
      return this.user.domainMutes.includes(this.domain)
    },
  },
  methods: {
    unmuteDomain() {
      return this.$store.dispatch('unmuteDomain', this.domain)
    },
    muteDomain() {
      return this.$store.dispatch('muteDomain', this.domain)
    },
  },
}

export default DomainMuteCard
