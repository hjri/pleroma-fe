import { isEmpty } from 'lodash'

import Checkbox from 'src/components/checkbox/checkbox.vue'

const List = {
  props: {
    boxOnly: {
      type: Boolean,
      default: false,
    },
    fetchFunction: {
      type: Function,
      default: null,
    },
    getKey: {
      type: Function,
      default: (item) => item,
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
    externalItems: {
      type: Array,
      default: null,
    },
  },
  emits: ['fetchRequested'],
  components: {
    Checkbox,
  },
  data() {
    return {
      items: [],
      selected: new Set([]),
      loading: false,
      bottomedOut: true,
      error: null,
      page: 1,
      total: null,
    }
  },
  computed: {
    allKeys() {
      return new Set(this.finalItems.map(this.getKey))
    },
    filteredSelected() {
      return [ ...this.allKeys.values().filter((key) => this.selected.has(key))]
    },
    allSelected() {
      return this.selected.size === this.finalItems.length
    },
    noneSelected() {
      return this.selected.size === 0
    },
    someSelected() {
      return !this.allSelected && !this.noneSelected
    },
    finalItems() {
      return this.externalItems || this.items
    }
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
      if (this.loading) return

      this.loading = true
      this.error = null

      this.fetchFunction(this.page)
        .then((result) => {
          this.loading = false
          this.bottomedOut = isEmpty(result.items)
          if (this.externalItems) return
          this.page += 1
          this.total = result.count
          this.items.push(...result.items)
        })
        .catch((error) => {
          this.loading = false
          this.error = error
        })
    },
    reset() {
      this.items = []
      this.page = 1
      this.total = null
      this.error = null
      this.loading = false
      this.fetchEntries()
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
          this.selected.add(key)
        } else {
          this.selected.delete(key)
        }
      }
      this.$emit('selected', this.selected)
    },
    toggleAll(value) {
      if (value) {
        this.selected = new Set([...this.allKeys])
      } else {
        this.selected = new Set([])
      }
      this.$emit('selected', this.selected)
    },
  },
}

export default List
