// Whether a picture is animated, read from its bytes: the browser takes the
// type from the file name, and an animated WebP named .gif is common.

const ascii = (bytes, start, end) =>
  String.fromCharCode(...bytes.subarray(start, end))

const head = async (file) =>
  new Uint8Array(await file.slice(0, 64).arrayBuffer())

// a VP8X chunk with the animation flag
export const isAnimatedWebP = async (file) => {
  const bytes = await head(file)
  return (
    ascii(bytes, 0, 4) === 'RIFF' &&
    ascii(bytes, 8, 16) === 'WEBPVP8X' &&
    (bytes[20] & 0x02) !== 0
  )
}

// the avis brand in the ftyp box: the major brand, or a compatible brand
// after the minor version. A box size of 0 goes to the end of the file.
export const isAnimatedAvif = async (file) => {
  const bytes = await head(file)
  if (ascii(bytes, 4, 8) !== 'ftyp') return false
  const size = new DataView(bytes.buffer).getUint32(0)
  const end = size === 0 ? bytes.length : Math.min(size, bytes.length)
  if (ascii(bytes, 8, 12) === 'avis') return true
  for (let i = 16; i + 4 <= end; i += 4) {
    if (ascii(bytes, i, i + 4) === 'avis') return true
  }
  return false
}

// an acTL chunk before the first IDAT, as APNG needs; the chunks are
// walked, so the letters inside other data do not count
export const isAnimatedPng = async (file) => {
  if (ascii(await head(file), 0, 8) !== '\x89PNG\r\n\x1a\n') return false
  const bytes = new Uint8Array(await file.arrayBuffer())
  const view = new DataView(bytes.buffer)
  // a chunk: length, type, data, CRC
  for (let pos = 8; pos + 8 <= bytes.length; pos += 12 + view.getUint32(pos)) {
    const type = ascii(bytes, pos + 4, pos + 8)
    if (type === 'acTL') return true
    if (type === 'IDAT') return false
  }
  return false
}

export const isAnimated = async (file) =>
  (await isAnimatedWebP(file)) ||
  (await isAnimatedAvif(file)) ||
  (await isAnimatedPng(file))
