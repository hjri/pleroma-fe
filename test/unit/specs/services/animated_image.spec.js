import {
  isAnimated,
  isAnimatedAvif,
  isAnimatedPng,
  isAnimatedWebP,
} from 'src/services/animated_image/animated_image.js'

const bytes = (...parts) =>
  new Uint8Array(
    parts.flatMap((p) =>
      typeof p === 'string' ? [...p].map((c) => c.charCodeAt(0)) : p,
    ),
  )
const file = (data, type = 'image/png') => new File([data], 'f', { type })

// RIFF header and VP8X chunk with the given flags
const vp8x = (flags) =>
  file(bytes('RIFF', [0, 0, 0, 0], 'WEBPVP8X', [10, 0, 0, 0, flags, 0, 0, 0]))
// an ftyp box: major brand, minor version, compatible brands
const ftyp = (size, major, ...compatible) =>
  file(bytes([0, 0, 0, size], 'ftyp', major, [0, 0, 0, 0], ...compatible))

describe('animated pictures', () => {
  it('finds the animation flag of a WebP', async () => {
    expect(await isAnimatedWebP(vp8x(0x02))).to.equal(true)
    expect(await isAnimatedWebP(vp8x(0x12))).to.equal(true)
    expect(await isAnimatedWebP(vp8x(0x10))).to.equal(false)
    const still = file(bytes('RIFF', [0, 0, 0, 0], 'WEBPVP8 '))
    expect(await isAnimatedWebP(still)).to.equal(false)
    expect(await isAnimatedWebP(file(''))).to.equal(false)
  })

  it('finds the avis brand of an AVIF', async () => {
    expect(await isAnimatedAvif(ftyp(24, 'avis', 'avif', 'mif1'))).to.equal(
      true,
    )
    expect(
      await isAnimatedAvif(ftyp(28, 'avif', 'mif1', 'miaf', 'avis')),
    ).to.equal(true)
    expect(await isAnimatedAvif(ftyp(0, 'avif', 'mif1', 'avis'))).to.equal(true)
    expect(await isAnimatedAvif(ftyp(24, 'avif', 'mif1', 'miaf'))).to.equal(
      false,
    )
    // a brand after the end of the box is not one
    expect(await isAnimatedAvif(ftyp(20, 'avif', 'mif1', 'avis'))).to.equal(
      false,
    )
  })

  it('finds the acTL chunk of a PNG', async () => {
    expect(await isAnimatedPng(file(bytes([0x89], 'PNG', 'acTL')))).to.equal(
      true,
    )
    expect(await isAnimatedPng(file(bytes([0x89], 'PNG', 'IDAT')))).to.equal(
      false,
    )
  })

  it('reads the bytes whatever the type says', async () => {
    const webp = bytes('RIFF', [0, 0, 0, 0], 'WEBPVP8X', [10, 0, 0, 0, 2])
    expect(await isAnimated(file(webp, 'image/gif'))).to.equal(true)
    expect(await isAnimated(file(webp, 'image/jpeg'))).to.equal(true)
    expect(await isAnimated(file(bytes('acTL'), 'image/png'))).to.equal(true)
    expect(await isAnimated(file(bytes('x'), 'image/jpeg'))).to.equal(false)
  })
})
