<template>
  <div class="interface-language-switcher">
    <label>
      <slot />
      <ProfileSettingIndicator :is-profile="profile" />
    </label>
    <ul class="setting-list">
      <li
        v-for="index of controlledLanguage.keys()"
        :key="index"
      >
        <label>
          {{ index === 0 ? $t('settings.primary_language') : $t('settings.fallback_language', { index }, index) }}
          <Select
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
        </label>
        <button
          v-if="controlledLanguage.length > 1 && index !== 0"
          class="button-default btn"
          @click="() => removeLanguageAt(index)"
        >
          {{ $t('settings.remove_language') }}
        </button>
      </li>
      <li>
        <button
          class="button-default btn"
          @click="addLanguage"
        >
          {{ $t('settings.add_language') }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script src="./interface_language_switcher.js"></script>

<style lang="scss">
.interface-language-switcher {
  .language-select {
    margin-right: 1em;
  }
}
</style>
