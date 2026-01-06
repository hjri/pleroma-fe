export default {
  name: 'UserCard',
  selector: '.user-card',
  notEditable: true,
  defaultRules: [
    {
      directives: {
        '--profileTint': 'color | $alpha(--background 1)',
      },
    },
  ],
}
