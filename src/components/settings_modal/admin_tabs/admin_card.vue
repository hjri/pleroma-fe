<template>
  <div v-if="!justDeleted">
    <div v-if="!isLoaded">
      {{ $t('admin_dash.users.loading_user') }}
    </div>
    <div v-else>
      <BasicUserCard :user="user" />
      <button
        class="button button-default btn"
        type="button"
        @click="detailsExpanded = true"
      >
        {{ $t('admin_dash.users.details') }}
      </button>
      <div
        v-if="detailsExpanded"
      >
        <Modal
          @backdrop-clicked="() => { detailsExpanded = false }"
        >
          <ul class="setting-list">
            <li
              v-if="isLocal"
            >
              <Checkbox
                :model-value="isAdmin"
                @update:model-value="v => setAdmin(v)"
              >
                {{ $t('admin_dash.users.is_admin') }}
              </Checkbox>
            </li>
            <li
              v-if="isLocal"
            >
              <Checkbox
                :model-value="isModerator"
                @update:model-value="v => setModerator(v)"
              >
                {{ $t('admin_dash.users.is_moderator') }}
              </Checkbox>
            </li>
            <li
              v-if="isLocal && !justConfirmed && !isConfirmed"
            >
              <button
                class="button button-default btn"
                type="button"
                @click="confirmUser()"
              >
                {{ $t('admin_dash.users.is_confirmed') }}
              </button>
            </li>
            <li
              v-if="isLocal && !justConfirmed && !isConfirmed"
            >
              <button
                class="button button-default btn"
                type="button"
                @click="resendConfirmationEmail()"
              >
                {{ $t('admin_dash.users.resend_confirmation_email') }}
              </button>
            </li>
            <li
              v-if="isLocal && !isApproved"
            >
              <button
                class="button button-default btn"
                type="button"
                @click="approveUser()"
              >
                {{ $t('admin_dash.users.approve') }}
              </button>
            </li>
            <li>
              <Checkbox
                :model-value="isActivated"
                @update:model-value="v => setActivation(v)"
              >
                {{ $t('admin_dash.users.is_active') }}
              </Checkbox>
            </li>
            <li>
              <button
                class="button button-default btn"
                type="button"
                @click="deleteUser()"
              >
                {{ $t('admin_dash.users.delete_user') }}
              </button>
            </li>
          </ul>
        </Modal>
      </div>
      <div v-if="!timelineExpanded">
        <button
          class="button button-default btn"
          type="button"
          @click="timelineExpanded = true"
        >
          {{ $t('admin_dash.users.expand_timeline') }}
        </button>
      </div>
      <div
        v-else
        class="setting-item"
      >
        <button
          class="button button-default btn"
          type="button"
          @click="timelineExpanded = false"
        >
          {{ $t('admin_dash.users.collapse_timeline') }}
        </button>
        <PageList
          ref="timelineList"
          :refresh="true"
          :get-key="i => i"
          :box-only="true"
          :page-size="20"
          :single-page="true"
          :fetch-page="(store, opts) => fetchStatuses(store, opts)"
        >
          <template #header>
            <Popover
              ref="dropdown"
              trigger="click"
              placement="bottom"
            >
              <template #trigger>
                <button
                  class="button button-default btn"
                >
                  {{ $t('admin_dash.users.bulk_actions.title') }}
                </button>
              </template>
              <template #content>
                <div class="dropdown-menu">
                  <div class="menu-item dropdown-item">
                    <button
                      class="main-button"
                      @click="confirmSelection('confirmDelete')"
                    >
                      {{ $t('admin_dash.users.delete') }}
                    </button>
                  </div>
                  <div class="menu-item dropdown-item">
                    <button
                      class="main-button"
                      @click="confirmSelection('confirmSetSensitive')"
                    >
                      {{ $t('admin_dash.users.set_sensitive') }}
                    </button>
                  </div>
                  <div class="menu-item dropdown-item">
                    <button
                      class="main-button"
                      @click="confirmSelection('confirmUnsetSensitive')"
                    >
                      {{ $t('admin_dash.users.unset_sensitive') }}
                    </button>
                  </div>
                </div>
              </template>
            </Popover>
          </template>
          <template #item="{item}">
            <AdminStatusCard :status-details="item" />
          </template>
          <template #empty>
            <p> {{ $t('admin_dash.users.user_has_no_posts') }} </p>
          </template>
          <template #load>
            <p> {{ $t('admin_dash.users.loading') }} </p>
          </template>
        </PageList>
      </div>
      <div v-if="!jsonExpanded">
        <button
          class="button button-default btn"
          type="button"
          @click="jsonExpanded = true"
        >
          {{ $t('admin_dash.users.expand_raw_info') }}
        </button>
      </div>
      <div
        v-else
        class="setting-item"
      >
        <button
          class="button button-default btn"
          type="button"
          @click="jsonExpanded = false"
        >
          {{ $t('admin_dash.users.collapse_raw_info') }}
        </button>
        <h2> {{ $t('admin_dash.users.title_database') }} </h2>
        <pre> {{ JSON.stringify(user, null, 2) }} </pre>
        <h2> {{ $t('admin_dash.users.title_details') }} </h2>
        <pre> {{ JSON.stringify(user_details, null, 2) }} </pre>
      </div>
    </div>
    <GenericConfirm
      ref="confirmDelete"
      :title="$t('admin_dash.users.bulk_actions.activate')"
      :cancel-text="$t('admin_dash.users.bulk_actions.no')"
      :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
      @callback="selectionConfirmed('adminDeleteStatus')"
    />
    <GenericConfirm
      ref="confirmSetSensitive"
      :title="$t('admin_dash.users.bulk_actions.change_sensitivity')"
      :cancel-text="$t('admin_dash.users.bulk_actions.no')"
      :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
      @callback="selectionConfirmed('adminChangeStatusScope', { sensitive: true })"
    />
    <GenericConfirm
      ref="confirmUnsetSensitive"
      :title="$t('admin_dash.users.bulk_actions.unmark_as_sensitive')"
      :cancel-text="$t('admin_dash.users.bulk_actions.no')"
      :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
      @callback="selectionConfirmed('adminChangeStatusScope', { sensitive: false })"
    />
    <GenericConfirm
      ref="confirmSetPublic"
      :title="$t('admin_dash.users.bulk_actions.mark_as_public')"
      :cancel-text="$t('admin_dash.users.bulk_actions.no')"
      :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
      @callback="selectionConfirmed('adminChangeStatusScope', { visiblity: 'public' })"
    />
    <GenericConfirm
      ref="confirmSetUnlisted"
      :title="$t('admin_dash.users.bulk_actions.mark_as_unlisted')"
      :cancel-text="$t('admin_dash.users.bulk_actions.no')"
      :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
      @callback="selectionConfirmed('adminChangeStatusScope', { visiblity: 'unlisted' })"
    />
    <GenericConfirm
      ref="confirmSetPrivate"
      :title="$t('admin_dash.users.bulk_actions.mark_as_private')"
      :cancel-text="$t('admin_dash.users.bulk_actions.no')"
      :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
      @callback="selectionConfirmed('adminChangeStatusScope', { visiblity: 'private' })"
    />
    <GenericConfirm
      ref="confirmSetDirect"
      :title="$t('admin_dash.users.bulk_actions.mark_as_direct')"
      :cancel-text="$t('admin_dash.users.bulk_actions.no')"
      :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
      @callback="selectionConfirmed('adminChangeStatusScope', { visiblity: 'direct' })"
    />
  </div>
</template>

<script src="./admin_card.js"></script>

<style lang="scss">
.admin-card-content-container {
  margin-top: 0.5em;
  text-align: right;

  button {
    width: 10em;
  }
}
</style>
