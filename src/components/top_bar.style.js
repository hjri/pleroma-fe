export default {
  name: 'TopBar',
  selector: 'nav',
  validInnerComponents: [
    'Link',
    'Text',
    'Icon',
    // Optimization: don't put heavy components unless needed
    // 'Button',
    // 'ButtonUnstyled',
    'Input',
    'Badge'
  ],
  defaultRules: [
    {
      directives: {
        background: '--fg',
        shadow: [{
          x: 0,
          y: 1,
          blur: 4,
          spread: 0,
          color: '#000000',
          alpha: 0.4
        },
        {
          x: 0,
          y: 2,
          blur: 7,
          spread: 0,
          color: '#000000',
          alpha: 0.3
        }]
      }
    },
    {
      component: 'Link',
      parent: {
        component: 'TopBar'
      },
      directives: {
        textColor: '--text'
      }
    },
    {
      component: 'Icon',
      parent: {
        component: 'ButtonUnstyled',
        parent: {
          component: 'TopBar'
        }
      },
      directives: {
        textColor: '--parent--text'
      }
    }
  ]
}
