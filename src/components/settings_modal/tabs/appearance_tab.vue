<template>
  <div
    class="appearance-tab"
    :label="$t('settings.interface')"
    icon="table-columns"
  >
    <div
      class="setting-section"
      :label="$t('settings.theme')"
      icon="paintbrush"
    >
      <h3>{{ $t('settings.style.style_section') }}</h3>
      <ul
        ref="themeList"
        class="theme-list"
      >
        <button
          class="button-default theme-preview"
          data-theme-key="stock"
          :class="{ toggled: isStyleActive('stock'), disabled: switchInProgress }"
          :disabled="switchInProgress"
          @click="resetTheming"
        >
          <preview id="theme-preview-stock" />
          <span class="theme-name">
            {{ $t('settings.style.stock_theme_used') }}
            <span class="alert neutral version">v3</span>
          </span>
        </button>
        <button
          v-if="isCustomThemeUsed"
          disabled
          class="button-default theme-preview toggled"
        >
          <preview />
          <span class="theme-name">
            {{ $t('settings.style.custom_theme_used') }}
            <span class="alert neutral version">v2</span>
          </span>
        </button>
        <button
          v-if="isCustomStyleUsed"
          disabled
          class="button-default theme-preview toggled"
        >
          <preview />
          <span class="theme-name">
            {{ $t('settings.style.custom_style_used') }}
            <span class="alert neutral version">v3</span>
          </span>
        </button>
        <button
          v-for="style in availableStyles"
          :key="style.key"
          :data-theme-key="style.key"
          class="button-default theme-preview"
          :class="{ toggled: isThemeActive(style.key), disabled: switchInProgress }"
          :disabled="switchInProgress"
          @click="style.version === 'v2' ? setTheme(style.key) : setStyle(style.key)"
        >
          <preview :id="'theme-preview-' + style.key" />
          <span class="theme-name">
            {{ style.name }}
            <span class="alert neutral version">{{ style.version }}</span>
          </span>
        </button>
      </ul>
      <div class="import-file-container">
        <button
          class="btn button-default"
          :class="{ disabled: switchInProgress }"
          :disabled="switchInProgress"
          @click="importFile"
        >
          <FAIcon icon="folder-open" />
          {{ $t('settings.style.themes3.editor.load_style') }}
        </button>
        <h4>{{ $t('settings.style.themes3.palette.label') }}</h4>
        <div
          v-if="customThemeVersion === 'v3'"
          class="palettes-container"
        >
          <h5 v-if="stylePalettes?.length > 0">
            {{ $t('settings.style.themes3.palette.style') }}
          </h5>
          <div class="palettes">
            <button
              v-for="p in stylePalettes || []"
              :key="p.name"
              class="btn button-default palette-entry"
              :class="{ toggled: isPaletteActive(p.key), disabled: switchInProgress }"
              :disabled="switchInProgress"
              @click="() => setPalette(p.key, p)"
            >
              <div class="palette-label">
                <label>
                  {{ p.name ?? $t('settings.style.themes3.palette.user') }}
                </label>
              </div>
              <div class="palette-preview">
                <span
                  v-for="c in palettesKeys"
                  :key="c"
                  class="palette-square"
                  :style="{ backgroundColor: p[c], border: '1px solid ' + (p[c] ?? 'var(--text)') }"
                />
              </div>
            </button>
            <h5>{{ $t('settings.style.themes3.palette.bundled') }}</h5>
            <button
              v-for="p in bundledPalettes"
              :key="p.name"
              class="btn button-default palette-entry"
              :class="{ toggled: isPaletteActive(p.key), disabled: switchInProgress }"
              :disabled="switchInProgress"
              @click="() => setPalette(p.key, p)"
            >
              <div class="palette-label">
                <label>
                  {{ p.name }}
                </label>
              </div>
              <div class="palette-preview">
                <span
                  v-for="c in palettesKeys"
                  :key="c"
                  class="palette-square"
                  :style="{ backgroundColor: p[c], border: '1px solid ' + (p[c] ?? 'var(--text)') }"
                />
              </div>
            </button>
          </div>
        </div>
        <div>
          <template v-if="customThemeVersion === 'v3'">
            <h5 v-if="expertLevel > 0">
              {{ $t('settings.style.themes3.palette.user') }}
            </h5>
            <PaletteEditor
              v-if="expertLevel > 0"
              v-model="userPalette"
              class="userPalette"
              :compact="true"
              :apply="true"
              :disabled="switchInProgress"
              @apply-palette="data => setPaletteCustom(data)"
            />
          </template>
          <template v-else-if="customThemeVersion === 'v2'">
            <div class="alert neutral theme-notice unsupported-theme-v2">
              {{ $t('settings.style.themes3.palette.v2_unsupported') }}
            </div>
          </template>
        </div>
      </div>
      <h3>{{ $t('settings.background') }}</h3>
      <div class="banner-background">
        <div class="banner-background-preview">
          <div class="fun-monitor">
            <div class="fun-monitor-stand button-default" />
            <div class="fun-monitor-neck button-default" />
            <div class="fun-monitor-display-bezel button-default">
              <div class="fun-monitor-display-screen input">
                <img
                  v-if="backgroundPreview || user.background_image || instanceWallpaper"
                  class="fun-monitor-display-screen-image"
                  :src="backgroundPreview || user.background_image || instanceWallpaper"
                >
                <div
                  v-else
                  class="wallpaper"
                />
                <div class="fun-monitor-display-screen-overlay input" />
                <div
                  v-if="backgroundUploading"
                  class="fun-monitor-display-uploading"
                >
                  <FAIcon
                    class="fun-monitor-display-screen-uploading"
                    spin
                    icon="circle-notch"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="banner-background-input">
          <h4>{{ $t('settings.set_new_background') }}</h4>
          <input
            type="file"
            class="input"
            @change="uploadFile('background', $event)"
          >
          <div class="custom-bg-control">
            <button
              :disabled="!backgroundPreview"
              class="btn button-default"
              @click="submitBackground(background)"
            >
              {{ $t('settings.save') }}
            </button>
            <button
              :disabled="!backgroundPreview"
              class="btn button-default"
              @click="resetUploadedBackground"
            >
              {{ $t('settings.reset') }}
            </button>
          </div>
          <button
            v-if="!isDefaultBackground"
            class="btn button-default reset-button"
            :title="$t('settings.reset_profile_background')"
            @click="resetBackground"
          >
            {{ $t('settings.reset_profile_background') }}
          </button>
        </div>
      </div>
      <h3>{{ $t('settings.visual_tweaks') }}</h3>
      <div class="alert neutral theme-notice">
        {{ $t("settings.style.visual_tweaks_section_note") }}
      </div>
      <ul class="setting-list">
        <li>
          <ChoiceSetting
            id="forcedRoundness"
            path="forcedRoundness"
            :options="forcedRoundnessOptions"
          >
            {{ $t('settings.style.themes3.hacks.force_interface_roundness') }}
          </ChoiceSetting>
        </li>
        <li>
          <ChoiceSetting
            id="underlayOverride"
            path="theme3hacks.underlay"
            :options="underlayOverrideModes"
          >
            {{ $t('settings.style.themes3.hacks.underlay_overrides') }}
          </ChoiceSetting>
        </li>
        <li v-if="instanceWallpaperUsed">
          <BooleanSetting path="hideInstanceWallpaper">
            {{ $t('settings.hide_wallpaper') }}
          </BooleanSetting>
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./appearance_tab.js"></script>

<style lang="scss" src="./appearance_tab.scss"></style>
