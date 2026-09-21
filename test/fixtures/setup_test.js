import { config } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import VueVirtualScroller from 'vue-virtual-scroller'

import RichContent from 'src/components/rich_content/rich_content.jsx'
import Status from 'src/components/status/status.vue'
import StillImage from 'src/components/still-image/still-image.vue'

import getRoutes from 'src/boot/routes.js'

export const $t = (msg) => msg
const $i18n = { t: (msg) => msg }

const getDefaultOpts = () => ({
  global: {
    plugins: [
      VueVirtualScroller,
      createRouter({
        history: createMemoryHistory(),
        routes: getRoutes({
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
    components: {
      RichContent,
      Status,
      StillImage,
    },
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

export const mountOpts = (opts = {}) => {
  const defaultOpts = getDefaultOpts()
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
      if (e?.length >= timesEmitted) {
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
