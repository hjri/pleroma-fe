const ScrollTopButton = {
  props: {
    fast: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  inject: ['bodyScrollPosition'],
  methods: {
    scrollToTop() {
      const speed = this.fast ? 'instant' : 'smooth'

      this.bodyScrollPosition.scrollToPriority({ top: 0, behavior: speed })
    },
  },
}

export default ScrollTopButton
