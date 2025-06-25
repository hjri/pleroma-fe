<template>
  <div class="StatusActionButtons">
    <span class="quick-action-buttons">
      <span
        v-for="button in quickButtons"
        :key="button.name"
        class="quick-action"
        :class="{ '-pin': showPin, '-toggle': button.dropdown?.() }"
      >
        <ActionButtonContainer
          :class="{ '-pin': showPin }"
          :button="button"
          :status="status"
          :extra="false"
          :func-arg="funcArg"
          :get-class="getClass"
          :get-component="getComponent"
          :close="() => {}"
          :do-action="doAction"
          @interacted="e => $emit('interacted')"
        />
        <button
          v-if="showPin && currentUser"
          type="button"
          class="button-unstyled pin-action-button"
          :title="$t('general.unpin')"
          :aria-pressed="true"
          @click.stop.prevent="unpin(button)"
        >
          <FAIcon
            v-if="showPin && currentUser"
            fixed-width
            class="fa-scale-110"
            icon="thumbtack"
          />
        </button>
      </span>
      <Popover
        trigger="click"
        :trigger-attrs="triggerAttrs"
        :tabindex="0"
        placement="top"
        :offset="{ y: 5 }"
        remove-padding
        @close="onExtraClose"
      >
        <template #trigger>
          <FAIcon
            class="fa-scale-110 "
            icon="ellipsis-h"
          />
        </template>
        <template #content="{close, resize}">
          <div
            :id="`popup-menu-${randomSeed}`"
            class="dropdown-menu extra-action-buttons"
            role="menu"
          >
            <div
              v-if="currentUser"
              class="menu-item dropdown-item extra-action -icon"
            >
              <button
                class="main-button"
                role="menuitem"
                :tabindex="0"
                @click.stop="() => { resize(); showPin = !showPin }"
              >
                <FAIcon
                  class="fa-scale-110"
                  fixed-width
                  icon="wrench"
                /><span>{{ $t('nav.edit_pinned') }}</span>
              </button>
            </div>
            <div
              v-for="button in extraButtons"
              :key="button.name"
              class="menu-item dropdown-item extra-action -icon"
              :disabled="getClass(button).disabled"
              :class="{ disabled: getClass(button).disabled }"
            >
              <ActionButtonContainer
                :button="button"
                :status="status"
                :extra="true"
                :func-arg="funcArg"
                :get-class="getClass"
                :get-component="getComponent"
                :outer-close="close"
                :do-action="doAction"
                @interacted="e => $emit('interacted')"
              />
              <button
                v-if="showPin && currentUser"
                type="button"
                class="button-unstyled pin-action-button extra-button"
                :title="$t('general.pin')"
                :aria-pressed="false"
                @click.stop.prevent="pin(button)"
              >
                <FAIcon
                  v-if="showPin && currentUser"
                  fixed-width
                  class="fa-scale-110"
                  transform="rotate-45"
                  icon="thumbtack"
                />
              </button>
            </div>
          </div>
        </template>
      </Popover>
    </span>

    <teleport to="#modal">
      <confirm-modal
        v-if="showingConfirmDialog"
        :title="currentConfirmTitle"
        :confirm-text="currentConfirmOkText"
        :cancel-text="currentConfirmCancelText"
        @accepted="currentConfirmAction"
        @cancelled="showingConfirmDialog = false"
      >
        {{ currentConfirmBody }}
      </confirm-modal>
    </teleport>
  </div>
</template>

<script src="./status_action_buttons.js"></script>

<style lang="scss" src="./status_action_buttons.scss"></style>
