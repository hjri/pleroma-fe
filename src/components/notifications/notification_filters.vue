<template>
  <Popover
    trigger="click"
    class="NotificationFilters"
    placement="bottom"
    :bound-to="{ x: 'container' }"
  >
    <template #content>
      <div class="dropdown-menu">
        <div class="menu-item dropdown-item -icon">
          <button
            class="main-button"
            @click="toggleNotificationFilter('likes')"
          >
            <span
              class="input menu-checkbox"
              :class="{ 'menu-checkbox-checked': filters.likes }"
            />{{ $t('settings.notification_visibility_likes') }}
          </button>
        </div>
        <div class="menu-item dropdown-item -icon">
          <button
            class="main-button"
            @click="toggleNotificationFilter('repeats')"
          >
            <span
              class="input menu-checkbox"
              :class="{ 'menu-checkbox-checked': filters.repeats }"
            />{{ $t('settings.notification_visibility_repeats') }}
          </button>
        </div>
        <div class="menu-item dropdown-item -icon">
          <button
            class="main-button"
            @click="toggleNotificationFilter('follows')"
          >
            <span
              class="input menu-checkbox"
              :class="{ 'menu-checkbox-checked': filters.follows }"
            />{{ $t('settings.notification_visibility_follows') }}
          </button>
        </div>
        <div class="menu-item dropdown-item -icon">
          <button
            class="main-button"
            @click="toggleNotificationFilter('mentions')"
          >
            <span
              class="input menu-checkbox"
              :class="{ 'menu-checkbox-checked': filters.mentions }"
            />{{ $t('settings.notification_visibility_mentions') }}
          </button>
        </div>
        <div class="menu-item dropdown-item -icon">
          <button
            class="main-button"
            @click="toggleNotificationFilter('statuses')"
          >
            <span
              class="input menu-checkbox"
              :class="{ 'menu-checkbox-checked': filters.statuses }"
            />{{ $t('settings.notification_visibility_statuses') }}
          </button>
        </div>
        <div class="menu-item dropdown-item -icon">
          <button
            class="main-button"
            @click="toggleNotificationFilter('emojiReactions')"
          >
            <span
              class="input menu-checkbox"
              :class="{ 'menu-checkbox-checked': filters.emojiReactions }"
            />{{ $t('settings.notification_visibility_emoji_reactions') }}
          </button>
        </div>
        <div class="menu-item dropdown-item -icon">
          <button
            class="main-button"
            @click="toggleNotificationFilter('moves')"
          >
            <span
              class="input menu-checkbox"
              :class="{ 'menu-checkbox-checked': filters.moves }"
            />{{ $t('settings.notification_visibility_moves') }}
          </button>
        </div>
        <div class="menu-item dropdown-item -icon">
          <button
            class="main-button"
            @click="toggleNotificationFilter('polls')"
          >
            <span
              class="input menu-checkbox"
              :class="{ 'menu-checkbox-checked': filters.polls }"
            />{{ $t('settings.notification_visibility_polls') }}
          </button>
        </div>
      </div>
    </template>
    <template #trigger>
      <button class="filter-trigger-button button-unstyled">
        <FAIcon icon="filter" />
      </button>
    </template>
  </Popover>
</template>

<script>
import Popover from '../popover/popover.vue'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faFilter } from '@fortawesome/free-solid-svg-icons'

library.add(faFilter)

export default {
  components: { Popover },
  computed: {
    filters() {
      return this.$store.getters.mergedConfig.notificationVisibility
    },
  },
  methods: {
    toggleNotificationFilter(type) {
      this.$store.dispatch('setOption', {
        name: 'notificationVisibility',
        value: {
          ...this.filters,
          [type]: !this.filters[type],
        },
      })
    },
  },
}
</script>
