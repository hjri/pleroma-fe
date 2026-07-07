export default {
  name: 'Chat',
  selector: '.ChatMessageList',
  validInnerComponents: ['Text', 'Link', 'Icon', 'Avatar', 'ChatMessage'],
  defaultRules: [
    {
      directives: {
        background: '--bg',
        blur: '5px',
      },
    },
  ],
}
