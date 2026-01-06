import BooleanSetting from '../helpers/boolean_setting.vue'
import ChoiceSetting from '../helpers/choice_setting.vue'
import IntegerSetting from '../helpers/integer_setting.vue'
import StringSetting from '../helpers/string_setting.vue'
import GroupSetting from '../helpers/group_setting.vue'
import ColorSetting from '../helpers/color_setting.vue'
import AttachmentSetting from '../helpers/attachment_setting.vue'

import SharedComputedObject from '../helpers/shared_computed_object.js'

const MailerTab = {
  provide () {
    return {
      defaultDraftMode: true,
      defaultSource: 'admin'
    }
  },
  components: {
    BooleanSetting,
    ChoiceSetting,
    IntegerSetting,
    StringSetting,
    AttachmentSetting,
    ColorSetting,
    GroupSetting
  },
  computed: {
    adaptersLabels () {
      const prefix = 'Swoosh.Adapters.'
      const descriptions = this.$store.state.adminSettings.descriptions
      const options = descriptions[':pleroma']['Pleroma.Emails.Mailer'][':adapter'].suggestions

      return Object.fromEntries(options.map(value => [
        value, value.replace(prefix, '')
      ]))
    },
    startTLSLabels () {
      return {
        ':always': this.$t('admin_dash.generic_enforcement.always'),
        ':if_available': this.$t('admin_dash.generic_enforcement.if_available'),
        ':never': this.$t('admin_dash.generic_enforcement.never')
      }
      // return Object.fromEntries(options.map(value => [
      //   value, value.replace(prefix, '')
      // ]))
    },
    adapter () {
      return this.$store.state.adminSettings.draft[':pleroma']['Pleroma.Emails.Mailer'][':adapter']
    },
    mailerEnabled () {
      return this.$store.state.adminSettings.draft[':pleroma']['Pleroma.Emails.Mailer'][':enabled']
    },
    ...SharedComputedObject()
  },
  methods: {
    adapterHasKey (key) {
      const descriptions = this.$store.state.adminSettings.descriptions
      const mailerStuff = descriptions[':pleroma']['Pleroma.Emails.Mailer']
      const adapterStuff = mailerStuff[':subgroup,' + this.adapter]
      return Object.hasOwn(adapterStuff, key)
    }
  }
}

export default MailerTab
