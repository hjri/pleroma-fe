<template>
<div
  class="AccountActions"
  role="presentation"
>
    <Popover
      trigger="click"
      placement="bottom"
      remove-padding
      :trigger-attrs="{ 'aria-label': $t('user_card.other'), role: 'menuitem' }"
    >
      <template #content>
        <div role="menu" class="dropdown-menu">
          <template v-if="relationship.following">
            <div
              v-if="relationship.showing_reblogs"
              class="menu-item dropdown-item"
              role="menuitem"
            >
              <button
                class="main-button"
                @click="hideRepeats"
              >
                {{ $t('user_card.hide_repeats') }}
              </button>
            </div>
            <div
              v-if="!relationship.showing_reblogs"
              class="menu-item dropdown-item"
              role="menuitem"
            >
              <button
                class="main-button"
                @click="showRepeats"
              >
                {{ $t('user_card.show_repeats') }}
              </button>
            </div>
            <hr
              role="separator"
              class="dropdown-divider"
            />
          </template>
          <UserListMenu :user="user" />
          <div
            v-if="relationship.followed_by"
            class="menu-item dropdown-item"
            role="menuitem"
          >
            <button
              class="main-button"
              @click="removeUserFromFollowers"
            >
              {{ $t('user_card.remove_follower') }}
            </button>
          </div>
          <div
            class="menu-item dropdown-item"
            role="menuitem"
          >
            <button
              v-if="relationship.blocking"
              class="main-button"
              @click="unblockUser"
            >
              {{ $t('user_card.unblock') }}
            </button>
            <button
              v-else
              class="main-button"
              @click="blockUser"
            >
              {{ $t('user_card.block') }}
            </button>
          </div>
          <div
            class="menu-item dropdown-item"
            role="menuitem"
          >
            <button
              class="main-button"
              @click="reportUser"
            >
              {{ $t('user_card.report') }}
            </button>
          </div>
          <div
            v-if="pleromaChatMessagesAvailable"
            class="menu-item dropdown-item"
            role="menuitem"
          >
            <button
              class="main-button"
              @click="openChat"
            >
              {{ $t('user_card.message') }}
            </button>
          </div>
        </div>
      </template>
      <template #trigger>
        <FAIcon
          class="icon"
          icon="ellipsis-v"
        />
      </template>
    </Popover>
    <teleport to="#modal">
      <ConfirmModal
        v-if="showingConfirmBlock && !blockExpiration"
        ref="blockDialog"
        :title="$t('user_card.block_confirm_title')"
        :confirm-text="$t('user_card.block_confirm_accept_button')"
        :cancel-text="$t('user_card.block_confirm_cancel_button')"
        @accepted="doBlockUser"
        @cancelled="hideConfirmBlock"
      >
        <i18n-t
          keypath="user_card.block_confirm"
          tag="span"
          scope="global"
        >
          <template #user>
            <span
              v-text="user.screen_name_ui"
            />
          </template>
        </i18n-t>
      </ConfirmModal>
    </teleport>
    <teleport to="#modal">
      <ConfirmModal
        v-if="showingConfirmRemoveFollower"
        :title="$t('user_card.remove_follower_confirm_title')"
        :confirm-text="$t('user_card.remove_follower_confirm_accept_button')"
        :cancel-text="$t('user_card.remove_follower_confirm_cancel_button')"
        @accepted="doRemoveUserFromFollowers"
        @cancelled="hideConfirmRemoveUserFromFollowers"
      >
        <i18n-t
          keypath="user_card.remove_follower_confirm"
          tag="span"
          scope="global"
        >
          <template #user>
            <span
              v-text="user.screen_name_ui"
            />
          </template>
        </i18n-t>
      </ConfirmModal>
      <UserTimedFilterModal
        v-if="blockExpiration"
        ref="timedBlockDialog"
        :is-mute="false"
        :user="user"
      />
    </teleport>
  </div>
</template>

<script src="./account_actions.js"></script>

<style lang="scss">
</style>
