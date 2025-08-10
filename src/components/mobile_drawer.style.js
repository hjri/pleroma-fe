export default {
  name: 'MobileDrawer',
  selector: '.mobile-drawer',
  validInnerComponents: [
    'Text',
    'Link',
    'Icon',
    'Border',
    // Optimization: don't put heavy components unless needed
    // 'Button',
    // 'ButtonUnstyled',
    // 'Input',
    'PanelHeader',
    'MenuItem',
    'Notification',
    'Alert',
    'UserCard'
  ],
  defaultRules: [
    {
      directives: {
        background: '--bg',
        backgroundNoCssColor: 'yes'
      }
    },
    {
      component: 'PanelHeader',
      parent: { component: 'MobileDrawer' },
      directives: {
        background: '--fg',
        shadow: [{
          x: 0,
          y: 0,
          blur: 4,
          spread: 0,
          color: '#000000',
          alpha: 0.6
        }]
      }
    }
  ]
}
