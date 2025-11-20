<template>
  <vertical-tab-switcher
    class="appearance-tab"
    :label="$t('settings.appearance')"
    ref="tabSwitcher"
    :side-tab-bar="true"
    :scrollable-tabs="true"
    @too-small="() => console.log('small') || $emit('tooSmall')"
    @too-big="() => $emit('tooBig')"
  >
    <div
      :label="$t('settings.interface')"
      icon="table-columns"
    >
      <div class="alert neutral theme-notice">
        {{ $t("settings.style.appearance_tab_note") }}
      </div>
      <ul class="setting-list">
        <h3>{{ $t('settings.general') }}</h3>
        <li>
          <UnitSetting
            path="textSize"
            :step="0.1"
            :units="['px', 'rem']"
            :reset-default="{ 'px': 14, 'rem': 1 }"
            timed-apply-mode
          >
            {{ $t('settings.text_size') }}
          </UnitSetting>
          <div>
            <small>
              <i18n-t
                scope="global"
                keypath="settings.text_size_tip"
                tag="span"
              >
                <code>px</code>
                <code>rem</code>
              </i18n-t>
              <br>
              <i18n-t
                scope="global"
                keypath="settings.text_size_tip2"
                tag="span"
              >
                <code>14px</code>
              </i18n-t>
            </small>
          </div>
        </li>
        <li>
          <FontControl
            :model-value="mergedConfig.theme3hacks.fonts.interface"
            name="ui"
            :label="$t('settings.style.fonts.components.interface')"
            :fallback="{ family: 'sans-serif' }"
            no-inherit="1"
            @update:model-value="v => updateFont('interface', v)"
          />
        </li>
        <li>
          <FontControl
            :model-value="mergedConfig.theme3hacks.fonts.input"
            name="input"
            :fallback="{ family: 'inherit' }"
            :label="$t('settings.style.fonts.components.input')"
            @update:model-value="v => updateFont('input', v)"
          />
        </li>
        <li>
          <UnitSetting
            path="emojiSize"
            :step="0.1"
            :units="['px', 'rem']"
            :reset-default="{ 'px': 32, 'rem': 2.2 }"
          >
            {{ $t('settings.emoji_size') }}
          </UnitSetting>
          <ul
            class="setting-list suboptions"
          >
            <li>
              <FloatSetting
                v-if="user"
                path="emojiReactionsScale"
                expert="1"
              >
                {{ $t('settings.emoji_reactions_scale') }}
              </FloatSetting>
            </li>
          </ul>
        </li>
        <li>
          <BooleanSetting
            path="userPopoverOverlay"
            expert="1"
          >
            {{ $t('settings.user_popover_avatar_overlay') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting
            path="userCardLeftJustify"
            expert="1"
          >
            {{ $t('settings.user_card_left_justify') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting
            path="userCardHidePersonalMarks"
            expert="1"
          >
            {{ $t('settings.user_card_hide_personal_marks') }}
          </BooleanSetting>
        </li>
        <li v-if="instanceShoutboxPresent">
          <BooleanSetting
            path="hideShoutbox"
            expert="1"
          >
            {{ $t('settings.hide_shoutbox') }}
          </BooleanSetting>
        </li>
        <h3>{{ $t('settings.columns') }}</h3>
        <li>
          <UnitSetting
            path="navbarSize"
            :step="0.1"
            :units="['px', 'rem']"
            :reset-default="{ 'px': 55, 'rem': 3.5 }"
          >
            {{ $t('settings.navbar_size') }}
          </UnitSetting>
        </li>
        <li v-if="instanceSpecificPanelPresent">
          <BooleanSetting path="hideISP">
            {{ $t('settings.hide_isp') }}
          </BooleanSetting>
        </li>
        <li>
          <UnitSetting
            path="panelHeaderSize"
            :step="0.1"
            :units="['px', 'rem']"
            :reset-default="{ 'px': 52, 'rem': 3.2 }"
            timed-apply-mode
          >
            {{ $t('settings.panel_header_size') }}
          </UnitSetting>
        </li>
        <li>
          <BooleanSetting path="sidebarRight">
            {{ $t('settings.right_sidebar') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting path="navbarColumnStretch">
            {{ $t('settings.navbar_column_stretch') }}
          </BooleanSetting>
        </li>
        <li>
          <ChoiceSetting
            v-if="user"
            id="thirdColumnMode"
            path="thirdColumnMode"
            :options="thirdColumnModeOptions"
          >
            {{ $t('settings.third_column_mode') }}
          </ChoiceSetting>
        </li>
        <li v-if="expertLevel > 0">
          {{ $t('settings.column_sizes') }}
          <div class="column-settings">
            <UnitSetting
              v-for="column in columns"
              :key="column"
              :path="column + 'ColumnWidth'"
              :units="horizontalUnits"
              expert="1"
            >
              {{ $t('settings.column_sizes_' + column) }}
            </UnitSetting>
          </div>
        </li>
        <li>
          <BooleanSetting path="disableStickyHeaders">
            {{ $t('settings.disable_sticky_headers') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting path="showScrollbars">
            {{ $t('settings.show_scrollbars') }}
          </BooleanSetting>
        </li>
        <li>
          <UnitSetting
            path="themeEditorMinWidth"
            :units="['px', 'rem']"
            expert="1"
          >
            {{ $t('settings.theme_editor_min_width') }}
          </UnitSetting>
        </li>
      </ul>
      <ul class="setting-list">
        <h3>{{ $t('settings.visual_tweaks') }}</h3>
        <li>
          <BooleanSetting path="modalMobileCenter">
            {{ $t('settings.mobile_center_dialog') }}
          </BooleanSetting>
        </li>
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
    <div
      class="setting-item"
      :label="$t('settings.theme')"
      icon="paintbrush"
    >
      <div>
        <h3>{{ $t('settings.background') }}</h3>
        <div class="banner-background-preview">
          <img :src="user.background_image">
          <button
            v-if="!isDefaultBackground"
            class="button-unstyled reset-button"
            :title="$t('settings.reset_profile_background')"
            @click="resetBackground"
          >
            <FAIcon
              icon="times"
              type="button"
            />
          </button>
        </div>
        <p>{{ $t('settings.set_new_background') }}</p>
        <img
          v-if="backgroundPreview"
          class="banner-background-preview"
          :src="backgroundPreview"
        >
        <div>
          <input
            type="file"
            class="input"
            @change="uploadFile('background', $event)"
          >
        </div>
        <FAIcon
          v-if="backgroundUploading"
          class="uploading"
          spin
          icon="circle-notch"
        />
        <button
          v-else-if="backgroundPreview"
          class="btn button-default"
          @click="submitBackground(background)"
        >
          {{ $t('settings.save') }}
        </button>
      </div>
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
          <h4 class="theme-name">
            {{ $t('settings.style.stock_theme_used') }}
            <span class="alert neutral version">v3</span>
          </h4>
        </button>
        <button
          v-if="isCustomThemeUsed"
          disabled
          class="button-default theme-preview toggled"
        >
          <preview />
          <h4 class="theme-name">
            {{ $t('settings.style.custom_theme_used') }}
            <span class="alert neutral version">v2</span>
          </h4>
        </button>
        <button
          v-if="isCustomStyleUsed"
          disabled
          class="button-default theme-preview toggled"
        >
          <preview />
          <h4 class="theme-name">
            {{ $t('settings.style.custom_style_used') }}
            <span class="alert neutral version">v3</span>
          </h4>
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
          <h4 class="theme-name">
            {{ style.name }}
            <span class="alert neutral version">{{ style.version }}</span>
          </h4>
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
      </div>
      <div class="setting-item">
        <h2>{{ $t('settings.style.themes3.palette.label') }}</h2>
        <div
          v-if="customThemeVersion === 'v3'"
          class="palettes-container"
        >
          <h4 v-if="stylePalettes?.length > 0">
            {{ $t('settings.style.themes3.palette.style') }}
          </h4>
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
            <h4>{{ $t('settings.style.themes3.palette.bundled') }}</h4>
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
            <h4 v-if="expertLevel > 0">
              {{ $t('settings.style.themes3.palette.user') }}
            </h4>
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
        <ul class="setting-list">
          <li>
            <BooleanSetting
              path="themeDebug"
              :expert="1"
            >
              {{ $t('settings.theme_debug') }}
            </BooleanSetting>
          </li>
          <li>
            <BooleanSetting
              path="forceThemeRecompilation"
              :expert="1"
            >
              {{ $t('settings.force_theme_recompilation_debug') }}
            </BooleanSetting>
          </li>
        </ul>
      </div>
    </div>
  </vertical-tab-switcher>
</template>

<script src="./appearance_tab.js"></script>

<style lang="scss" src="./appearance_tab.scss"></style>
