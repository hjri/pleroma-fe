<template>
  <div
    class="LinksTab"
    :label="$t('admin_dash.tabs.media_proxy')"
  >
    <div class="setting-item">
      <h3>{{ $t('admin_dash.links.link_previews') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting path=":pleroma.:rich_media.:enabled" />
        </li>
        <li>
          <ListSetting
            :override-available-options="parsersOptions"
            path=":pleroma.:rich_media.:parsers"
          />
        </li>
        <li>
          <IntegerSetting
            path=":pleroma.:rich_media.:timeout"
          />
        </li>
        <li>
          <ListSetting
            :override-available-options="ttlSettersOptions"
            path=":pleroma.:rich_media.:ttl_setters"
          />
        </li>
        <li>
          <ListSetting
            path=":pleroma.:rich_media.:ignore_tld"
            ignore-suggestions
          />
        </li>
        <li>
          <ListSetting path=":pleroma.:rich_media.:ignore_hosts" />
        </li>
      </ul>
      <h3>{{ $t('admin_dash.links.link_formatter') }}</h3>
      <ul class="setting-list weird-options">
        <li>
          <Checkbox
            :model-value="classIsPresent"
            @update:model-value="checkClass"
          >
            <i18n-t
              keypath="admin_dash.temp_overrides.:pleroma.Pleroma_DOT_Formatter.:attribute_toggle.label"
              tag="span"
              scope="global"
            >
              <template #attr>
                <code>class</code>
              </template>
            </i18n-t>
          </Checkbox>
          <div class="setting-list suboptions weird-suboptions">
            <StringSetting
              v-if="classIsPresent"
              :path="[':pleroma', 'Pleroma.Formatter', ':class']"
              hide-label
              hide-draft-buttons
            />
            <GroupSetting :path="[':pleroma', 'Pleroma.Formatter', ':class']" />
          </div>
        </li>
        <li>
          <Checkbox
            :model-value="relIsPresent"
            @update:model-value="checkRel"
          >
          <i18n-t
            keypath="admin_dash.temp_overrides.:pleroma.Pleroma_DOT_Formatter.:attribute_toggle.label"
            tag="span"
            scope="global"
          >
            <template #attr>
              <code>rel</code>
            </template>
          </i18n-t>
          </Checkbox>
          <div class="setting-list suboptions weird-suboptions">
            <StringSetting
              v-if="relIsPresent"
              :path="[':pleroma', 'Pleroma.Formatter', ':rel']"
              hide-label
              hide-draft-buttons
            />
            <GroupSetting
              :path="[':pleroma', 'Pleroma.Formatter', ':rel']"
            />
          </div>
        </li>
        <li>
          <BooleanSetting :path="[':pleroma', 'Pleroma.Formatter', ':new_window']" />
        </li>
        <li>
          <BooleanSetting :path="[':pleroma', 'Pleroma.Formatter', ':strip_prefix']" />
        </li>
        <li>
          <BooleanSetting :path="[':pleroma', 'Pleroma.Formatter', ':extra']" />
        </li>
        <li>
          <ChoiceSetting
            :path="[':pleroma', 'Pleroma.Formatter', ':validate_tld']"
            :options="validateTLDOptions"
            override-options
          />
        </li>
        <li>
          <Checkbox
            :model-value="truncateIsPresent"
            @update:model-value="checkTruncate"
          >
            {{ truncateDescription.label }}
          </Checkbox>
          <div class="setting-list suboptions weird-suboptions">
            <li>
              <IntegerSetting
                v-if="truncateIsPresent"
                :path="[':pleroma', 'Pleroma.Formatter', ':truncate']"
                hide-label
                hide-draft-buttons
              />
            </li>
            <li>
              <GroupSetting :path="[':pleroma', 'Pleroma.Formatter', ':truncate']" />
            </li>
          </div>
        </li>
        <li>
          <!-- CONFIRM backend what's difference between here and :extra -->
          <ListSetting
            ignore-suggestions
            path=":pleroma.:uri_schemes.:valid_schemes"
          />
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" src="./links_tab.scss"></style>

<script src="./links_tab.js"></script>
