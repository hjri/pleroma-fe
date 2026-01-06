import { createStore } from 'vuex'
import { cloneDeep } from 'lodash'
import vuexModules from 'src/modules/index.js'

const tweakModules = (modules) => {
  const res = {}
  Object.entries(modules).forEach(([name, module]) => {
    const m = { ...module }
    m.state = cloneDeep(module.state)
    res[name] = m
  })
  return res
}

const makeMockStore = () => {
  return createStore({
    modules: tweakModules(vuexModules),
  })
}

export default makeMockStore
