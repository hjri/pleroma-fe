<template>
  <div class="font-control">
    <div class="setting-item">
      <Checkbox
        v-if="typeof fallback !== 'undefined'"
        :id="name + '-o'"
        class="font-checkbox setting-control setting-label"
        :model-value="present"
        @change="$emit('update:modelValue', typeof modelValue === 'undefined' ? fallback : undefined)"
      >
        <i18n-t
          scope="global"
          keypath="settings.style.fonts.override"
          tag="span"
        >
          <span class="label">
            {{ label }}
          </span>
        </i18n-t>
      </Checkbox>
    </div>
    {{ ' ' }}
    <div
      v-if="modelValue?.family"
      class="font-input setting-item"
    >
      <label
        v-if="manualEntry"
        :id="name + '-label'"
        :for="manualEntry ? name : name + '-font-switcher'"
        class="label"
      >
        <i18n-t
          keypath="settings.style.themes3.font.entry"
          tag="span"
          scope="global"
        >
          <template #fontFamily>
            <code>font-family</code>
          </template>
        </i18n-t>
      </label>
      <label
        v-else
        :id="name + '-label'"
        :for="manualEntry ? name : name + '-font-switcher'"
        class="label"
      >
        {{ $t('settings.style.themes3.font.select') }}
      </label>
      {{ ' ' }}
      <span
        v-if="manualEntry"
        class="btn-group"
      >
        <button
          class="btn button-default"
          :title="$t('settings.style.themes3.font.lookup_local_fonts')"
          @click="toggleManualEntry"
        >
          <FAIcon
            fixed-width
            icon="font"
          />
        </button>
        <input
          :id="name"
          :model-value="modelValue.family"
          class="input custom-font"
          type="text"
          @update:modelValue="$emit('update:modelValue', { ...(modelValue || {}), family: $event.target.value })"
        >
      </span>
      <span
        v-else
        class="btn-group"
      >
        <button
          class="btn button-default"
          :title="$t('settings.style.themes3.font.enter_manually')"
          @click="toggleManualEntry"
        >
          <FAIcon
            fixed-width
            icon="keyboard"
          />
        </button>
        <Select
          :id="name + '-local-font-switcher'"
          :model-value="modelValue?.family"
          class="custom-font"
          @update:model-value="v => $emit('update:modelValue', { ...(modelValue || {}), family: v })"
        >
          <optgroup
            :label="$t('settings.style.themes3.font.group-builtin')"
          >
            <option
              v-for="option in availableOptions"
              :key="option"
              :value="option"
              :style="{ fontFamily: option === 'inherit' ? null : option }"
            >
              {{ $t('settings.style.themes3.font.builtin.' + option) }}
            </option>
          </optgroup>
          <optgroup
            v-if="localFontsSize > 0"
            :label="$t('settings.style.themes3.font.group-local')"
          >
            <option
              v-for="option in localFontsList"
              :key="option"
              :value="option"
              :style="{ fontFamily: option }"
            >
              {{ option }}
            </option>
          </optgroup>
          <optgroup
            v-else
            :label="$t('settings.style.themes3.font.group-local')"
          >
            <option disabled>
              {{ $t('settings.style.themes3.font.local-unavailable1') }}
            </option>
            <option disabled>
              {{ $t('settings.style.themes3.font.local-unavailable2') }}
            </option>
          </optgroup>
        </Select>
      </span>
    </div>
  </div>
</template>

<script src="./font_control.js"></script>

<style lang="scss">
// Copy-paste of BooleanSetting
.font-control {
  display: grid;
  grid-template-columns: subgrid;

  .checkbox {
    display: grid;
    grid-template-columns: subgrid;
  }

  .label {
    grid-area: label;
    text-align: right;
  }

  .-mobile & {
    .label {
      text-align: left;
    }
  }

  .checkbox-indicator {
    grid-area: control;
  }
}

.invalid-tooltip {
  margin: 0.5em 1em;
  min-width: 10em;
  text-align: center;
}
</style>
