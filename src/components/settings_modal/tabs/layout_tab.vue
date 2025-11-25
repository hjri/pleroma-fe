<template>
  <div :label="$t('settings.layout')">
    <div class="setting-item">
      <h3>{{ $t('settings.general') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting path="modalMobileCenter">
            {{ $t('settings.mobile_center_dialog') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting
            path="alwaysShowNewPostButton"
            expert="1"
          >
            {{ $t('settings.always_show_post_button') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting
            path="autohideFloatingPostButton"
            expert="1"
          >
            {{ $t('settings.autohide_floating_post_button') }}
          </BooleanSetting>
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
          <UnitSetting
            path="themeEditorMinWidth"
            :units="['px', 'rem']"
            expert="1"
          >
            {{ $t('settings.theme_editor_min_width') }}
          </UnitSetting>
        </li>
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
      </ul>
      <h3>{{ $t('settings.columns') }}</h3>
      <ul class="setting-list">
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
          <h4> {{ $t('settings.column_sizes') }} </h4>
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
      </ul>
    </div>
  </div>
</template>

<script src="./layout_tab.js"></script>
