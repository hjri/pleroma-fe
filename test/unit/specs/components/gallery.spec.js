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
      attachments: [{ type: 'audio' }],
    }

    expect(Gallery.computed.rows.call(local)).to.eql([
      { audio: true, items: [{ type: 'audio' }] },
    ])
  })

  it('one image attachment', () => {
    local = {
      attachments: [{ type: 'image' }],
    }

    expect(Gallery.computed.rows.call(local)).to.eql([
      { items: [{ type: 'image' }] },
    ])
  })

  it('one audio attachment and one image attachment', () => {
    local = {
      attachments: [{ type: 'audio' }, { type: 'image' }],
    }

    expect(Gallery.computed.rows.call(local)).to.eql([
      { audio: true, items: [{ type: 'audio' }] },
      { items: [{ type: 'image' }] },
    ])
  })

  it('has "size" key set to "hide"', () => {
    let local
    local = {
      attachments: [{ type: 'audio' }],
      size: 'hide',
    }

    expect(Gallery.computed.rows.call(local)).to.eql([
      { minimal: true, items: [{ type: 'audio' }] },
    ])

    local = {
      attachments: [
        { type: 'image' },
        { type: 'image' },
        { type: 'image' },
        { type: 'audio' },
        { type: 'image' },
        { type: 'audio' },
        { type: 'image' },
        { type: 'image' },
        { type: 'image' },
      ],
      size: 'hide',
    }

    // When defining `size: hide`, the `items` aren't
    // grouped and `audio` isn't set
    expect(Gallery.computed.rows.call(local)).to.eql([
      { minimal: true, items: [{ type: 'image' }] },
      { minimal: true, items: [{ type: 'image' }] },
      { minimal: true, items: [{ type: 'image' }] },
      { minimal: true, items: [{ type: 'audio' }] },
      { minimal: true, items: [{ type: 'image' }] },
      { minimal: true, items: [{ type: 'audio' }] },
      { minimal: true, items: [{ type: 'image' }] },
      { minimal: true, items: [{ type: 'image' }] },
      { minimal: true, items: [{ type: 'image' }] },
    ])
  })

  // types other than image or audio should be `minimal`
  it('non-image', () => {
    let local
    local = {
      attachments: [{ type: 'plain' }],
    }
    expect(Gallery.computed.rows.call(local)).to.eql([
      { minimal: true, items: [{ type: 'plain' }] },
    ])

    // No grouping of non-image items
    local = {
      attachments: [
        { type: 'plain' },
        { type: 'plain' },
        { type: 'plain' },
      ],
    }
    expect(Gallery.computed.rows.call(local)).to.eql([
      { minimal: true, items: [{ type: 'plain' }] },
      { minimal: true, items: [{ type: 'plain' }] },
      { minimal: true, items: [{ type: 'plain' }] },
    ])

    local = {
      attachments: [
        { type: 'image' },
        { type: 'plain' },
        { type: 'image' },
        { type: 'audio' },
      ],
    }
    // NOTE / TODO: When defining `size: hide`, the `items` aren't
    // grouped and `audio` isn't set
    expect(Gallery.computed.rows.call(local)).to.eql([
      { items: [{ type: 'image' }] },
      { minimal: true, items: [{ type: 'plain' }] },
      { items: [{ type: 'image' }] },
      { audio: true, items: [{ type: 'audio' }] },
    ])
  })

  it('mixed attachments', () => {
    local = {
      attachments: [
        { type: 'audio' },
        { type: 'image' },
        { type: 'audio' },
        { type: 'image' },
        { type: 'image' },
        { type: 'image' },
        { type: 'image' },
      ],
    }

    expect(Gallery.computed.rows.call(local)).to.eql([
      { audio: true, items: [{ type: 'audio' }] },
      { items: [{ type: 'image' }] },
      { audio: true, items: [{ type: 'audio' }] },
      {
        items: [
          { type: 'image' },
          { type: 'image' },
          { type: 'image' },
          { type: 'image' },
        ],
      },
    ])

    local = {
      attachments: [
        { type: 'image' },
        { type: 'image' },
        { type: 'image' },
        { type: 'image' },
        { type: 'audio' },
        { type: 'image' },
        { type: 'audio' },
      ],
    }

    expect(Gallery.computed.rows.call(local)).to.eql([
      {
        items: [
          { type: 'image' },
          { type: 'image' },
          { type: 'image' },
        ],
      },
      { items: [{ type: 'image' }] },
      { audio: true, items: [{ type: 'audio' }] },
      { items: [{ type: 'image' }] },
      { audio: true, items: [{ type: 'audio' }] },
    ])

    local = {
      attachments: [
        { type: 'image' },
        { type: 'image' },
        { type: 'image' },
        { type: 'image' },
        { type: 'image' },
        { type: 'image' },
        { type: 'image' },
      ],
    }

    // Group by three-per-row, unless there's one dangling, then stick it on the end of the last row
    // https:/.pleroma.social-fe/-_requests#note_98514
    expect(Gallery.computed.rows.call(local)).to.eql([
      {
        items: [
          { type: 'image' },
          { type: 'image' },
          { type: 'image' },
        ],
      },
      {
        items: [
          { type: 'image' },
          { type: 'image' },
          { type: 'image' },
          { type: 'image' },
        ],
      },
    ])

    local = {
      attachments: [
        { type: 'image' },
        { type: 'image' },
        { type: 'image' },
        { type: 'image' },
        { type: 'image' },
        { type: 'image' },
        { type: 'image' },
        { type: 'image' },
      ],
    }

    expect(Gallery.computed.rows.call(local)).to.eql([
      {
        items: [
          { type: 'image' },
          { type: 'image' },
          { type: 'image' },
        ],
      },
      {
        items: [
          { type: 'image' },
          { type: 'image' },
          { type: 'image' },
        ],
      },
      { items: [{ type: 'image' }, { type: 'image' }] },
    ])
  })

  it('does not do grouping when grid is set', () => {
    const attachments = [
      { type: 'audio' },
      { type: 'image' },
      { type: 'audio' },
      { type: 'image' },
      { type: 'image' },
      { type: 'image' },
      { type: 'image' },
    ]

    local = { grid: true, attachments }

    expect(Gallery.computed.rows.call(local)).to.eql([
      { grid: true, items: attachments },
    ])
  })

  it('limit is set', () => {
    const attachments = [
      { type: 'audio' },
      { type: 'image' },
      { type: 'image' },
      { type: 'audio' },
      { type: 'image' },
    ]

    let local
    local = { attachments, limit: 2 }

    expect(Gallery.computed.rows.call(local)).to.eql([
      { audio: true, items: [{ type: 'audio' }] },
      { items: [{ type: 'image' }] },
    ])

    local = { attachments, limit: 3 }

    expect(Gallery.computed.rows.call(local)).to.eql([
      { audio: true, items: [{ type: 'audio' }] },
      { items: [{ type: 'image' }, { type: 'image' }] },
    ])

    local = { attachments, limit: 4 }

    expect(Gallery.computed.rows.call(local)).to.eql([
      { audio: true, items: [{ type: 'audio' }] },
      { items: [{ type: 'image' }, { type: 'image' }] },
      { audio: true, items: [{ type: 'audio' }] },
    ])
  })
})
