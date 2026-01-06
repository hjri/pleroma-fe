export default {
  name: 'Chat',
  selector: '.chat-message-list',
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
