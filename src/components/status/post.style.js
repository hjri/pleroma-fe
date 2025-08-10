export default {
  name: 'Post',
  selector: '.Status',
  states: {
    selected: '.-focused'
  },
  validInnerComponents: [
    'Text',
    'Link',
    'Icon',
    'Border',
    'Avatar',
    'PollGraph'
  ],
  defaultRules: [
    {
      directives: {
        background: '--bg'
      }
    },
    {
      state: ['selected'],
      directives: {
        background: '--inheritedBackground, 10'
      }
    }
  ]
}
