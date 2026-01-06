<!-- this is a helper exclusive to Setting components -->
<!-- TODO make it reusable -->
<template>
  <span
    v-if="$parent.isDirty || $parent.canHardReset"
    class="DraftButtons"
  >
    <Popover
      v-if="$parent.isDirty"
      trigger="hover"
      normal-button
      :trigger-attrs="{ 'aria-label': $t('settings.commit_value_tooltip') }"
      @click="$parent.commitDraft"
    >
      <template #trigger>
        {{ $t('settings.commit_value') }}
      </template>
      <template #content>
        <div class="modified-tooltip">
          {{ $t('settings.commit_value_tooltip') }}
        </div>
      </template>
    </Popover>
    <Popover
      v-if="$parent.isDirty"
      trigger="hover"
      normal-button
      :trigger-attrs="{ 'aria-label': $t('settings.reset_value_tooltip') }"
      @click="$parent.reset"
    >
      <template #trigger>
        {{ $t('settings.reset_value') }}
      </template>
      <template #content>
        <div class="modified-tooltip">
          {{ $t('settings.reset_value_tooltip') }}
        </div>
      </template>
    </Popover>
    <Popover
      v-if="$parent.canHardReset"
      trigger="hover"
      normal-button
      :trigger-attrs="{ 'aria-label': $t('settings.hard_reset_value_tooltip') }"
      @click="$parent.hardReset"
    >
      <template #trigger>
        {{ $t('settings.hard_reset_value') }}
      </template>
      <template #content>
        <div class="modified-tooltip">
          {{ $t('settings.hard_reset_value_tooltip') }}
        </div>
      </template>
    </Popover>
  </span>
</template>

<script>
import Popover from 'src/components/popover/popover.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faWrench } from '@fortawesome/free-solid-svg-icons'

library.add(faWrench)

export default {
  components: { Popover },
  props: ['changed'],
}
</script>

<style lang="scss">
.DraftButtons {
  display: inline-flex;
  position: relative;
  gap: 0.5em;
  margin-top: 0.5em
}

.draft-tooltip {
  margin: 0.5em 1em;
  min-width: 10em;
  text-align: center;
}
</style>
