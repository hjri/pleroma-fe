import Gallery from 'src/components/gallery/gallery.vue'

describe('Gallery', () => {
  let local

  it('attachments is falsey', () => {
    local = { attachments: false }
    expect(Gallery.computed.rows.call(local)).to.eql([])

    local = { attachments: null }
    expect(Gallery.computed.rows.call(local)).to.eql([])

    local = { attachments: undefined }
    expect(Gallery.computed.rows.call(local)).to.eql([])
  })

  it('no attachments', () => {
    local = { attachments: [] }
    expect(Gallery.computed.rows.call(local)).to.eql([])
  })

  it('one audio attachment', () => {
    local = {
      attachments: [{ mimetype: 'audio/mpeg' }],
    }

    expect(Gallery.computed.rows.call(local)).to.eql([
      { audio: true, items: [{ mimetype: 'audio/mpeg' }] },
    ])
  })

  it('one image attachment', () => {
    local = {
      attachments: [{ mimetype: 'image/png' }],
    }

    expect(Gallery.computed.rows.call(local)).to.eql([
      { items: [{ mimetype: 'image/png' }] },
    ])
  })

  it('one audio attachment and one image attachment', () => {
    local = {
      attachments: [{ mimetype: 'audio/mpeg' }, { mimetype: 'image/png' }],
    }

    expect(Gallery.computed.rows.call(local)).to.eql([
      { audio: true, items: [{ mimetype: 'audio/mpeg' }] },
      { items: [{ mimetype: 'image/png' }] },
    ])
  })

  it('has "size" key set to "hide"', () => {
    let local
    local = {
      attachments: [{ mimetype: 'audio/mpeg' }],
      size: 'hide',
    }

    expect(Gallery.computed.rows.call(local)).to.eql([
      { minimal: true, items: [{ mimetype: 'audio/mpeg' }] },
    ])

    local = {
      attachments: [
        { mimetype: 'image/jpg' },
        { mimetype: 'image/png' },
        { mimetype: 'image/jpg' },
        { mimetype: 'audio/mpeg' },
        { mimetype: 'image/png' },
        { mimetype: 'audio/mpeg' },
        { mimetype: 'image/jpg' },
        { mimetype: 'image/png' },
        { mimetype: 'image/jpg' },
      ],
      size: 'hide',
    }

    // When defining `size: hide`, the `items` aren't
    // grouped and `audio` isn't set
    expect(Gallery.computed.rows.call(local)).to.eql([
      { minimal: true, items: [{ mimetype: 'image/jpg' }] },
      { minimal: true, items: [{ mimetype: 'image/png' }] },
      { minimal: true, items: [{ mimetype: 'image/jpg' }] },
      { minimal: true, items: [{ mimetype: 'audio/mpeg' }] },
      { minimal: true, items: [{ mimetype: 'image/png' }] },
      { minimal: true, items: [{ mimetype: 'audio/mpeg' }] },
      { minimal: true, items: [{ mimetype: 'image/jpg' }] },
      { minimal: true, items: [{ mimetype: 'image/png' }] },
      { minimal: true, items: [{ mimetype: 'image/jpg' }] },
    ])
  })

  // types other than image or audio should be `minimal`
  it('non-image/audio', () => {
    let local
    local = {
      attachments: [{ mimetype: 'plain/text' }],
    }
    expect(Gallery.computed.rows.call(local)).to.eql([
      { minimal: true, items: [{ mimetype: 'plain/text' }] },
    ])

    // No grouping of non-image/audio items
    local = {
      attachments: [
        { mimetype: 'plain/text' },
        { mimetype: 'plain/text' },
        { mimetype: 'plain/text' },
      ],
    }
    expect(Gallery.computed.rows.call(local)).to.eql([
      { minimal: true, items: [{ mimetype: 'plain/text' }] },
      { minimal: true, items: [{ mimetype: 'plain/text' }] },
      { minimal: true, items: [{ mimetype: 'plain/text' }] },
    ])

    local = {
      attachments: [
        { mimetype: 'image/png' },
        { mimetype: 'plain/text' },
        { mimetype: 'image/jpg' },
        { mimetype: 'audio/mpeg' },
      ],
    }
    // NOTE / TODO: When defining `size: hide`, the `items` aren't
    // grouped and `audio` isn't set
    expect(Gallery.computed.rows.call(local)).to.eql([
      { items: [{ mimetype: 'image/png' }] },
      { minimal: true, items: [{ mimetype: 'plain/text' }] },
      { items: [{ mimetype: 'image/jpg' }] },
      { audio: true, items: [{ mimetype: 'audio/mpeg' }] },
    ])
  })

  it('mixed attachments', () => {
    local = {
      attachments: [
        { mimetype: 'audio/mpeg' },
        { mimetype: 'image/png' },
        { mimetype: 'audio/mpeg' },
        { mimetype: 'image/jpg' },
        { mimetype: 'image/png' },
        { mimetype: 'image/jpg' },
        { mimetype: 'image/jpg' },
      ],
    }

    expect(Gallery.computed.rows.call(local)).to.eql([
      { audio: true, items: [{ mimetype: 'audio/mpeg' }] },
      { items: [{ mimetype: 'image/png' }] },
      { audio: true, items: [{ mimetype: 'audio/mpeg' }] },
      {
        items: [
          { mimetype: 'image/jpg' },
          { mimetype: 'image/png' },
          { mimetype: 'image/jpg' },
          { mimetype: 'image/jpg' },
        ],
      },
    ])

    local = {
      attachments: [
        { mimetype: 'image/jpg' },
        { mimetype: 'image/png' },
        { mimetype: 'image/jpg' },
        { mimetype: 'image/jpg' },
        { mimetype: 'audio/mpeg' },
        { mimetype: 'image/png' },
        { mimetype: 'audio/mpeg' },
      ],
    }

    expect(Gallery.computed.rows.call(local)).to.eql([
      {
        items: [
          { mimetype: 'image/jpg' },
          { mimetype: 'image/png' },
          { mimetype: 'image/jpg' },
        ],
      },
      { items: [{ mimetype: 'image/jpg' }] },
      { audio: true, items: [{ mimetype: 'audio/mpeg' }] },
      { items: [{ mimetype: 'image/png' }] },
      { audio: true, items: [{ mimetype: 'audio/mpeg' }] },
    ])

    local = {
      attachments: [
        { mimetype: 'image/jpg' },
        { mimetype: 'image/png' },
        { mimetype: 'image/jpg' },
        { mimetype: 'image/jpg' },
        { mimetype: 'image/png' },
        { mimetype: 'image/png' },
        { mimetype: 'image/jpg' },
      ],
    }

    // Group by three-per-row, unless there's one dangling, then stick it on the end of the last row
    // https://git.pleroma.social/pleroma/pleroma-fe/-/merge_requests/1785#note_98514
    expect(Gallery.computed.rows.call(local)).to.eql([
      {
        items: [
          { mimetype: 'image/jpg' },
          { mimetype: 'image/png' },
          { mimetype: 'image/jpg' },
        ],
      },
      {
        items: [
          { mimetype: 'image/jpg' },
          { mimetype: 'image/png' },
          { mimetype: 'image/png' },
          { mimetype: 'image/jpg' },
        ],
      },
    ])

    local = {
      attachments: [
        { mimetype: 'image/jpg' },
        { mimetype: 'image/png' },
        { mimetype: 'image/jpg' },
        { mimetype: 'image/jpg' },
        { mimetype: 'image/png' },
        { mimetype: 'image/png' },
        { mimetype: 'image/jpg' },
        { mimetype: 'image/png' },
      ],
    }

    expect(Gallery.computed.rows.call(local)).to.eql([
      {
        items: [
          { mimetype: 'image/jpg' },
          { mimetype: 'image/png' },
          { mimetype: 'image/jpg' },
        ],
      },
      {
        items: [
          { mimetype: 'image/jpg' },
          { mimetype: 'image/png' },
          { mimetype: 'image/png' },
        ],
      },
      { items: [{ mimetype: 'image/jpg' }, { mimetype: 'image/png' }] },
    ])
  })

  it('does not do grouping when grid is set', () => {
    const attachments = [
      { mimetype: 'audio/mpeg' },
      { mimetype: 'image/png' },
      { mimetype: 'audio/mpeg' },
      { mimetype: 'image/jpg' },
      { mimetype: 'image/png' },
      { mimetype: 'image/jpg' },
      { mimetype: 'image/jpg' },
    ]

    local = { grid: true, attachments }

    expect(Gallery.computed.rows.call(local)).to.eql([
      { grid: true, items: attachments },
    ])
  })

  it('limit is set', () => {
    const attachments = [
      { mimetype: 'audio/mpeg' },
      { mimetype: 'image/png' },
      { mimetype: 'image/jpg' },
      { mimetype: 'audio/mpeg' },
      { mimetype: 'image/jpg' },
    ]

    let local
    local = { attachments, limit: 2 }

    expect(Gallery.computed.rows.call(local)).to.eql([
      { audio: true, items: [{ mimetype: 'audio/mpeg' }] },
      { items: [{ mimetype: 'image/png' }] },
    ])

    local = { attachments, limit: 3 }

    expect(Gallery.computed.rows.call(local)).to.eql([
      { audio: true, items: [{ mimetype: 'audio/mpeg' }] },
      { items: [{ mimetype: 'image/png' }, { mimetype: 'image/jpg' }] },
    ])

    local = { attachments, limit: 4 }

    expect(Gallery.computed.rows.call(local)).to.eql([
      { audio: true, items: [{ mimetype: 'audio/mpeg' }] },
      { items: [{ mimetype: 'image/png' }, { mimetype: 'image/jpg' }] },
      { audio: true, items: [{ mimetype: 'audio/mpeg' }] },
    ])
  })
})
