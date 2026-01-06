import { getAllPossibleCombinations } from 'src/services/theme_data/iss_utils.js'
import { init } from 'src/services/theme_data/theme_data_3.service.js'
import { basePaletteKeys } from 'src/services/theme_data/theme2_to_theme3.js'

describe('Theme Data 3', () => {
  describe('getAllPossibleCombinations', () => {
    it('test simple 3 values case', () => {
      const out = getAllPossibleCombinations([1, 2, 3]).map((x) =>
        x.sort((a, b) => a - b),
      )
      expect(out).to.eql([[1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3]])
    })

    it('test simple 4 values case', () => {
      const out = getAllPossibleCombinations([1, 2, 3, 4]).map((x) =>
        x.sort((a, b) => a - b),
      )
      expect(out).to.eql([
        [1],
        [2],
        [3],
        [4],
        [1, 2],
        [1, 3],
        [1, 4],
        [2, 3],
        [2, 4],
        [3, 4],
        [1, 2, 3],
        [1, 2, 4],
        [1, 3, 4],
        [2, 3, 4],
        [1, 2, 3, 4],
      ])
    })

    it('test massive 5 values case, using strings', () => {
      const out = getAllPossibleCombinations(['a', 'b', 'c', 'd', 'e']).map(
        (x) => x.sort((a, b) => a - b),
      )
      expect(out).to.eql([
        // 1
        ['a'],
        ['b'],
        ['c'],
        ['d'],
        ['e'],
        // 2
        ['a', 'b'],
        ['a', 'c'],
        ['a', 'd'],
        ['a', 'e'],
        ['b', 'c'],
        ['b', 'd'],
        ['b', 'e'],
        ['c', 'd'],
        ['c', 'e'],
        ['d', 'e'],
        // 3
        ['a', 'b', 'c'],
        ['a', 'b', 'd'],
        ['a', 'b', 'e'],
        ['a', 'c', 'd'],
        ['a', 'c', 'e'],
        ['a', 'd', 'e'],

        ['b', 'c', 'd'],
        ['b', 'c', 'e'],
        ['b', 'd', 'e'],

        ['c', 'd', 'e'],
        // 4
        ['a', 'b', 'c', 'd'],
        ['a', 'b', 'c', 'e'],
        ['a', 'b', 'd', 'e'],

        ['a', 'c', 'd', 'e'],

        ['b', 'c', 'd', 'e'],
        // 5
        ['a', 'b', 'c', 'd', 'e'],
      ])
    })
  })

  describe('init', function () {
    it('Test initialization without anything', () => {
      const out = init({ inputRuleset: [], ultimateBackgroundColor: '#DEADAF' })

      expect(out).to.have.property('eager')
      expect(out).to.have.property('lazy')
      expect(out).to.have.property('staticVars')

      expect(out.lazy).to.be.an('array')
      expect(out.lazy).to.have.lengthOf.above(1)
      expect(out.eager).to.be.an('array')
      expect(out.eager).to.have.lengthOf.above(1)
      expect(out.staticVars).to.be.an('object')

      // check backwards compat/generic stuff
      basePaletteKeys.forEach((key) => {
        expect(out.staticVars).to.have.property(key)
      })
    })

    it('Test initialization with a basic palette', () => {
      const out = init({
        inputRuleset: [
          {
            component: 'Root',
            directives: {
              '--bg': 'color | #008080',
              '--fg': 'color | #00C0A0',
            },
          },
        ],
        ultimateBackgroundColor: '#DEADAF',
      })

      expect(out.staticVars).to.have.property('bg').equal('#008080')
      expect(out.staticVars).to.have.property('fg').equal('#00C0A0')

      const panelRule = out.eager.filter((x) => {
        if (x.component !== 'Panel') return false
        return true
      })[0]

      expect(panelRule).to.have.nested.deep.property('dynamicVars.stacked', {
        r: 0,
        g: 128,
        b: 128,
      })
    })

    it('Test initialization with opacity', () => {
      const out = init({
        inputRuleset: [
          {
            component: 'Root',
            directives: {
              '--bg': 'color | #008080',
            },
          },
          {
            component: 'Panel',
            directives: {
              opacity: 0.5,
            },
          },
        ],
        onlyNormalState: true,
        ultimateBackgroundColor: '#DEADAF',
      })

      expect(out.staticVars).to.have.property('bg').equal('#008080')

      const panelRule = out.eager.filter((x) => {
        if (x.component !== 'Panel') return false
        return true
      })[0]

      expect(panelRule).to.have.nested.deep.property('dynamicVars.background', {
        r: 0,
        g: 128,
        b: 128,
        a: 0.5,
      })
      expect(panelRule).to.have.nested.deep.property('dynamicVars.stacked')
      // Somewhat incorrect since we don't do gamma correction
      // real expectancy should be this:
      /*

      expect(panelRule).to.have.nested.deep.property('dynamicVars.stacked.r').that.is.closeTo(147.0, 0.01)
      expect(panelRule).to.have.nested.deep.property('dynamicVars.stacked.g').that.is.closeTo(143.2, 0.01)
      expect(panelRule).to.have.nested.deep.property('dynamicVars.stacked.b').that.is.closeTo(144.0, 0.01)

      */

      expect(panelRule)
        .to.have.nested.deep.property('dynamicVars.stacked.r')
        .that.is.closeTo(111, 0.01)
      expect(panelRule)
        .to.have.nested.deep.property('dynamicVars.stacked.g')
        .that.is.closeTo(150.5, 0.01)
      expect(panelRule)
        .to.have.nested.deep.property('dynamicVars.stacked.b')
        .that.is.closeTo(151.5, 0.01)
    })
  })
})
