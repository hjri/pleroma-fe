export default {
  name: 'Panel',
  selector: '.panel',
  validInnerComponents: [
    'Text',
    'Link',
    'Icon',
    'Border',
    'PanelHeader',
    'Post',
    'Notification'
  ],
  validInnerComponentsLite: [
    'Text',
    'Link',
    'Icon',
    'Border',
    'PanelHeader'
  ],
  defaultRules: [
    {
      directives: {
        backgroundNoCssColor: 'yes',
        background: '--bg',
        roundness: 3,
        blur: '5px',
        shadow: [{
          x: 0,
          y: 0,
          blur: 3,
          spread: 0,
          color: '#000000',
          alpha: 0.5
        },
        {
          x: 0,
          y: 4,
          blur: 6,
          spread: 3,
          color: '#000000',
          alpha: 0.3
        }]
      }
    }
  ]
}
