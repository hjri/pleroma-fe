<template>
  <ul class="InterfaceLanguageSwitcher">
    <li
      v-for="index of controlledLanguage.keys()"
      :key="index"
      class="language"
    >
      <span class="btn-group">
        <Select
          :id="index === 0 ? (id ?? (uniqueId + index)) : (uniqueId + index)"
          class="language-select"
          :disabled="disabled"
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
    <li
      v-if="!single"
      class="add-button"
    >
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
.InterfaceLanguageSwitcher {
  display: flex;
  flex-direction: column;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 0.75em;
  place-items: stretch;

  .language {
    display: flex;
    flex-direction: column;

    > label {
      text-align: center;
      margin-bottom: 0.5em;
    }

    .Select {
      width: 100%;
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
}
</style>
