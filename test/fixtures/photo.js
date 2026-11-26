// Test pictures as PNG files, the same bytes on every run.

// "Random" numbers that are the same on every run: a linear congruential
// generator, seed = (a * seed + c) mod 2^31, with the a = 1103515245 and
// c = 12345 of the rand() example in the C standard.
const nextSeed = (seed) => (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff

const pngFile = async (canvas, name) => {
  // toBlob only takes a callback
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  )
  return new File([blob], name, { type: 'image/png' })
}

const canvasOf = (width, height) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

// A PNG that compresses well, like a photo: noise, which PNG keeps byte for
// byte and WebP or JPEG make much smaller.
export const photo = async (width, height, name = 'photo.png') => {
  const canvas = canvasOf(width, height)
  const context = canvas.getContext('2d')
  const pixels = context.createImageData(width, height)
  let seed = 1
  for (let i = 0; i < pixels.data.length; i++) {
    seed = nextSeed(seed)
    // opaque, and the top 8 of the 31 bits for the colours
    pixels.data[i] = i % 4 === 3 ? 255 : seed >> 23
  }
  context.putImageData(pixels, 0, 0)
  return pngFile(canvas, name)
}

// A flat PNG, which PNG stores in fewer bytes than WebP or JPEG when small
export const flat = async (width, height, name = 'photo.png') => {
  const canvas = canvasOf(width, height)
  canvas.getContext('2d').fillRect(0, 0, width, height)
  return pngFile(canvas, name)
}
