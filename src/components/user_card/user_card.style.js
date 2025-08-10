export default {
  name: 'UserCard',
  selector: '.user-card',
  notEditable: true,
  validInnerComponents: [
    'Text',
    'Link',
    'Icon',
  ],
  defaultRules: [
    {
      directives: {
        '--profileTint': 'color | $alpha(--background 1)'
      }
    }
  ]
}
