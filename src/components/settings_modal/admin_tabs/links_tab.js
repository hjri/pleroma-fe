import { get } from 'lodash-es'

import Checkbox from 'src/components/checkbox/checkbox.vue'
import AttachmentSetting from '../helpers/attachment_setting.vue'
import BooleanSetting from '../helpers/boolean_setting.vue'
import ChoiceSetting from '../helpers/choice_setting.vue'
import GroupSetting from '../helpers/group_setting.vue'
import IntegerSetting from '../helpers/integer_setting.vue'
import ListSetting from '../helpers/list_setting.vue'
import SharedComputedObject from '../helpers/shared_computed_object.js'
import StringSetting from '../helpers/string_setting.vue'

import { useAdminSettingsStore } from 'src/stores/admin_settings.js'

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
        useAdminSettingsStore().draft[':pleroma']['Pleroma.Formatter'][
          ':class'
        ] !== false
      )
    },
    relIsPresent() {
      return (
        useAdminSettingsStore().draft[':pleroma']['Pleroma.Formatter'][
          ':rel'
        ] !== false
      )
    },
    truncateIsPresent() {
      return (
        useAdminSettingsStore().draft[':pleroma']['Pleroma.Formatter'][
          ':truncate'
        ] !== false
      )
    },
    truncateDescription() {
      return get(useAdminSettingsStore().descriptions, [
        ':pleroma',
        'Pleroma.Formatter',
        ':truncate',
      ])
    },
    ttlSettersOptions() {
      const desc = get(
        useAdminSettingsStore().descriptions,
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
        useAdminSettingsStore().descriptions,
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
      return useAdminSettingsStore().draft[':pleroma'][':media_proxy'][
        ':enabled'
      ]
    },
    mediaInvalidationProvider() {
      return useAdminSettingsStore().draft[':pleroma'][':media_proxy'][
        ':invalidation'
      ][':provider']
    },
    ...SharedComputedObject(),
  },
  methods: {
    checkRel(e) {
      useAdminSettingsStore().updateAdminDraft({
        path: [':pleroma', 'Pleroma.Formatter', ':rel'],
        value: e ? '' : false,
      })
    },
    checkClass(e) {
      useAdminSettingsStore().updateAdminDraft({
        path: [':pleroma', 'Pleroma.Formatter', ':class'],
        value: e ? '' : false,
      })
    },
    checkTruncate(e) {
      useAdminSettingsStore().updateAdminDraft({
        path: [':pleroma', 'Pleroma.Formatter', ':truncate'],
        value: e ? 20 : false,
      })
    },
  },
}

export default LinksTab
