import Checkbox from 'src/components/checkbox/checkbox.vue'

const AnnouncementEditor = {
  components: {
    Checkbox,
  },
  props: {
    announcement: Object,
    disabled: Boolean,
  },
}

export default AnnouncementEditor
