import Checkbox from 'src/components/checkbox/checkbox.vue'
import Select from 'src/components/select/select.vue'
import StatusBody from 'src/components/status_body/status_body.vue'
import { parseStatus } from 'src/services/entity_normalizer/entity_normalizer.service.js'

const AdminStatusCard = {
   props: ['status_details'],
   data () {
      return {
         json_expanded: false,
         status_cache: undefined,
      }
   },
   computed: {
      is_sensitive () {
         return this.status_details.sensitive === true
      },
      visibility () {
         return this.status_details.visibility
      }
   },
   methods: {
      change_sensitivity (v) {
         this.$store.dispatch('adminChangeStatusScope', { opts: { id: this.status_details.id, sensitive: v }}).then(res => parseStatus(res)).then(s => this.status_cache = s)
      },
      change_visibility (v) {
         this.$store.dispatch('adminChangeStatusScope', { opts: { id: this.status_details.id, visibility: v }}).then(res => parseStatus(res)).then(s => this.status_cache = s)
      }
   },
   components: {
      Checkbox,
      Select,
      StatusBody,
   },
   mounted () {
      this.$store.dispatch('adminChangeStatusScope', { opts: { id: this.status_details.id }}).then(res => parseStatus(res)).then(s => this.status_cache = s)
   }
}

export default AdminStatusCard
