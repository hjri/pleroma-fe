<template>
  <div>
    <Popover
      trigger="click"
      class="moderation-tools-popover"
      :disabled="disabled"
      placement="bottom"
      :offset="{ y: 5 }"
      @show="setOpen(true)"
      @close="setOpen(false)"
    >
      <template #content>
        <div class="dropdown-menu">
          <template v-for="(entry, index) in entries">
            <div
              v-if="entry === 'separator'"
              :key="index"
              role="separator"
              class="dropdown-divider"
            />
            <div
              v-else
              :key="entry.label"
              class="menu-item dropdown-item"
              :class="entry.checkbox ? '-icon' : '-icon-space'"
            >
              <button
                class="main-button"
                @click="() => maybeShowConfirm(entry)"
              >
                <span
                  v-if="entry.checkbox"
                  class="input menu-checkbox"
                  :class="entry.checkboxClass"
                />
                {{ $t(entry.label) }}
              </button>
            </div>
          </template>
        </div>
      </template>
      <template #trigger>
        <button
          class="btn button-default btn-block moderation-tools-button"
          :class="{ toggled: open, disabled }"
          :disabled="disabled"
        >
          {{ $t('user_card.admin_menu.moderation') }}
          <FAIcon
            v-if="ready"
            icon="chevron-down"
          />
          <span
            v-else
            class="loading-spinner"
          >
            <FAIcon
              class="fa-old-padding"
              spin
              icon="circle-notch"
            />
          </span>
        </button>
      </template>
    </Popover>
    <teleport to="#modal">
      <ConfirmModal
        v-if="confirmDialogShow"
        :title="$t(confirmDialogTitle)"
        :confirm-text="confirmDialogConfirm"
        :confirm-danger="confirmDialogDanger"
        :cancel-text="$t('general.cancel')"
        @accepted="doConfirmDialogAction"
        @cancelled="clearConfirmDialog"
      >
        <i18n-t
          :plural="users.length"
          scope="global"
          :keypath="confirmDialogContent"
          tag="p"
        >
          <template #user>
            <span
              v-text="users[0].screen_name_ui"
            />
          </template>
          <template #count>
            {{ users.length }}
          </template>
          <template #name>
            <code>
              {{ confirmDialogName }}
            </code>
          </template>
        </i18n-t>
        <p v-if="confirmDialogContent2">
          {{ $t(confirmDialogContent2) }}
        </p>
        <ul v-if="users.length > 1">
          <li
            v-for="user in users"
            :key="user.screen_name"
          >
            {{ user.screen_name }}
          </li>
        </ul>
      </ConfirmModal>
    </teleport>
  </div>
</template>

<script src="./moderation_tools.js"></script>

<style lang="scss">
.moderation-tools-popover {
  height: 100%;

  .trigger {
    /* stylelint-disable-next-line declaration-no-important */
    display: flex !important;
    height: 100%;
  }
}

.moderation-tools-button {
  white-space: nowrap;

  svg,
  i {
    font-size: 0.8em;
  }
}
</style>
