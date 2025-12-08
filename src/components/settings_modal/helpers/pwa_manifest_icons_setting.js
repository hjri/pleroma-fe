import { clone } from 'lodash'
import Setting from './setting.js'

export default {
  ...Setting,
  methods: {
    ...Setting.methods,
    optionPresent (option) {
      return this.valueSet.has(option)
    },
    getValue ({ event, field, index, eventType }) {
      switch (eventType) {
        case 'add': {
          const res = [...this.visibleState, {}]
          return res
        }

        case 'remove': {
          const pre = this.visibleState.slice(0, index)
          const post = this.visibleState.slice(index + 1)

          return [...pre, ...post]
        }

        case 'edit': {
          const pre = this.visibleState.slice(0, index)
          const post = this.visibleState.slice(index + 1)
          const item = clone(this.visibleState[index])
          const string = event.target.value
          console.log(item)

          if (!string)  {
            delete item[field]
          } else {
            item[field] = string
          }

          console.log(item)

          return [...pre, item, ...post]
        }
      }
    }
  }
}
