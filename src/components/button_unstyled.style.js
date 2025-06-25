export default {
  name: 'ButtonUnstyled',
  selector: '.button-unstyled',
  notEditable: true,
  transparent: true,
  states: {
    toggled: '.toggled',
    disabled: ':disabled',
    hover: ':is(:hover, :focus-visible):not(:disabled)',
    focused: ':focus-within:not(:is(:focus-visible))'
  },
  validInnerComponents: [
    'Text',
    'Link',
    'Icon',
    'Badge'
  ],
  defaultRules: [
    {
      directives: {
        shadow: []
      }
    },
    {
      component: 'Icon',
      parent: {
        component: 'ButtonUnstyled',
        state: ['hover']
      },
      directives: {
        textColor: '--parent--text'
      }
    },
    {
      component: 'Icon',
      parent: {
        component: 'ButtonUnstyled',
        state: ['toggled']
      },
      directives: {
        textColor: '--parent--text'
      }
    },
    {
      component: 'Icon',
      parent: {
        component: 'ButtonUnstyled',
        state: ['toggled', 'hover']
      },
      directives: {
        textColor: '--parent--text'
      }
    },
    {
      component: 'Icon',
      parent: {
        component: 'ButtonUnstyled',
        state: ['toggled', 'focused']
      },
      directives: {
        textColor: '--parent--text'
      }
    },
    {
      component: 'Icon',
      parent: {
        component: 'ButtonUnstyled',
        state: ['toggled', 'focused', 'hover']
      },
      directives: {
        textColor: '--parent--text'
      }
    },
    {
      component: 'Text',
      parent: {
        component: 'ButtonUnstyled',
        state: ['disabled']
      },
      directives: {
        textOpacity: 0.25,
        textOpacityMode: 'blend'
      }
    },
    {
      component: 'Icon',
      parent: {
        component: 'ButtonUnstyled',
        state: ['disabled']
      },
      directives: {
        textOpacity: 0.25,
        textOpacityMode: 'blend'
      }
    }
  ]
}
