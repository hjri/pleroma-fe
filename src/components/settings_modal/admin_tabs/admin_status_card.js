import Checkbox from 'src/components/checkbox/checkbox.vue'
import Select from 'src/components/select/select.vue'
import StatusBody from 'src/components/status_body/status_body.vue'
import { parseStatus } from 'src/services/entity_normalizer/entity_normalizer.service.js'

const AdminStatusCard = {
   props: ['statusDetails'],
   data () {
      return {
         json_expanded: false,
         statusCache: undefined,
      }
   },
   computed: {
      is_sensitive () {
         return this.statusDetails.sensitive === true
      },
      visibility () {
         return this.statusDetails.visibility
      }
   },
   methods: {
      change_sensitivity (v) {
         this.$store.dispatch('adminChangeStatusScope', { opts: { id: this.statusDetails.id, sensitive: v }}).then(res => parseStatus(res)).then(p => p).then(s => this.statusCache = s)
      },
      change_visibility (v) {
         this.$store.dispatch('adminChangeStatusScope', { opts: { id: this.statusDetails.id, visibility: v }}).then(res => parseStatus(res)).then(p => p).then(s => this.statusCache = s)
      }
   },
   components: {
      Checkbox,
      Select,
      StatusBody,
   },
   mounted () {
      this.$store.dispatch('adminChangeStatusScope', { opts: { id: this.statusDetails.id }}).then(res => parseStatus(res)).then(p => p).then(s => this.statusCache = s)
   }
}

export default AdminStatusCard
