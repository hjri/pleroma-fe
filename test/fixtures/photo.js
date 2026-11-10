// A PNG that compresses well, like a photo: noise, which PNG keeps byte for
// byte and WebP or JPEG make much smaller. The same pixels every time.
export const photo = (width, height, name = 'photo.png') =>
  new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    const pixels = context.createImageData(width, height)
    let seed = 1
    for (let i = 0; i < pixels.data.length; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      pixels.data[i] = i % 4 === 3 ? 255 : seed >> 23
    }
    context.putImageData(pixels, 0, 0)
    canvas.toBlob(
      (blob) => resolve(new File([blob], name, { type: 'image/png' })),
      'image/png',
    )
  })

// A flat PNG, which PNG stores in fewer bytes than WebP or JPEG when small
export const flat = (width, height, name = 'photo.png') =>
  new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').fillRect(0, 0, width, height)
    canvas.toBlob(
      (blob) => resolve(new File([blob], name, { type: 'image/png' })),
      'image/png',
    )
  })
