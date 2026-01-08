const ScrollTopButton = {
  props: {
    fast: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  methods: {
    scrollToTop() {
      const speed = this.fast ? 'instant' : 'smooth'

      window.scrollTo({ top: 0, behavior: speed })
    },
  },
}

export default ScrollTopButton
