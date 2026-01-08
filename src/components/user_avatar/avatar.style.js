export default {
  name: 'Avatar',
  selector: '.Avatar',
  variants: {
    compact: '.-compact',
  },
  defaultRules: [
    {
      directives: {
        roundness: 3,
        shadow: [
          {
            x: 0,
            y: 1,
            blur: 4,
            spread: 0,
            color: '#000000',
            alpha: 0.2,
          },
        ],
      },
    },
  ],
}
