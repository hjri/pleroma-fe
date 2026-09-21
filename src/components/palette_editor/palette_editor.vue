<template>
  <div
    class="PaletteEditor"
    :class="{ '-compact': compact, '-apply': apply, '-mobile': mobile }"
  >
    <div class="palette">
      <div
        v-for="key in paletteKeys"
        :key="key"
      >
        <ColorInput
          :name="key"
          :model-value="props.modelValue[key]"
          :fallback="fallback(key)"
          :label="$t('settings.style.themes3.palette.' + key)"
          @update:model-value="value => updatePalette(key, value)"
        />
        <ContrastRatio
          v-if="contrast?.[key]"
          :show-ratio="true"
          :contrast="contrast[key]"
        />
        <div v-else>
          {{ '&nbsp;' }}
        </div>
      </div>
    </div>
    <div class="buttons">
      <button
        class="btn button-default palette-import-button"
        @click="importPalette"
      >
        <FAIcon icon="file-import" />
        {{ $t('settings.style.themes3.palette.import') }}
      </button>
      <button
        class="btn button-default palette-export-button"
        @click="exportPalette"
      >
        <FAIcon icon="file-export" />
        {{ $t('settings.style.themes3.palette.export') }}
      </button>
    </div>
    <div class="buttons">
      <button
        v-if="apply"
        class="btn button-default palette-apply-button"
        :disabled="disabled"
        :class="{ disabled }"
        @click="applyPalette"
      >
        {{ $t('settings.style.themes3.palette.apply') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

import ColorInput from 'src/components/color_input/color_input.vue'
import ContrastRatio from 'src/components/contrast_ratio/contrast_ratio.vue'

import { useInterfaceStore } from 'src/stores/interface.js'

import {
  getContrastRatio,
  hex2rgb,
} from 'src/services/color_convert/color_convert.js'
import {
  newExporter,
  newImporter,
} from 'src/services/export_import/export_import.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faFileExport, faFileImport } from '@fortawesome/free-solid-svg-icons'

library.add(faFileImport, faFileExport)

const paletteKeys = [
  'bg',
  'fg',
  'text',
  'link',
  'accent',
  'cRed',
  'cBlue',
  'cGreen',
  'cOrange',
  'wallpaper',
]

const props = defineProps({
  modelValue: Object,
  compact: Boolean,
  apply: Boolean,
  disabled: Boolean,
})
const emit = defineEmits(['update:modelValue', 'applyPalette'])
const getExportedObject = () =>
  paletteKeys.reduce((acc, key) => {
    const value = props.modelValue[key]
    if (value == null) {
      return acc
    } else {
      return { ...acc, [key]: props.modelValue[key] }
    }
  }, {})

const paletteExporter = newExporter({
  filename: 'pleroma_palette',
  extension: 'json',
  getExportedObject,
})
const paletteImporter = newImporter({
  accept: '.json',
  onImport(parsed) {
    emit('update:modelValue', parsed)
  },
})

const exportPalette = () => {
  paletteExporter.exportData()
}

const importPalette = () => {
  paletteImporter.importData()
}

const hints = (ratio) => ({
  text: ratio.toPrecision(3) + ':1',
  // AA level, AAA level
  aa: ratio >= 4.5,
  aaa: ratio >= 7,
  // same but for 18pt+ texts
  laa: ratio >= 3,
  laaa: ratio >= 4.5,
})

const applyPalette = () => {
  emit('applyPalette', getExportedObject())
}

const mobile = computed(() => {
  return useInterfaceStore().layoutType === 'mobile'
})

const contrast = computed(() => {
  if (props.modelValue == null) return null
  const bg = hex2rgb(props.modelValue.bg)
  const text = hex2rgb(props.modelValue.text)
  const link = hex2rgb(props.modelValue.link)
  if (text == null || link == null) return null

  return {
    text: hints(getContrastRatio(bg, text)),
    link: hints(getContrastRatio(bg, link)),
  }
})

const fallback = (key) => {
  if (key === 'accent') {
    return props.modelValue.link
  }
  if (key === 'link') {
    return props.modelValue.accent
  }
  if (key.startsWith('extra')) {
    return '#FF00FF'
  }
  if (key.startsWith('wallpaper')) {
    return '#008080'
  }
}

const updatePalette = (paletteKey, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [paletteKey]: value,
  })
}
</script>

<style lang="scss">
.PaletteEditor {
  justify-content: space-around;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(5, 1fr) auto;
  gap: 0.5em;
  align-items: baseline;

  .buttons {
    margin-top: 0.5em;
    display: grid;
    gap: 0.5em
  }

  .palette {
    display: grid;
    grid-template-rows: 1fr;
    grid-auto-flow: row;
    grid-auto-rows: auto;
    grid-template-columns: repeat(auto-fill, 10em);
    gap: 0.5em;
    margin-bottom: 0.5em;
  }

  .palette-import-button {
    grid-column: 1 / span 2;
  }

  .palette-export-button {
    grid-column: 3 / span 2;
  }

  .palette-apply-button {
    grid-column: 1 / span 2;
  }

  .color-input.style-control {
    margin: 0;
  }

  &.-compact {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(5, 1fr) auto;

    .palette-import-button {
      grid-column: 1;
    }

    .palette-export-button {
      grid-column: 2;
    }

    &.-apply {
      grid-template-rows: repeat(5, 1fr) auto auto;

      .palette-apply-button {
        grid-column: 1 / span 2;
      }
    }
  }

  &.-mobile {
    &.-apply {
      .palette-apply-button {
        grid-column: 1 / span 2;
      }
    }
  }
}
</style>
