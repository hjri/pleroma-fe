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
    // 'Input',
    'Avatar',
    'PollGraph'
  ],
  defaultRules: []
}
