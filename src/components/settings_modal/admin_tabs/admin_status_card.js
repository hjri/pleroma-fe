import Checkbox from 'src/components/checkbox/checkbox.vue'
import Select from 'src/components/select/select.vue'
import Status from 'src/components/status/status.vue'
import { parseStatus } from 'src/services/entity_normalizer/entity_normalizer.service.js'

const AdminStatusCard = {
   props: ['statusDetails'],
   data () {
      return {
         jsonExpanded: false,
         statusCache: undefined,
      }
   },
   computed: {
      isSensitive () {
         return this.statusDetails.sensitive === true
      },
      visibility () {
         return this.statusDetails.visibility
      }
   },
   methods: {
      changeSensitivity (v) {
         this.$store.dispatch('adminChangeStatusScope', { opts: { id: this.statusDetails.id, sensitive: v }}).then(res => parseStatus(res)).then(s => this.statusCache = s)
      },
      changeVisibility (v) {
         this.$store.dispatch('adminChangeStatusScope', { opts: { id: this.statusDetails.id, visibility: v }}).then(res => parseStatus(res)).then(s => this.statusCache = s)
      }
   },
   components: {
      Checkbox,
      Select,
      Status,
   },
   mounted () {
      this.$store.dispatch('adminChangeStatusScope', { opts: { id: this.statusDetails.id }}).then(res => parseStatus(res)).then(s => this.statusCache = s)
   }
}

export default AdminStatusCard
