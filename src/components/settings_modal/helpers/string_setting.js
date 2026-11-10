import Setting from './setting.js'

export default {
  ...Setting,
  getValue(e) {
    return e.target.value
  },
}
