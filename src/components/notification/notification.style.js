export default {
  name: 'Notification',
  selector: '.Notification',
  validInnerComponents: [
    'Text',
    'Link',
    'Icon',
    'Border',
    // Optimization: don't put heavy components unless needed
    // 'Button',
    // 'ButtonUnstyled',
    'RichContent',
    // 'Input',
    'Avatar',
    'PollGraph'
  ],
  defaultRules: []
}
