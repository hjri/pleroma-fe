<template>
  <div class="filtering-tab">
    <div class="setting-section">
      <h3>{{ $t('settings.filter.mute_filter') }}</h3>
      <ul class="setting-list">
        <li>
          <ChoiceSetting
            v-if="user"
            id="replyVisibility"
            path="replyVisibility"
            :options="replyVisibilityOptions"
          >
            {{ $t('settings.replies_in_timeline') }}
          </ChoiceSetting>
        </li>
        <li>
          <span class="setting-item">
            <span class="setting-label">
              {{ $t('user_card.default_mute_expiration') }}
            </span>
            <Select
              id="onMuteDefaultActionLv1"
              v-model="onMuteDefaultActionLv1"
            >
              <option
                v-for="option in muteBlockLv1Options"
                :key="option.key"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </Select>
          </span>
          <ul
            v-if="onMuteDefaultActionLv1 === 'temporarily'"
            class="setting-list suboptions"
          >
            <li>
              <UnitSetting
                path="onMuteDefaultAction"
                unit-set="time"
                :units="['s', 'm', 'h', 'd']"
                :min="0"
              >
                {{ $t('user_card.default_expiration_time') }}
              </UnitSetting>
            </li>
          </ul>
        </li>
        <li v-if="blockExpirationSupported">
          <span class="setting-item">
            <span class="setting-label">
              {{ $t('user_card.default_block_expiration') }}
            </span>
            <Select
              id="onBlockDefaultActionLv1"
              class="setting-control"
              v-model="onBlockDefaultActionLv1"
            >
              <option
                v-for="option in muteBlockLv1Options"
                :key="option.key"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </Select>
          </span>
          <ul
            v-if="onBlockDefaultActionLv1 === 'temporarily'"
            class="setting-list suboptions"
          >
            <li>
              <UnitSetting
                path="onBlockDefaultAction"
                unit-set="time"
                :units="['s', 'm', 'h', 'd']"
                :min="0"
              >
                {{ $t('user_card.default_expiration_time') }}
              </UnitSetting>
            </li>
          </ul>
        </li>
        <li>
          <BooleanSetting path="hideFilteredStatuses">
            {{ $t('settings.hide_muted_statuses') }}
          </BooleanSetting>
          <ul class="setting-list suboptions">
            <li>
              <BooleanSetting
                parent-path="hideFilteredStatuses"
                :parent-invert="true"
                path="hideWordFilteredPosts"
                expert="1"
              >
                {{ $t('settings.hide_filtered_statuses') }}
              </BooleanSetting>
            </li>
            <li>
              <BooleanSetting
                v-if="user"
                parent-path="hideFilteredStatuses"
                :parent-invert="true"
                path="hideMutedThreads"
              >
                {{ $t('settings.hide_muted_threads') }}
              </BooleanSetting>
            </li>
            <li>
              <BooleanSetting
                v-if="user"
                parent-path="hideFilteredStatuses"
                :parent-invert="true"
                path="hideMutedPosts"
              >
                {{ $t('settings.hide_muted_posts') }}
              </BooleanSetting>
            </li>
          </ul>
        </li>
        <li>
          <BooleanSetting path="muteBotStatuses">
            {{ $t('settings.mute_bot_posts') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting path="muteSensitiveStatuses">
            {{ $t('settings.mute_sensitive_posts') }}
          </BooleanSetting>
        </li>
        <li>
          <h3>{{ $t('settings.filter.custom_filters') }}</h3>
          <p class="muteFiltersActions">
            <span class="total">
              {{ $t('settings.filter.total_count', { count: muteFiltersDraft.length }) }}
            </span>
            <button
              class="add-button button-default"
              type="button"
              @click="createFilter()"
            >
              {{ $t('settings.filter.new') }}
            </button>
            <button
              class="add-button button-default"
              type="button"
              @click="importFilter()"
            >
              {{ $t('settings.filter.import') }}
            </button>
          </p>
          <div class="muteFilterContainer">
            <div
              v-for="filter in muteFiltersDraft"
              :key="filter[0]"
              class="mute-filter"
              :style="{ order: filter[1].order }"
            >
              <div class="filter-name">
                <label
                  :for="'filterName' + filter[0]"
                >
                  {{ $t('settings.filter.name') }}
                </label>
                {{ ' ' }}
                <input
                  :id="'filterName' + filter[0]"
                  class="input"
                  :value="filter[1].name"
                  @input="updateFilter(filter[0], 'name', $event.target.value)"
                >
                <span
                  v-if="filter[1].expires !== null && Date.now() > filter[1].expires"
                  class="alert neutral"
                >
                  {{ $t('settings.filter.expired') }}
                </span>
              </div>
              <div class="filter-enabled">
                <Checkbox
                  :id="'filterHide' + filter[0]"
                  :model-value="filter[1].hide"
                  :name="'filterHide' + filter[0]"
                  @update:model-value="updateFilter(filter[0], 'hide', $event)"
                >
                  {{ $t('settings.filter.hide') }}
                </Checkbox>
                {{ ' ' }}
                <Checkbox
                  :id="'filterEnabled' + filter[0]"
                  :model-value="filter[1].enabled"
                  :name="'filterEnabled' + filter[0]"
                  @update:model-value="updateFilter(filter[0], 'enabled', $event)"
                >
                  {{ $t('settings.enabled') }}
                </Checkbox>
              </div>
              <div class="filter-type filter-field">
                <label :for="'filterType' + filter[0]">
                  <HelpIndicator>
                    <p>
                      {{ $t('settings.filter.help.word') }}
                    </p>
                    <p>
                      {{ $t('settings.filter.help.user') }}
                    </p>
                    <i18n-t
                      keypath="settings.filter.help.regexp"
                      tag="p"
                    >
                      <template #link>
                        <a
                          :href="$t('settings.filter.help.regexp_url')"
                          target="_blank"
                        >
                          {{ $t('settings.filter.help.regexp_link') }}
                        </a>
                      </template>
                    </i18n-t>
                  </HelpIndicator>
                  {{ $t('settings.filter.type') }}
                </label>
                <Select
                  :id="'filterType' + filter[0]"
                  class="filter-field-value"
                  :model-value="filter[1].type"
                  @update:model-value="updateFilter(filter[0], 'type', $event)"
                >
                  <option value="word">
                    {{ $t('settings.filter.plain') }}
                  </option>
                  <option value="regexp">
                    {{ $t('settings.filter.regexp') }}
                  </option>
                  <option value="user">
                    {{ $t('settings.filter.user') }}
                  </option>
                  <option value="user_regexp">
                    {{ $t('settings.filter.user_regexp') }}
                  </option>
                </Select>
              </div>
              <div class="filter-value filter-field">
                <label
                  :for="'filterValue' + filter[0]"
                >
                  {{ $t('settings.filter.value') }}
                </label>
                {{ ' ' }}
                <input
                  :id="'filterValue' + filter[0]"
                  class="input filter-field-value"
                  :value="filter[1].value"
                  @input="updateFilter(filter[0], 'value', $event.target.value)"
                >
              </div>
              <div class="filter-expires filter-field">
                <label
                  :for="'filterExpires' + filter[0]"
                >
                  {{ $t('settings.filter.expires') }}
                </label>
                {{ ' ' }}
                <div class="filter-field-value">
                  <input
                    :id="'filterExpires' + filter[0]"
                    class="input"
                    :class="{ disabled: filter[1].expires === null }"
                    type="datetime-local"
                    :disabled="filter[1].expires === null"
                    :value="filter[1].expires ? getDatetimeLocal(filter[1].expires) : null"
                    @input="updateFilter(filter[0], 'expires', $event.target.value)"
                  >
                  {{ ' ' }}
                  <Checkbox
                    :id="'filterExpiresNever' + filter[0]"
                    :model-value="filter[1].expires === null"
                    :name="'filterExpiresNever' + filter[0]"
                    class="input-inset input-boolean never"
                    @update:model-value="updateFilter(filter[0], 'expires-never', $event)"
                  >
                    {{ $t('settings.filter.never_expires') }}
                  </Checkbox>
                </div>
              </div>
              <div
                v-if="!checkRegexValid(filter[0])"
                class="alert error"
              >
                {{ $t('settings.filter.regexp_error') }}
              </div>
              <div class="filter-buttons">
                <button
                  class="delete-button button-default -danger"
                  type="button"
                  @click="deleteFilter(filter[0])"
                >
                  {{ $t('settings.filter.delete') }}
                </button>
                <button
                  class="export-button button-default"
                  type="button"
                  @click="exportFilter(filter[0])"
                >
                  {{ $t('settings.filter.export') }}
                </button>
                <button
                  class="copy-button button-default"
                  type="button"
                  @click="copyFilter(filter[0])"
                >
                  {{ $t('settings.filter.copy') }}
                </button>
                <button
                  class="save-button button-default"
                  :class="{ disabled: !muteFiltersDraftDirty[filter[0]] }"
                  :disabled="!muteFiltersDraftDirty[filter[0]]"
                  type="button"
                  @click="saveFilter(filter[0])"
                >
                  {{ $t('settings.filter.save') }}
                </button>
              </div>
            </div>
          </div>
          <p class="muteFiltersActionsBottom">
            <span class="total">
              {{ $t('settings.filter.expired_count', { count: muteFiltersExpired.length }) }}
            </span>
            <button
              class="add-button button-default"
              type="button"
              :class="{ disabled: muteFiltersExpired.length === 0 }"
              :disabled="muteFiltersExpired.length === 0"
              @click="purgeExpiredFilters()"
            >
              {{ $t('settings.filter.purge_expired') }}
            </button>
          </p>
        </li>
      </ul>
    </div>
  </div>
</template>
<script src="./filtering_tab.js"></script>
<style src="./filtering_tab.scss"></style>
