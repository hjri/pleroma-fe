import Setting from './setting.js'

export default {
  ...Setting,
  methods: {
    ...Setting.methods,
    getValue ({ e, side }) {
      const [a, b] = this.visibleState || []
      if (side === 0) {
        return { tuple: [e.target.value, b]}
      } else {
        return { tuple: [a, e.target.value]}
      }
    }
  }
}
