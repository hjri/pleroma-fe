import BasicUserCard from '../../basic_user_card/basic_user_card.vue'

const AdminCard = {
  props: ['userId'],
  data () {
    return {
      progress: false
    }
  },
  computed: {
    isLoaded () {
      return typeof(this.user) !== 'undefined'
    },
    user () {
      return this.$store.getters.findUser(this.userId)
    },
    relationship () {
      return this.$store.getters.relationship(this.userId)
    },
  },
  components: {
    BasicUserCard
  },
  methods: {
  }
}

export default AdminCard
