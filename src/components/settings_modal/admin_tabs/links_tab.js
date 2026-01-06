import BooleanSetting from '../helpers/boolean_setting.vue'
import ChoiceSetting from '../helpers/choice_setting.vue'
import IntegerSetting from '../helpers/integer_setting.vue'
import StringSetting from '../helpers/string_setting.vue'
import GroupSetting from '../helpers/group_setting.vue'
import AttachmentSetting from '../helpers/attachment_setting.vue'
import ListSetting from '../helpers/list_setting.vue'

import Checkbox from 'src/components/checkbox/checkbox.vue'

import SharedComputedObject from '../helpers/shared_computed_object.js'
import { get } from 'lodash'

const LinksTab = {
  provide() {
    return {
      defaultDraftMode: true,
      defaultSource: 'admin',
    }
  },
  components: {
    BooleanSetting,
    ChoiceSetting,
    IntegerSetting,
    StringSetting,
    AttachmentSetting,
    GroupSetting,
    ListSetting,
    Checkbox,
  },
  computed: {
    classIsPresent() {
      return (
        this.$store.state.adminSettings.draft[':pleroma']['Pleroma.Formatter'][
          ':class'
        ] !== false
      )
    },
    relIsPresent() {
      return (
        this.$store.state.adminSettings.draft[':pleroma']['Pleroma.Formatter'][
          ':rel'
        ] !== false
      )
    },
    truncateIsPresent() {
      return (
        this.$store.state.adminSettings.draft[':pleroma']['Pleroma.Formatter'][
          ':truncate'
        ] !== false
      )
    },
    truncateDescription() {
      return get(this.$store.state.adminSettings.descriptions, [
        ':pleroma',
        'Pleroma.Formatter',
        ':truncate',
      ])
    },
    ttlSettersOptions() {
      const desc = get(
        this.$store.state.adminSettings.descriptions,
        ':pleroma.:rich_media.:ttl_setters',
      )
      return new Set(
        desc.suggestions.map((option) => ({
          label: option.replace('Pleroma.Web.RichMedia.Parser.TTL.', ''),
          value: option,
        })),
      )
    },
    parsersOptions() {
      const desc = get(
        this.$store.state.adminSettings.descriptions,
        ':pleroma.:rich_media.:parsers',
      )
      return new Set(
        desc.suggestions.map((option) => ({
          label: option.replace('Pleroma.Web.RichMedia.Parsers.', ''),
          value: option,
        })),
      )
    },
    validateTLDOptions() {
      return [
        {
          label: this.$t('general.yes'),
          value: true,
        },
        {
          label: this.$t('general.no'),
          value: false,
        },
        {
          label: this.$t('admin_dash.links.no_scheme'),
          value: ':no_scheme',
        },
      ]
    },
    mediaProxyEnabled() {
      return this.$store.state.adminSettings.draft[':pleroma'][':media_proxy'][
        ':enabled'
      ]
    },
    mediaInvalidationProvider() {
      return this.$store.state.adminSettings.draft[':pleroma'][':media_proxy'][
        ':invalidation'
      ][':provider']
    },
    ...SharedComputedObject(),
  },
  methods: {
    checkRel(e) {
      this.$store.commit('updateAdminDraft', {
        path: [':pleroma', 'Pleroma.Formatter', ':rel'],
        value: e ? '' : false,
      })
    },
    checkClass(e) {
      this.$store.commit('updateAdminDraft', {
        path: [':pleroma', 'Pleroma.Formatter', ':class'],
        value: e ? '' : false,
      })
    },
    checkTruncate(e) {
      this.$store.commit('updateAdminDraft', {
        path: [':pleroma', 'Pleroma.Formatter', ':truncate'],
        value: e ? 20 : false,
      })
    },
  },
}

export default LinksTab
