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
    // Optimization: don't put heavy components unless needed
    // 'Button',
    // 'ButtonUnstyled',
    'RichContent',
    'Input',
    'Avatar',
    'PollGraph'
  ],
  validInnerComponentsLite: [
    'Text',
    'Link',
    'Icon',
    'Border',
    'ButtonUnstyled',
    'RichContent',
    'Avatar'
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
