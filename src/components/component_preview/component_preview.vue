<template>
  <div
    :id="'component-preview-' + randomSeed"
    class="ComponentPreview"
    :class="{ '-shadow-controls': shadowControl }"
  >
    <label
      v-show="shadowControl"
      role="heading"
      class="header"
      :class="{ faint: disabled }"
    >
      {{ $t('settings.style.shadows.offset') }}
    </label>
    <label
      v-show="shadowControl && !hideControls"
      class="x-shift-number"
    >
      {{ $t('settings.style.shadows.offset-x') }}
      <input
        :value="shadow?.x"
        :disabled="disabled"
        :class="{ disabled }"
        class="input input-number"
        type="number"
        @input="e => updateProperty('x', e.target.value)"
      >
    </label>
    <label
      v-show="shadowControl && !hideControls"
      class="y-shift-number"
    >
      {{ $t('settings.style.shadows.offset-y') }}
      <input
        :value="shadow?.y"
        :disabled="disabled"
        :class="{ disabled }"
        class="input input-number"
        type="number"
        @input="e => updateProperty('y', e.target.value)"
      >
    </label>
    <input
      v-show="shadowControl && !hideControls"
      :value="shadow?.x"
      :disabled="disabled"
      :class="{ disabled }"
      class="input input-range x-shift-slider"
      type="range"
      max="20"
      min="-20"
      @input="e => updateProperty('x', e.target.value)"
    >
    <input
      v-show="shadowControl && !hideControls"
      :value="shadow?.y"
      :disabled="disabled"
      :class="{ disabled }"
      class="input input-range y-shift-slider"
      type="range"
      max="20"
      min="-20"
      @input="e => updateProperty('y', e.target.value)"
    >
    <div
      class="preview-window"
      :class="{ '-light-grid': lightGrid }"
    >
      <div
        class="preview-block"
        :class="previewClass"
      >
        {{ $t('settings.style.themes3.editor.test_string') }}
      </div>
      <div
        v-if="invalid"
        class="invalid-container"
      >
        <div class="alert error invalid-label">
          {{ $t('settings.style.themes3.editor.invalid') }}
        </div>
      </div>
    </div>
    <div class="assists">
      <Checkbox
        v-model="lightGrid"
        name="lightGrid"
        class="input-light-grid"
      >
        {{ $t('settings.style.shadows.light_grid') }}
      </Checkbox>
      <div class="style-control">
        <label class="label">
          {{ $t('settings.style.shadows.zoom') }}
        </label>
        <input
          v-model="zoom"
          class="input input-number y-shift-number"
          type="number"
        >
      </div>
      <ColorInput
        v-if="!noColorControl"
        v-model="colorOverride"
        class="input-color-input"
        fallback="#606060"
        :compact="true"
        :label="$t('settings.style.shadows.color_override')"
      />
    </div>
  </div>
</template>

<script src="./component_preview.js" />
<style src="./component_preview.scss" lang="scss" />
