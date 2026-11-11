<template>
  <div :label="$t('settings.layout')">
    <div class="setting-section">
      <h3>{{ $t('settings.general') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting path="modalMobileCenter" />
        </li>
        <li>
          <BooleanSetting path="alwaysShowNewPostButton" />
        </li>
        <li>
          <BooleanSetting path="autohideFloatingPostButton" />
        </li>
        <li>
          <BooleanSetting path="userPopoverOverlay" />
        </li>
        <li>
          <ChoiceSetting path="userPopoverAvatarAction" />
        </li>
        <li>
          <BooleanSetting path="userCardLeftJustify" />
        </li>
        <li>
          <UnitSetting path="themeEditorMinWidth" />
        </li>
        <li>
          <UnitSetting path="navbarSize" />
        </li>
      </ul>
      <h3>{{ $t('settings.columns') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting path="disableStickyHeaders" />
        </li>
        <li>
          <BooleanSetting path="showScrollbars" />
        </li>
        <li>
          <UnitSetting path="panelHeaderSize" />
        </li>
        <li>
          <BooleanSetting path="sidebarRight" />
        </li>
        <li>
          <BooleanSetting path="navbarColumnStretch" />
        </li>
        <li v-if="user">
          <ChoiceSetting
            path="thirdColumnMode"
            @change="updateLayout"
           />
        </li>
        <li v-if="expertLevel > 0">
          <h4> {{ $t('settings.column_sizes') }} </h4>
          <div class="column-settings">
            <UnitSetting
              v-for="column in columns"
              :key="column"
              :path="column + 'ColumnWidth'"
             />
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./layout_tab.js"></script>
