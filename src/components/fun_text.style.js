export default {
  name: 'FunText',
  selector: '/*fun-text*/',
  virtual: true,
  variants: {
    greentext: '.greentext',
    cyantext: '.cyantext',
  },
  states: {
    faint: '.faint',
  },
  defaultRules: [
    {
      directives: {
        textColor: '--text',
        textAuto: 'preserve',
      },
    },
    {
      state: ['faint'],
      directives: {
        textOpacity: 0.5,
      },
    },
    {
      variant: 'greentext',
      directives: {
        textColor: '--cGreen',
        textAuto: 'preserve',
      },
    },
    {
      variant: 'cyantext',
      directives: {
        textColor: '--cBlue',
        textAuto: 'preserve',
      },
    },
  ],
}
