export default {
  name: 'Underlay',
  selector: '#content',
  // Out of tree selector: Most components are laid over underlay, but underlay itself is not part of the DOM tree,
  // i.e. it's a separate absolutely-positioned component, so we need to treat it differently depending on whether
  // we are searching for underlay specifically or for whatever is laid on top of it.
  outOfTreeSelector: '.underlay',
  validInnerComponents: ['Panel'],
  defaultRules: [
    {
      directives: {
        background: '#000000',
        opacity: 0.2,
      },
    },
  ],
}
