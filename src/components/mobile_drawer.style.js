export default {
  name: 'MobileDrawer',
  selector: '.mobile-drawer',
  validInnerComponents: ['MenuItem'],
  defaultRules: [
    {
      directives: {
        background: '--bg',
        backgroundNoCssColor: 'yes',
      },
    },
  ],
}
