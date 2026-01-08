import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faEnvelope,
  faGlobe,
  faLock,
  faLockOpen,
} from '@fortawesome/free-solid-svg-icons'

library.add(faEnvelope, faGlobe, faLock, faLockOpen)

const ScopeSelector = {
  props: {
    showAll: {
      required: true,
      type: Boolean,
    },
    userDefault: {
      required: true,
      type: String,
    },
    originalScope: {
      required: false,
      type: String,
    },
    initialScope: {
      required: false,
      type: String,
    },
    onScopeChange: {
      required: true,
      type: Function,
    },
    unstyled: {
      required: false,
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      currentScope: this.initialScope,
    }
  },
  computed: {
    showNothing() {
      return (
        !this.showPublic &&
        !this.showUnlisted &&
        !this.showPrivate &&
        !this.showDirect
      )
    },
    showPublic() {
      return this.originalScope !== 'direct' && this.shouldShow('public')
    },
    showUnlisted() {
      return this.originalScope !== 'direct' && this.shouldShow('unlisted')
    },
    showPrivate() {
      return this.originalScope !== 'direct' && this.shouldShow('private')
    },
    showDirect() {
      return this.shouldShow('direct')
    },
    css() {
      const style = this.unstyled ? 'button-unstyled' : 'button-default'
      return {
        public: [style, { toggled: this.currentScope === 'public' }],
        unlisted: [style, { toggled: this.currentScope === 'unlisted' }],
        private: [style, { toggled: this.currentScope === 'private' }],
        direct: [style, { toggled: this.currentScope === 'direct' }],
      }
    },
  },
  methods: {
    shouldShow(scope) {
      return (
        this.showAll ||
        this.currentScope === scope ||
        this.originalScope === scope ||
        this.userDefault === scope ||
        scope === 'direct'
      )
    },
    changeVis(scope) {
      this.currentScope = scope
      this.onScopeChange && this.onScopeChange(scope)
    },
  },
}

export default ScopeSelector
