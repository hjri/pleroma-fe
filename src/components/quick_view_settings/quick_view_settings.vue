<template>
  <Popover
    trigger="click"
    class="QuickViewSettings"
    :bound-to="{ x: 'container' }"
  >
    <template #content>
      <div
        class="dropdown-menu"
        role="menu"
      >
        <div
          v-if="mobileLayout"
          class="menu-item dropdown-item -icon"
        >
          <QuickFilterSettings :nested="true" />
        </div>
        <div
          v-if="mobileLayout"
          role="separator"
          class="dropdown-divider"
        />
        <div role="group">
          <div class="menu-item dropdown-item -icon-double">
            <button
              class="main-button"
              :aria-checked="conversationDisplay === 'tree'"
              role="menuitemradio"
              @click="conversationDisplay = 'tree'"
            >
              <span
                class="input menu-checkbox -radio"
                :aria-hidden="true"
                :class="{ 'menu-checkbox-checked': conversationDisplay === 'tree' }"
              /><FAIcon
                icon="folder-tree"
                :aria-hidden="true"
                fixed-width
              /> {{ $t('settings.conversation_display_tree_quick') }}
            </button>
          </div>
          <div class="menu-item dropdown-item -icon-double">
            <button
              class="main-button"
              :aria-checked="conversationDisplay === 'linear'"
              role="menuitemradio"
              @click="conversationDisplay = 'linear'"
            >
              <span
                class="input menu-checkbox -radio"
                :class="{ 'menu-checkbox-checked': conversationDisplay === 'linear' }"
                :aria-hidden="true"
              /><FAIcon
                icon="list"
                :aria-hidden="true"
                fixed-width
              /> {{ $t('settings.conversation_display_linear_quick') }}
            </button>
          </div>
        </div>
        <div
          role="separator"
          class="dropdown-divider"
        />
        <div class="menu-item dropdown-item -icon">
          <button
            class="main-button"
            role="menuitemcheckbox"
            :aria-checked="showUserAvatars"
            @click="showUserAvatars = !showUserAvatars"
          >
            <span
              class="input menu-checkbox"
              :class="{ 'menu-checkbox-checked': showUserAvatars }"
              :aria-hidden="true"
            />{{ $t('settings.mention_link_show_avatar_quick') }}
          </button>
        </div>
        <div
          v-if="!conversation"
          class="menu-item dropdown-item -icon"
        >
          <button
            class="main-button"
            role="menuitemcheckbox"
            :aria-checked="autoUpdate"
            @click="autoUpdate = !autoUpdate"
          >
            <span
              class="input menu-checkbox"
              :class="{ 'menu-checkbox-checked': autoUpdate }"
              :aria-hidden="true"
            />{{ $t('settings.auto_update') }}
          </button>
        </div>
        <div
          v-if="!conversation"
          class="menu-item dropdown-item -icon"
        >
          <button
            class="main-button"
            role="menuitemcheckbox"
            :aria-checked="collapseWithSubjects"
            @click="collapseWithSubjects = !collapseWithSubjects"
          >
            <span
              class="input menu-checkbox"
              :class="{ 'menu-checkbox-checked': collapseWithSubjects }"
              :aria-hidden="true"
            />{{ $t('settings.collapse_subject') }}
          </button>
        </div>
        <div class="menu-item dropdown-item -icon">
          <button
            class="main-button"
            role="menuitem"
            @click="openTab('general')"
          >
            <FAIcon
              icon="wrench"
              fixed-width
            />{{ $t('settings.more_settings') }}
          </button>
        </div>
      </div>
    </template>
    <template #trigger>
      <FAIcon icon="bars" />
    </template>
  </Popover>
</template>

<script src="./quick_view_settings.js"></script>
