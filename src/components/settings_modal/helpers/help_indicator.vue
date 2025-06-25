<template>
  <span class="HelpIndicator">
    <Popover
      trigger="click"
      :trigger-attrs="{ 'aria-label': $t('settings.setting_changed') }"
    >
      <template #trigger>
        &nbsp;
        <FAIcon icon="circle-question" />
      </template>
      <template #content>
        <div class="help-tooltip">
          <slot />
        </div>
      </template>
    </Popover>
  </span>
</template>

<script>
import Popover from 'src/components/popover/popover.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons'

library.add(
  faCircleQuestion
)

export default {
  components: { Popover }
}
</script>

<style lang="scss">
.HelpIndicator {
  display: inline-block;
  position: relative;
}

.help-tooltip {
  margin: 0.5em 1em;
  min-width: 10em;
  max-width: 30vw;
  text-align: center;
}
</style>
