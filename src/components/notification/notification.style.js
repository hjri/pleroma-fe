export default {
  name: 'Notification',
  selector: '.NotificationParent',
  validInnerComponents: [
    'Text',
    'Link',
    'Icon',
    'Border',
    'Avatar',
    'PollGraph',
  ],
  defaultRules: [
    {
      directives: {
        background: '--bg',
      },
    },
  ],
}
