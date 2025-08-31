export default {
  name: 'ChatMessage',
  selector: '.chat-message',
  variants: {
    outgoing: '.outgoing'
  },
  validInnerComponents: [
    'Text',
    'Icon',
    'Border',
    'PollGraph'
  ],
  defaultRules: [
    {
      directives: {
        background: '--bg, 2',
        backgroundNoCssColor: 'yes'
      }
    },
    {
      variant: 'outgoing',
      directives: {
        background: '--bg, 5'
      }
    }
  ]
}
