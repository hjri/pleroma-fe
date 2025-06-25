export default {
  name: 'Attachment',
  selector: '.Attachment',
  notEditable: true,
  validInnerComponents: [
    'Border',
    'Button',
    'Input'
  ],
  defaultRules: [
    {
      directives: {
        roundness: 3
      }
    },
    {
      component: 'Button',
      parent: {
        component: 'Attachment'
      },
      directives: {
        background: '#FFFFFF',
        opacity: 0.5
      }
    }
  ]
}
