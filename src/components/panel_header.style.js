export default {
  name: 'PanelHeader',
  selector: '.panel-heading',
  validInnerComponents: [
    'Text',
    'Link',
    'Icon',
    'Button',
    'ButtonUnstyled',
    'Badge',
    'Alert'
  ],
  defaultRules: [
    {
      component: 'PanelHeader',
      directives: {
        backgroundNoCssColor: 'yes',
        background: '--fg',
        shadow: [{
          x: 0,
          y: 1,
          blur: 3,
          spread: 0,
          color: '#000000',
          alpha: 0.4
        },
        {
          x: 0,
          y: 1,
          blur: 0,
          spread: 0,
          color: '#ffffff',
          alpha: 0.2,
          inset: true
        }]
      }
    }
  ]
}
