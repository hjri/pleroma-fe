<template>
  <div>
    <Popover
      trigger="click"
      class="moderation-tools-popover"
      placement="bottom"
      :offset="{ y: 5 }"
      @show="setToggled(true)"
      @close="setToggled(false)"
    >
      <template #content>
        <div class="dropdown-menu">
          <template v-if="canGrantRole">
            <div class="menu-item dropdown-item -icon-space">
              <button
                class="main-button"
                @click="toggleRight(&quot;admin&quot;)"
              >
                {{ $t(!!user.rights.admin ? 'user_card.admin_menu.revoke_admin' : 'user_card.admin_menu.grant_admin') }}
              </button>
            </div>
            <div class="menu-item dropdown-item -icon-space">
              <button
                class="main-button"
                @click="toggleRight(&quot;moderator&quot;)"
              >
                {{ $t(!!user.rights.moderator ? 'user_card.admin_menu.revoke_moderator' : 'user_card.admin_menu.grant_moderator') }}
              </button>
            </div>
            <div
              v-if="canChangeActivationState || canDeleteAccount"
              role="separator"
              class="dropdown-divider"
            />
          </template>
          <div
            v-if="canChangeActivationState"
            class="menu-item dropdown-item -icon-space"
          >
            <button
              class="main-button"
              @click="toggleActivationStatus()"
            >
              {{ $t(!!user.deactivated ? 'user_card.admin_menu.activate_account' : 'user_card.admin_menu.deactivate_account') }}
            </button>
          </div>
          <div
            v-if="canDeleteAccount"
            class="menu-item dropdown-item -icon-space"
          >
            <button
              class="main-button"
              @click="deleteUserDialog(true)"
            >
              {{ $t('user_card.admin_menu.delete_account') }}
            </button>
          </div>
          <template v-if="canUseTagPolicy">
            <div
              role="separator"
              class="dropdown-divider"
            />
            <div class="menu-item dropdown-item -icon">
              <button
                class="main-button"
                @click="toggleTag(tags.FORCE_NSFW)"
              >
                <span
                  class="input menu-checkbox"
                  :class="{ 'menu-checkbox-checked': hasTag(tags.FORCE_NSFW) }"
                />
                {{ $t('user_card.admin_menu.force_nsfw') }}
              </button>
            </div>
            <div class="menu-item dropdown-item -icon">
              <button
                class="main-button"
                @click="toggleTag(tags.STRIP_MEDIA)"
              >
                <span
                  class="input menu-checkbox"
                  :class="{ 'menu-checkbox-checked': hasTag(tags.STRIP_MEDIA) }"
                />
                {{ $t('user_card.admin_menu.strip_media') }}
              </button>
            </div>
            <div class="menu-item dropdown-item -icon">
              <button
                class="main-button"
                @click="toggleTag(tags.FORCE_UNLISTED)"
              >
                <span
                  class="input menu-checkbox"
                  :class="{ 'menu-checkbox-checked': hasTag(tags.FORCE_UNLISTED) }"
                />
                {{ $t('user_card.admin_menu.force_unlisted') }}
              </button>
            </div>
            <div class="menu-item dropdown-item -icon">
              <button
                class="main-button"
                @click="toggleTag(tags.SANDBOX)"
              >
                <span
                  class="input menu-checkbox"
                  :class="{ 'menu-checkbox-checked': hasTag(tags.SANDBOX) }"
                />
                {{ $t('user_card.admin_menu.sandbox') }}
              </button>
            </div>
            <div
              v-if="user.is_local"
              class="menu-item dropdown-item -icon"
            >
              <button
                class="main-button"
                @click="toggleTag(tags.DISABLE_REMOTE_SUBSCRIPTION)"
              >
                <span
                  class="input menu-checkbox"
                  :class="{ 'menu-checkbox-checked': hasTag(tags.DISABLE_REMOTE_SUBSCRIPTION) }"
                />
                {{ $t('user_card.admin_menu.disable_remote_subscription') }}
              </button>
            </div>
            <div
              v-if="user.is_local"
              class="menu-item dropdown-item -icon"
            >
              <button
                class="main-button"
                @click="toggleTag(tags.DISABLE_ANY_SUBSCRIPTION)"
              >
                <span
                  class="input menu-checkbox"
                  :class="{ 'menu-checkbox-checked': hasTag(tags.DISABLE_ANY_SUBSCRIPTION) }"
                />
                {{ $t('user_card.admin_menu.disable_any_subscription') }}
              </button>
            </div>
            <div
              v-if="user.is_local"
              class="menu-item dropdown-item -icon"
            >
              <button
                class="main-button"
                @click="toggleTag(tags.QUARANTINE)"
              >
                <span
                  class="input menu-checkbox"
                  :class="{ 'menu-checkbox-checked': hasTag(tags.QUARANTINE) }"
                />
                {{ $t('user_card.admin_menu.quarantine') }}
              </button>
            </div>
          </template>
        </div>
      </template>
      <template #trigger>
        <button
          class="btn button-default btn-block moderation-tools-button"
          :class="{ toggled }"
        >
          {{ $t('user_card.admin_menu.moderation') }}
          <FAIcon icon="chevron-down" />
        </button>
      </template>
    </Popover>
    <teleport to="#modal">
      <DialogModal
        v-if="showDeleteUserDialog"
        :on-cancel="deleteUserDialog.bind(this, false)"
      >
        <template #header>
          {{ $t('user_card.admin_menu.delete_user') }}
        </template>
        <p>{{ $t('user_card.admin_menu.delete_user_confirmation') }}</p>
        <template #footer>
          <button
            class="btn button-default"
            @click="deleteUserDialog(false)"
          >
            {{ $t('general.cancel') }}
          </button>
          <button
            class="btn button-default danger"
            @click="deleteUser()"
          >
            {{ $t('user_card.admin_menu.delete_user') }}
          </button>
        </template>
      </DialogModal>
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
