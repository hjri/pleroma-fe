import { getColors } from 'src/services/theme_data/theme_data.service.js'

const checkColors = (output) => {
  expect(output).to.have.property('colors')
  Object.entries(output.colors).forEach(([key, v]) => {
    expect(v, key).to.be.an('object')
    expect(v, key).to.include.all.keys('r', 'g', 'b')
    'rgba'.split('').forEach(k => {
      if ((k === 'a' && Object.hasOwn(v, 'a')) || k !== 'a') {
        expect(v[k], key + '.' + k).to.be.a('number')
        expect(v[k], key + '.' + k).to.be.least(0)
        expect(v[k], key + '.' + k).to.be.most(k === 'a' ? 1 : 255)
      }
    })
  })
}

describe('Theme Data utility functions', () => {
  const context = import.meta.glob('/public/static/themes/*.json', { import: 'default', eager: true })
  Object.keys(context).forEach((key) => {
    it(`Should render all colors for ${key} properly`, () => {
      const { theme, source } = context[key]
      const data = source || theme
      const colors = getColors(data.colors, data.opacity, 1)
      checkColors(colors)
    })
  })
})
