import Setting from './setting.js'

export default {
  ...Setting,
  methods: {
    ...Setting.methods,
    getValue ({ e, side }) {
      const [a, b] = this.visibleState || []
      if (side === 0) {
        return [e.target.value, b]
      } else {
        return [a, e.target.value]
      }
    }
  }
}
