<template>
  <ul class="interface-language-switcher setting-list">
    <li
      v-for="index of controlledLanguage.keys()"
      :key="index"
      class="setting-item"
    >
      <label
        class="setting-label"
        :for="uniqueId+index"
      >
        {{ index === 0 ? $t('settings.primary_language') : $t('settings.fallback_language', { index }, index) }}
      </label>
      <span class="setting-control btn-group">
        <Select
          :id="uniqueId+index"
          :name="uniqueId+index"
          class="language-select"
          :model-value="controlledLanguage[index]"
          @update:model-value="val => setLanguageAt(index, val)"
        >
          <option
            v-for="lang in languages"
            :key="lang.code"
            :value="lang.code"
          >
            {{ lang.name }}
          </option>
        </Select>
        <button
          v-if="controlledLanguage.length > 1 && index !== 0"
          class="button-default btn"
          @click="() => removeLanguageAt(index)"
        >
          {{ $t('settings.remove_language') }}
        </button>
      </span>
    </li>
    <li class="add-button">
      <button
        class="button-default btn"
        @click="addLanguage"
      >
        {{ $t('settings.add_language') }}
      </button>
    </li>
  </ul>
</template>

<script src="./interface_language_switcher.js"></script>

<style lang="scss">
.interface-language-switcher {
  .setting-list {
    .setting-item {
      display: grid;
      grid-template-columns: subgrid;
    }
  }

  .add-button {
    display: block;
    text-align: center;
    padding-bottom: 1em;

    .default-button {
      display: block;
      width: auto;
    }
  }

  .-mobile & {
    li.setting-item {
      display: flex;
      flex-direction: column;
      gap: 0.5em;
      align-items: stretch;
      border-bottom: none;
    }

    .add-button {
      border-bottom: 1px solid var(--border);
    }
  }
}
</style>
