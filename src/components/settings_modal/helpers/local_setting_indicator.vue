<template>
  <span
    v-if="isLocal || isOverriden"
    class="LocalSettingIndicator"
  >
    <Popover
      v-if="isLocal"
      trigger="hover"
      :aria-label="$t('settings.setting_local_side')"
      tooltip
    >
      <template #trigger>
        <FAIcon
          icon="desktop"
        />
      </template>
      <template #content>
        <div class="profilesetting-tooltip">
          {{ $t('settings.setting_local_side') }}
        </div>
      </template>
    </Popover>
    <Popover
      v-if="isOverriden"
      trigger="hover"
      :aria-label="$t('settings.setting_local_override')"
      tooltip
    >
      <template #trigger>
        <FAIcon
          icon="screwdriver-wrench"
        />
      </template>
      <template #content>
        <div class="profilesetting-tooltip">
          {{ $t('settings.setting_local_override') }}
        </div>
      </template>
    </Popover>
  </span>
</template>

<script>
import Popover from 'src/components/popover/popover.vue'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faDesktop,
  faScrewdriverWrench,
} from '@fortawesome/free-solid-svg-icons'

library.add(faDesktop, faScrewdriverWrench)

export default {
  components: { Popover },
  props: {
    isLocal: Boolean,
    isOverriden: Boolean,
  },
}
</script>

<style lang="scss">
.LocalSettingIndicator {
  display: inline-block;
  position: relative;
}

.profilesetting-tooltip {
  margin: 0.5em 1em;
  min-width: 10em;
  text-align: center;
}
</style>
