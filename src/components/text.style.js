export default {
  name: 'Text',
  selector: '/*text*/',
  virtual: true,
  states: {
    faint: '.faint',
  },
  defaultRules: [
    {
      directives: {
        textColor: '--text',
        textAuto: 'no-preserve',
      },
    },
    {
      state: ['faint'],
      directives: {
        textOpacity: 0.5,
      },
    },
  ],
}
