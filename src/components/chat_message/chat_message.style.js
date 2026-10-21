export default {
  name: 'ChatMessage',
  selector: '.chat-message',
  variants: {
    outgoing: '.outgoing',
  },
  states: {
    focused: '.-focused',
  },
  validInnerComponents: ['Text', 'Icon', 'Border', 'PollGraph'],
  defaultRules: [
    {
      directives: {
        background: '--bg, 2',
        backgroundNoCssColor: 'yes',
      },
    },
    {
      variant: 'outgoing',
      directives: {
        background: '--bg, 5',
      },
    },
    {
      state: ['focused'],
      directives: {
        background: '--inheritedBackground, 10',
      },
    },
  ],
}
