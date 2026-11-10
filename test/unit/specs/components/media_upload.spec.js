import { createTestingPinia } from '@pinia/testing'
import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { photo } from 'test/fixtures/photo.js'
import { mountOpts } from 'test/fixtures/setup_test.js'

import MediaUpload from 'src/components/media_upload/media_upload.vue'

import { useMergedConfigStore } from 'src/stores/merged_config.js'

const resize = (file) => {
  setActivePinia(createTestingPinia())
  useMergedConfigStore().mergedConfig = { imageCompression: true }
  const wrapper = mount(MediaUpload, mountOpts())
  return wrapper.vm.resizeImage(file)
}

describe('MediaUpload image compression', () => {
  it('compresses a picture', async () => {
    const out = await resize(await photo(100, 100))
    expect(out.name).to.match(/^photo\.(webp|jpg)$/)
  })

  it('does not rasterize SVG', async () => {
    const svg = new File(
      ['<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'],
      'logo.svg',
      { type: 'image/svg+xml' },
    )
    expect(await resize(svg)).to.equal(svg)
  })
})
