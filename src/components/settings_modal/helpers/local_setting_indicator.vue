<template>
  <span
    v-if="isLocal"
    class="LocalSettingIndicator"
  >
    <Popover
      trigger="hover"
    >
      <template #trigger>
        <FAIcon
          icon="desktop"
          :aria-label="$t('settings.setting_local_side')"
        />
      </template>
      <template #content>
        <div class="profilesetting-tooltip">
          {{ $t('settings.setting_local_side') }}
        </div>
      </template>
    </Popover>
  </span>
</template>

<script>
import Popover from 'src/components/popover/popover.vue'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faDesktop } from '@fortawesome/free-solid-svg-icons'

library.add(faDesktop)

export default {
  components: { Popover },
  props: ['isLocal'],
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
