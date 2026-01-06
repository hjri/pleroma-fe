import { config } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import VueVirtualScroller from 'vue-virtual-scroller'
import routes from 'src/boot/routes'
import makeMockStore from './mock_store'

export const $t = (msg) => msg
const $i18n = { t: (msg) => msg }

const applyAfterStore = (store, afterStore) => {
  afterStore(store)
  return store
}

const getDefaultOpts = ({ afterStore = () => {} } = {}) => ({
  global: {
    plugins: [
      applyAfterStore(makeMockStore(), afterStore),
      VueVirtualScroller,
      createRouter({
        history: createMemoryHistory(),
        routes: routes({
          state: {
            users: {
              currentUser: {},
            },
            instance: {},
          },
        }),
      }),
      (Vue) => {
        Vue.directive('body-scroll-lock', {})
      },
    ],
    components: {},
    stubs: {
      I18nT: true,
      teleport: true,
      FAIcon: true,
      FALayers: true,
    },
    mocks: {
      $t,
      $i18n,
    },
  },
})

// https://github.com/vuejs/vue-test-utils/issues/960
const customBehaviors = () => {
  const filterByText = (keyword) => {
    const match =
      keyword instanceof RegExp
        ? (target) => target && keyword.test(target)
        : (target) => keyword === target

    return (wrapper) =>
      match(wrapper.text()) ||
      match(wrapper.attributes('aria-label')) ||
      match(wrapper.attributes('title'))
  }

  return {
    findComponentByText(searchedComponent, text) {
      return this.findAllComponents(searchedComponent)
        .filter(filterByText(text))
        .at(0)
    },
    findByText(searchedElement, text) {
      return this.findAll(searchedElement).filter(filterByText(text)).at(0)
    },
  }
}

config.plugins.VueWrapper.install(customBehaviors)

export const mountOpts = (allOpts = {}) => {
  const { afterStore, ...opts } = allOpts
  const defaultOpts = getDefaultOpts({ afterStore })
  const mergedOpts = {
    ...opts,
    global: {
      ...defaultOpts.global,
    },
  }

  if (opts.global) {
    mergedOpts.global.plugins = mergedOpts.global.plugins.concat(
      opts.global.plugins || [],
    )
    Object.entries(opts.global).forEach(([k, v]) => {
      if (k === 'plugins') {
        return
      }
      if (defaultOpts.global[k]) {
        mergedOpts.global[k] = {
          ...defaultOpts.global[k],
          ...v,
        }
      } else {
        mergedOpts.global[k] = v
      }
    })
  }

  return mergedOpts
}

// https://stackoverflow.com/questions/78033718/how-can-i-wait-for-an-emitted-event-of-a-mounted-component-in-vue-test-utils
export const waitForEvent = (
  wrapper,
  event,
  { timeout = 1000, timesEmitted = 1 } = {},
) => {
  const tick = 10

  return vi.waitFor(
    () => {
      const e = wrapper.emitted(event)
      if (e && e.length >= timesEmitted) {
        return
      }
      throw new Error('event is not emitted')
    },
    {
      timeout,
      interval: tick,
    },
  )
}
