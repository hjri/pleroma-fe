import Checkbox from 'src/components/checkbox/checkbox.vue'

const List = {
  props: {
    boxOnly: {
      type: Boolean,
      default: false,
    },
    items: {
      type: Array,
      default: [],
    },
    fetchFunction: {
      type: Function,
      default: null,
    },
    itemsFunction: {
      type: Function,
      default: null,
    },
    getKey: {
      type: Function,
      default: (item) => item.id,
    },
    getClass: {
      type: Function,
      default: () => '',
    },
    nonInteractive: {
      type: Boolean,
      default: false,
    },
    scrollable: {
      type: Boolean,
      default: false,
    },
    selectable: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: true,
    },
    bottomedOut: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: null,
    },
  },
  emits: ['fetchRequested'],
  components: {
    Checkbox,
  },
  data() {
    return {
      selected: [],
    }
  },
  computed: {
    allKeys() {
      return this.items.map(this.getKey)
    },
    filteredSelected() {
      return this.allKeys.filter((key) => this.selected.indexOf(key) !== -1)
    },
    allSelected() {
      return this.filteredSelected.length === this.items.length
    },
    noneSelected() {
      return this.filteredSelected.length === 0
    },
    someSelected() {
      return !this.allSelected && !this.noneSelected
    },
  },
  created() {
    window.addEventListener('scroll', this.scrollLoad)

    if (this.items.length === 0) {
      this.fetchEntries()
    }
  },
  unmounted() {
    window.removeEventListener('scroll', this.scrollLoad)
  },
  methods: {
    fetchEntries() {
      this.$emit('fetchRequested')
    },
    scrollLoad(e) {
      if (this.fetchFunction) {
        const bodyBRect = document.body.getBoundingClientRect()
        const height = Math.max(bodyBRect.height, -bodyBRect.y)
        if (
          this.$el.offsetHeight > 0 &&
          window.innerHeight + window.pageYOffset >= height - 750
        ) {
          this.fetchEntries()
        }
      }
    },
    isSelected(item) {
      return this.filteredSelected.indexOf(this.getKey(item)) !== -1
    },
    toggle(checked, item) {
      const key = this.getKey(item)
      const oldChecked = this.isSelected(key)
      if (checked !== oldChecked) {
        if (checked) {
          this.selected.push(key)
        } else {
          this.selected.splice(this.selected.indexOf(key), 1)
        }
      }
      this.$emit('selected', this.selected)
    },
    toggleAll(value) {
      if (value) {
        this.selected = this.allKeys.slice(0)
      } else {
        this.selected = []
      }
      this.$emit('selected', this.selected)
    },
  },
}

export default List
