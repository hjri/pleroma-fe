import { paramsString } from 'src/api/helpers.js'

describe('API Helpers', () => {
  describe('paramsString', () => {
    it('should return empty string when given empty object', () => {
      const string = paramsString({})

      expect(string).to.eq('')
    })

    it('should return empty string when given null', () => {
      const string = paramsString(null)

      expect(string).to.eq('')
    })

    it('should return empty string when given undefined', () => {
      const string = paramsString(undefined)

      expect(string).to.eq('')
    })

    it('should return URI param string for normal object', () => {
      const string = paramsString({ a: 1, b: '3' })

      expect(string).to.eq('?a=1&b=3')
    })

    it('should encode objects correctly', () => {
      const string = paramsString({ foo: true, bar: [1, 2, 3] })

      expect(string).to.eq('?foo=true&bar[]=1&bar[]=2&bar[]=3')
    })

    it('should drop nullish params', () => {
      const string = paramsString({ present: 'yes', missing: null })

      expect(string).to.eq('?present=yes')
    })

    it('should convert camelCase keys to snake_keys objects correctly', () => {
      const string = paramsString({ isActive: true, MaybeNot: false })

      expect(string).to.eq('?is_active=true&maybe_not=false')
    })

    it('should work with maps', () => {
      const string = paramsString(
        new Map([
          ['key', 'yes'],
          ['key2', 'also yes'],
        ]),
      )

      expect(string).to.eq('?key=yes&key_2=also%20yes')
    })

    it('should escape components correctly', () => {
      const string = paramsString({ gachi: '♂', muchi: 'Билли Геррингтон' })

      expect(string).to.eq(
        '?gachi=%E2%99%82&muchi=%D0%91%D0%B8%D0%BB%D0%BB%D0%B8%20%D0%93%D0%B5%D1%80%D1%80%D0%B8%D0%BD%D0%B3%D1%82%D0%BE%D0%BD',
      )
    })

    it('should throw when passed a non-object', () => {
      expect(() => {
        paramsString('Totally an object')
      }).to.throw()
    })

    it('should throw when passed an array', () => {
      expect(() => {
        paramsString(['Totally an object'])
      }).to.throw()
    })

    it('should throw when array param is non-primitive', () => {
      expect(() => {
        paramsString({ a: [() => ''] })
      }).to.throw()
    })

    it('should throw when array param is nullish', () => {
      expect(() => {
        paramsString({ a: [1, null, 3] })
      }).to.throw()
    })
  })
})
