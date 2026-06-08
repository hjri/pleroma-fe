import { isEmpty } from 'lodash'

import Checkbox from 'src/components/checkbox/checkbox.vue'

const List = {
  props: {
    boxOnly: {
      type: Boolean,
      default: false,
    },
    items: {
      type: Array,
      default: () => [],
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
  },
  components: {
    Checkbox,
  },
  data() {
    return {
      loading: false,
      bottomedOut: false,
      error: false,
      dynamicItems: this.itemsFunction ? [] : null,
      selected: [],
    }
  },
  computed: {
    allKeys() {
      return this.actualItems.map(this.getKey)
    },
    filteredSelected() {
      return this.allKeys.filter((key) => this.selected.indexOf(key) !== -1)
    },
    allSelected() {
      return this.filteredSelected.length === this.actualItems.length
    },
    noneSelected() {
      return this.filteredSelected.length === 0
    },
    someSelected() {
      return !this.allSelected && !this.noneSelected
    },
    actualItems() {
      return this.dynamicItems || this.actualItems
    },
  },
  created() {
    if (this.fetchFunction) {
      window.addEventListener('scroll', this.scrollLoad)

      if (this.dynamicItems.length === 0) {
        this.fetchEntries()
      }
    }
  },
  unmounted() {
    window.removeEventListener('scroll', this.scrollLoad)
  },
  methods: {
    // Entries is not a computed because computed can't track the dynamic
    // selector for changes and won't trigger after fetch.
    updateEntries(newEntries) {
      this.dynamicItems = this.itemsFunction(newEntries)
    },
    fetchEntries() {
      if (!this.loading) {
        this.loading = true
        this.error = false
        this.fetchFunction()
          .then((newEntries) => {
            this.loading = false
            this.bottomedOut = isEmpty(newEntries)
            return newEntries
          })
          .catch((error) => {
            this.loading = false
            this.error = error
          })
          .finally((newEntries) => {
            this.updateEntries(newEntries)
          })
      }
    },
    scrollLoad(e) {
      if (this.fetchFunction) {
        const bodyBRect = document.body.getBoundingClientRect()
        const height = Math.max(bodyBRect.height, -bodyBRect.y)
        if (
          this.loading === false &&
          this.bottomedOut === false &&
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
      console.log('TOGGLE', checked, item)
      const key = this.getKey(item)
      const oldChecked = this.isSelected(key)
      if (checked !== oldChecked) {
        if (checked) {
          this.selected.push(key)
        } else {
          this.selected.splice(this.selected.indexOf(key), 1)
        }
      }
    },
    toggleAll(value) {
      if (value) {
        this.selected = this.allKeys.slice(0)
      } else {
        this.selected = []
      }
    },
  },
}

export default List
