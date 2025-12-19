// eslint-disable-next-line no-unused
import { h, Fragment } from 'vue'
import { mapState } from 'pinia'
import { throttle } from 'lodash'
import { mapState as mapPiniaState } from 'pinia'
import { FontAwesomeIcon as FAIcon } from '@fortawesome/vue-fontawesome'

import './vertical_tab_switcher.scss'
import { useInterfaceStore } from 'src/stores/interface'

const findFirstUsable = (slots) => slots.findIndex(_ => _.props)

export default {
  name: 'VerticalTabSwitcher',
  props: {
    renderOnlyFocused: {
      required: false,
      type: Boolean,
      default: false
    },
    onSwitch: {
      required: false,
      type: Function,
      default: undefined
    },
    activeTab: {
      required: false,
      type: String,
      default: undefined
    },
    bodyScrollLock: {
      required: false,
      type: Boolean,
      default: false
    },
    parentCollapsed: {
      required: false,
      type: Boolean,
      default: null
    }
  },
  data () {
    return {
      active: findFirstUsable(this.slots()),
      resizeHandler: null,
      navSide: 'tabs',
    }
  },
  computed: {
    activeIndex () {
      // In case of controlled component
      if (this.activeTab) {
        return this.slots().findIndex(slot => slot && slot.props && this.activeTab === slot.props.key)
      } else {
        return this.active
      }
    },
    isActive () {
      return tabName => {
        const isWanted = slot => slot.props && slot.props['data-tab-name'] === tabName
        return this.$slots.default().findIndex(isWanted) === this.activeIndex
      }
    },
    ...mapPiniaState(useInterfaceStore, {
      mobileLayout: store => store.layoutType === 'mobile'
    }),
  },
  beforeUpdate () {
    const currentSlot = this.slots()[this.active]
    if (!currentSlot.props) {
      this.active = findFirstUsable(this.slots())
    }
  },
  methods: {
    clickTab (index) {
      return (e) => {
        e.preventDefault()
        this.setTab(index)
      }
    },
    setTab (index) {
      if (typeof this.onSwitch === 'function') {
        this.onSwitch.call(null, this.slots()[index].key)
      }
      this.active = index
      this.changeNavSide('content')
    },
    changeNavSide (side) {
      if (this.navSide !== side) {
        this.navSide = side
      }
    },
    // DO NOT put it to computed, it doesn't work (caching?)
    slots () {
      if (this.$slots.default()[0].type === Fragment) {
        return this.$slots.default()[0].children
      }
      return this.$slots.default()
    }
  },
  render () {
    const tabs = this.slots()
      .map((slot, index) => {
        const props = slot.props
        if (!props) return
        const classesTab = ['vertical-tab', 'menu-item']
        if (this.activeIndex === index && useInterfaceStore().layoutType !== 'mobile') {
          classesTab.push('-active')
        }
        return (
          <button
            disabled={props.disabled}
            onClick={this.clickTab(index)}
            class={classesTab.join(' ')}
            type="button"
            role="tab"
            title={props.label}
          >
            {!props.icon ? '' : (<FAIcon class="tab-icon" size="1x" fixed-width icon={props.icon}/>)}
            <span class="text">
              {props.label}
            </span>
          </button>
        )
      })

    const contents = this.slots().map((slot, index) => {
      const props = slot.props
      if (!props) return
      const active = this.activeIndex === index

      let delayRender = slot.props['delay-render']
      if (delayRender && active) {
        slot.props['delay-render'] = false
        delayRender = false
      }
      const renderSlot = (!delayRender && (!this.renderOnlyFocused || active))
        ? slot
        : ''

      const headerClasses = ['tab-content-label']
      const header = (
        <h2 class={headerClasses}>
          <button
            type="button"
            onClick={() => this.changeNavSide('tabs')}
            title={this.$t('nav.back')}
            class="button-unstyled"
          >
            <FAIcon
              size="lg"
              class="back-button-icon"
              icon="chevron-left"
            />
          </button>
          {props.label}
        </h2>
      )

      const wrapperClasses = ['tab-content-wrapper', active ? '-active' : '-hidden' ]
      const contentClasses = ['tab-content']
      if (props['full-width'] || props['full-width'] === '') {
        contentClasses.push('-full-width')
        wrapperClasses.push('-full-width')
      }
      if (props['full-height'] || props['full-width'] === '') {
        contentClasses.push('-full-height')
        wrapperClasses.push('-full-height')
      }
      return (
        <div class={wrapperClasses} >
          <div class="tab-mobile-header">
            {header}
          </div>
          <div class="tab-slot-wrapper">
            <div class={contentClasses} >
              {renderSlot}
            </div>
          </div>
        </div>
      )
    })

    const rootClasses = ['vertical-tab-switcher']
    if (useInterfaceStore().layoutType === 'mobile') {
      rootClasses.push('-mobile')
    }

    if (this.navSide === 'tabs') {
      rootClasses.push('-nav-tabs')
    } else {
      rootClasses.push('-nav-contents')
    }

    return (
      <div ref="root" class={ rootClasses.join(' ') }>
        <div
          class="tabs"
          role="tablist"
          ref="nav"
        >
          {tabs}
        </div>
        <div
          role="tabpanel"
          class={'contents' + (this.scrollableTabs ? ' scrollable-tabs' : '')}
          v-body-scroll-lock={this.bodyScrollLock}
          ref="contents"
        >
          {contents}
        </div>
      </div>
    )
  }
}
