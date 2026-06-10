<template>
  <div>
    <Popover
      v-if="button.dropdown?.()"
      :trigger="$attrs.extra ? 'hover' : 'click'"
      :offset="{ y: 5 }"
      :placement="$attrs.extra ? 'right' : 'bottom'"
    >
      <template #trigger>
        <ActionButton
          :button="button"
          :status="status"
          v-bind.prop="$attrs"
        />
      </template>
      <template #content>
        <div
          v-if="button.name === 'changeScope'"
          :id="`popup-menu-scope-${randomSeed}`"
          class="dropdown-menu"
          role="menu"
        >
          <div
            v-for="visibility in availableScopes"
            :key="visibility"
            class="menu-item dropdown-item extra-action -icon"
          >
            <button
              class="main-button"
              @click="() => setScope(visibility)"
            >
              <FAIcon
                :icon="visibilityIcon(visibility)"
                fixed-width
              />
              {{ $t('general.scope_in_timeline.' + visibility) }}
            </button>
          </div>
          <div
            v-if="status.nsfw"
            class="menu-item dropdown-item extra-action -icon"
          >
            <button
              class="main-button"
              @click="() => setSensitive(false)"
            >
              <FAIcon
                icon="eye"
                fixed-width
              />
              {{ $t('status.mark_as_non-sensitive') }}
            </button>
          </div>
          <div
            v-else
            class="menu-item dropdown-item extra-action -icon"
          >
            <button
              class="main-button"
              @click="() => setSensitive(true)"
            >
              <FAIcon
                icon="eye-slash"
                fixed-width
              />
              {{ $t('status.mark_as_sensitive') }}
            </button>
          </div>
        </div>
        <div
          v-if="button.name === 'mute'"
          :id="`popup-menu-${randomSeed}`"
          class="dropdown-menu"
          role="menu"
        >
          <div class="menu-item dropdown-item extra-action -icon">
            <button
              class="main-button"
              @click="toggleUserMute"
            >
              <FAIcon
                icon="user"
                fixed-width
              />
              <template v-if="userIsMuted">
                {{ $t('status.unmute_user') }}
              </template>
              <template v-else>
                {{ $t('status.mute_user') }}
              </template>
            </button>
          </div>
          <div class="menu-item dropdown-item extra-action -icon">
            <button
              class="main-button"
              @click="toggleConversationMute"
            >
              <FAIcon
                icon="folder-tree"
                fixed-width
              />
              <template v-if="conversationIsMuted">
                {{ $t('status.unmute_conversation') }}
              </template>
              <template v-else>
                {{ $t('status.mute_conversation') }}
              </template>
            </button>
          </div>
          <div class="menu-item dropdown-item extra-action -icon">
            <button
              class="main-button"
              @click="toggleDomainMute"
            >
              <FAIcon
                icon="globe"
                fixed-width
              />
              <template v-if="domainIsMuted">
                {{ $t('status.unmute_domain') }}
              </template>
              <template v-else>
                {{ $t('status.mute_domain') }}
              </template>
            </button>
          </div>
        </div>
      </template>
    </Popover>
    <ActionButton
      v-else
      :button="button"
      :status="status"
      v-bind="$attrs"
      @emoji-picker-shown="e => $emit('emojiPickerShown', e)"
    />
    <teleport to="#modal">
      <MuteConfirm
        ref="confirmConversation"
        type="conversation"
        :status="status"
        :user="user"
      />
      <MuteConfirm
        ref="confirmDomain"
        type="domain"
        :status="status"
        :user="user"
      />
      <UserTimedFilterModal
        ref="confirmUser"
        :is-mute="true"
        :user="user"
      />
    </teleport>
  </div>
</template>

<script src="./action_button_container.js" />
