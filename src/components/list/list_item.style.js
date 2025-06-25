export default {
  name: 'ListItem',
  selector: '.list-item',
  states: {
    active: '.-active',
    hover: ':is(:hover, :focus-visible, :has(:focus-visible)):not(.-non-interactive)'
  },
  validInnerComponents: [
    'Text',
    'Link',
    'Icon',
    'Border',
    'Button',
    'ButtonUnstyled',
    'RichContent',
    'Input',
    'Avatar'
  ],
  defaultRules: [
    {
      directives: {
        background: '--bg',
        opacity: 0
      }
    },
    {
      state: ['active'],
      directives: {
        background: '--inheritedBackground, 10',
        opacity: 1
      }
    },
    {
      state: ['hover'],
      directives: {
        background: '--inheritedBackground, 10',
        opacity: 1
      }
    },
    {
      state: ['hover', 'active'],
      directives: {
        background: '--inheritedBackground, 20',
        opacity: 1
      }
    }
  ]
}
