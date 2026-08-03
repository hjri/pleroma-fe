import mastoapidata from '../../../../fixtures/mastoapi.json'

import {
  parseLinkHeaderPagination,
  parseStatus,
  parseUser,
} from 'src/services/entity_normalizer/entity_normalizer.service.js'

const makeMockUserMasto = (overrides = {}) => {
  return {
    acct: 'hj',
    avatar:
    'https://shigusegubu.club/media/1657b945-8d5b-4ce6-aafb-4c3fc5772120/8ce851029af84d55de9164e30cc7f46d60cbf12eee7e96c5c0d35d9038ddade1.png',
    avatar_static:
    'https://shigusegubu.club/media/1657b945-8d5b-4ce6-aafb-4c3fc5772120/8ce851029af84d55de9164e30cc7f46d60cbf12eee7e96c5c0d35d9038ddade1.png',
    bot: false,
    created_at: '2017-12-17T21:54:14.000Z',
    display_name: 'whatever whatever whatever witch',
    emojis: [],
    fields: [],
    followers_count: 705,
    following_count: 326,
    header:
    'https://shigusegubu.club/media/7ab024d9-2a8a-4fbc-9ce8-da06756ae2db/6aadefe4e264133bc377ab450e6b045b6f5458542a5c59e6c741f86107f0388b.png',
    header_static:
    'https://shigusegubu.club/media/7ab024d9-2a8a-4fbc-9ce8-da06756ae2db/6aadefe4e264133bc377ab450e6b045b6f5458542a5c59e6c741f86107f0388b.png',
    id: '1',
    locked: false,
    note: 'Volatile Internet Weirdo. Name pronounced as Hee Jay. JS and Java dark arts mage, Elixir trainee. I love sampo and lain. Matrix is <span><a data-user="1" href="https://shigusegubu.club/users/hj">@<span>hj</span></a></span>:matrix.heldscal.la Pronouns are whatever. Do not DM me unless it\'s truly private matter and you\'re instance\'s admin or you risk your DM to be reposted publicly.Wish i was Finnish girl.',
    pleroma: { confirmation_pending: false, tags: null },
    source: { note: '', privacy: 'public', sensitive: false },
    statuses_count: 41775,
    url: 'https://shigusegubu.club/users/hj',
    username: 'hj',
    ...overrides,
  }
}

const makeMockStatusMasto = (overrides = {}) => {
  return {
    account: makeMockUserMasto(),
    application: { name: 'Web', website: null },
    content:
    '<span><a data-user="14660" href="https://pleroma.soykaf.com/users/sampo">@<span>sampo</span></a></span> god i wish i was there',
    created_at: '2019-01-17T16:29:23.000Z',
    emojis: [],
    favourited: false,
    favourites_count: 1,
    id: '10423476',
    in_reply_to_account_id: '14660',
    in_reply_to_id: '10423197',
    language: null,
    media_attachments: [],
    mentions: [
      {
        acct: 'sampo@pleroma.soykaf.com',
        id: '14660',
        url: 'https://pleroma.soykaf.com/users/sampo',
        username: 'sampo',
      },
    ],
    muted: false,
    reblog: null,
    reblogged: false,
    reblogs_count: 0,
    replies_count: 0,
    sensitive: false,
    spoiler_text: '',
    tags: [],
    uri: 'https://shigusegubu.club/objects/16033fbb-97c0-4f0e-b834-7abb92fb8639',
    url: 'https://shigusegubu.club/objects/16033fbb-97c0-4f0e-b834-7abb92fb8639',
    visibility: 'public',
    pleroma: {
      local: true,
    },
    ...overrides,
  }
}

const makeMockEmojiMasto = (overrides = [{}]) => {
  return [
    {
      shortcode: 'image',
      static_url: 'https://example.com/image.png',
      url: 'https://example.com/image.png',
      visible_in_picker: false,
      ...overrides[0],
    },
    {
      shortcode: 'thinking',
      static_url: 'https://example.com/think.png',
      url: 'https://example.com/think.png',
      visible_in_picker: false,
      ...overrides[1],
    },
  ]
}

describe('API Entities normalizer', () => {
  describe('parseStatus', () => {
    describe('Mastoapi preprocessing and converting', () => {
      it("doesn't blow up", () => {
        const parsed = mastoapidata.map(parseStatus)
        expect(parsed.length).to.eq(mastoapidata.length)
      })

      it('processes repeats correctly', () => {
        const post = makeMockStatusMasto({ reblog: null, id: 'deadbeef' })
        const repeat = makeMockStatusMasto({ reblog: post, id: 'foobar' })

        const parsedPost = parseStatus(post)
        const parsedRepeat = parseStatus(repeat)

        expect(parsedPost).to.have.property('type', 'status')
        expect(parsedRepeat).to.have.property('type', 'retweet')
        expect(parsedRepeat).to.have.property('retweeted_status')
        expect(parsedRepeat).to.have.nested.property(
          'retweeted_status.id',
          'deadbeef',
        )
      })
    })
  })

  // Statuses generally already contain some info regarding users and there's nearly 1:1 mapping, so very little to test
  describe('parseUsers (MastoAPI)', () => {
    it('sets correct is_local for users depending on their screen_name', () => {
      const local = makeMockUserMasto({ acct: 'foo' })
      const remote = makeMockUserMasto({ acct: 'foo@bar.baz' })

      expect(parseUser(local)).to.have.property('is_local', true)
      expect(parseUser(remote)).to.have.property('is_local', false)
    })

    it('removes html tags from user profile fields', () => {
      const user = makeMockUserMasto({
        emojis: makeMockEmojiMasto(),
        fields: [
          {
            name: 'user',
            value: '<a rel="me" href="https://example.com/@user">@user</a>',
          },
        ],
      })

      const parsedUser = parseUser(user)

      expect(parsedUser).to.have.property('fields_text').to.be.an('array')

      const field = parsedUser.fields_text[0]

      expect(field).to.have.property('name').that.equal('user')
      expect(field).to.have.property('value').that.equal('@user')
    })

    it('adds hide_follows and hide_followers user settings', () => {
      const user = makeMockUserMasto({
        pleroma: {
          hide_followers: true,
          hide_follows: false,
          hide_followers_count: false,
          hide_follows_count: true,
        },
      })

      expect(parseUser(user)).to.have.property('hide_followers', true)
      expect(parseUser(user)).to.have.property('hide_follows', false)
      expect(parseUser(user)).to.have.property('hide_followers_count', false)
      expect(parseUser(user)).to.have.property('hide_follows_count', true)
    })

    it('converts IDN to unicode and marks it as internatonal', () => {
      const user = makeMockUserMasto({ acct: 'lain@xn--lin-6cd.com' })

      expect(parseUser(user))
        .to.have.property('screen_name_ui')
        .that.equal('lain@lаin.com')
      expect(parseUser(user))
        .to.have.property('screen_name_ui_contains_non_ascii')
        .that.equal(true)
    })
  })

  describe('Link header pagination', () => {
    it('Parses min and max ids as integers', () => {
      const linkHeader =
        '<https://example.com/api/v1/notifications?max_id=861676>; rel="next", <https://example.com/api/v1/notifications?min_id=861741>; rel="prev"'
      const result = parseLinkHeaderPagination(linkHeader)
      expect(result).to.eql({
        maxId: 861676,
        minId: 861741,
      })
    })

    it('Parses min and max ids as flakes', () => {
      const linkHeader =
        '<http://example.com/api/v1/timelines/home?max_id=9waQx5IIS48qVue2Ai>; rel="next", <http://example.com/api/v1/timelines/home?min_id=9wi61nIPnfn674xgie>; rel="prev"'
      const result = parseLinkHeaderPagination(linkHeader, { flakeId: true })
      expect(result).to.eql({
        maxId: '9waQx5IIS48qVue2Ai',
        minId: '9wi61nIPnfn674xgie',
      })
    })
  })
})
