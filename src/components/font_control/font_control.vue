<template>
  <div class="font-control">
    <span
      v-if="manualEntry"
      class="btn-group"
    >
      <button
        class="btn button-default toggle-manual-entry"
        :title="$t('settings.style.themes3.font.lookup_local_fonts')"
        @click="toggleManualEntry"
      >
        <FAIcon
          fixed-width
          icon="font"
        />
      </button>
      <input
        :id="id"
        v-model="modelValue"
        class="input custom-font"
        type="text"
      >
    </span>
    <span
      v-else
      class="font-selector btn-group"
    >
      <button
        class="btn button-default toggle-manual-entry"
        :title="$t('settings.style.themes3.font.enter_manually')"
        @click="toggleManualEntry"
      >
        <FAIcon
          fixed-width
          icon="keyboard"
        />
      </button>
      <Select
        :id="id"
        :model-value="modelValue"
        :placeholder="$t('settings.style.themes3.font.default')"
        class="custom-font"
        @update:model-value="v => $emit('update:modelValue', v !== 'undefined' ? v : undefined)"
      >
        <option value="undefined">
          {{ $t('settings.style.themes3.font.default') }}
        </option>
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
    <span
      v-if="manualEntry"
      class="faint"
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
    </span>
    <span
      v-else
      class="faint"
    >
      {{ $t('settings.style.themes3.font.select') }}
    </span>
  </div>
</template>

<script src="./font_control.js"></script>

<style lang="scss">
.font-control {
  display: inline-flex;
  flex-direction: column;
  justify-items: center;

  .btn.button-default.toggle-manual-entry {
    padding: 0 0.75em;
  }
}
</style>
