export default {
  name: 'Badge',
  selector: '.badge',
  validInnerComponents: ['Text', 'Icon'],
  variants: {
    notification: '.-notification',
  },
  defaultRules: [
    {
      component: 'Root',
      directives: {
        '--badgeNotification': 'color | --cRed',
      },
    },
    {
      directives: {
        background: '--cGreen',
      },
    },
    {
      variant: 'notification',
      directives: {
        background: '--cRed',
      },
    },
  ],
}
