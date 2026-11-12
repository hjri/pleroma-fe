<template>
  <span class="SettingIndicators">
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
        <div class="indicator-tooltip">
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
        <div class="indicator-tooltip">
          {{ $t('settings.setting_local_override') }}
        </div>
      </template>
    </Popover>
    <Popover
      v-if="isChanged"
      trigger="hover"
      :aria-label="$t('settings.setting_changed')"
      tooltip
    >
      <template #trigger>
        <FAIcon
          icon="wrench"
        />
      </template>
      <template #content>
        <div class="indicator-tooltip">
          {{ $t( 'settings.setting_changed') }}
        </div>
      </template>
    </Popover>
  </span>
</template>

<script>
import Popover from 'src/components/popover/popover.vue'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faDesktop, faScrewdriverWrench, faWrench } from '@fortawesome/free-solid-svg-icons'

library.add(faDesktop, faScrewdriverWrench, faWrench)

export default {
  components: { Popover },
  props: {
    isChanged: Boolean,
    isLocal: Boolean,
    isOverriden: Boolean,
  },
}
</script>

<style lang="scss">
.SettingIndicators {
  display: inline-block;
  position: relative;
}

.indicator-tooltip {
  margin: 0.5em 1em;
  min-width: 10em;
  text-align: center;
}
</style>
