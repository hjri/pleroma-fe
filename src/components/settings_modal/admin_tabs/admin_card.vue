<template>
  <div v-if="!isLoaded">
    <FAIcon
      icon="circle-notch"
      spin
      size="lg"
    />
  </div>
  <div v-else>
    <div class="inline-layout">
      <BasicUserCard :user="user" />
      <label
        v-if="isAdmin"
        class="alert neutral user-role"
      >
        {{ $t('admin_dash.users.indicator.admin') }}
      </label>
      <label
        v-if="isModerator"
        class="alert neutral user-role"
      >
        {{ $t('admin_dash.users.indicator.moderator') }}
      </label>
      <label
        v-if="isActivated"
        class="alert info user-role"
      >
        {{ $t('admin_dash.users.indicator.active') }}
      </label>
      <label
        v-if="!isActivated"
        class="alert error user-role"
      >
        {{ $t('admin_dash.users.indicator.deactivated') }}
      </label>
      <label
        v-if="isConfirmed"
        class="alert neutral user-role"
      >
        {{ $t('admin_dash.users.indicator.confirmed') }}
      </label>
      <button
        class="button button-default btn"
        type="button"
        @click="detailsExpanded = true"
      >
        {{ $t('admin_dash.users.details.button') }}
      </button>
      <Popover
        ref="dropdownuser"
        trigger="click"
        placement="top"
      >
        <template #trigger>
          <button
            class="button button-default btn"
          >
            {{ $t('admin_dash.users.actions.title') }}
          </button>
        </template>
        <template #content>
          <div
            v-if="!isActivated"
            class="dropdown-menu"
          >
            <div class="menu-item dropdown-item">
              <button
                class="main-button"
                @click="confirmAction('confirmActivate')"
              >
                {{ $t('admin_dash.users.activate') }}
              </button>
            </div>
          </div>
          <div
            v-if="isActivated"
            class="dropdown-menu"
          >
            <div class="menu-item dropdown-item">
              <button
                class="main-button"
                @click="confirmAction('confirmDeactivate')"
              >
                {{ $t('admin_dash.users.deactivate') }}
              </button>
            </div>
          </div>
          <div class="dropdown-menu">
            <div class="menu-item dropdown-item">
              <button
                class="main-button"
                @click="confirmAction('confirmDeleteUser')"
              >
                {{ $t('admin_dash.users.delete') }}
              </button>
            </div>
          </div>
          <div
            v-if="!isAdmin"
            class="dropdown-menu"
          >
            <div class="menu-item dropdown-item">
              <button
                class="main-button"
                @click="confirmAction('confirmGrantAdmin')"
              >
                {{ $t('admin_dash.users.grant_admin') }}
              </button>
            </div>
          </div>
          <div
            v-if="isAdmin"
            class="dropdown-menu"
          >
            <div class="menu-item dropdown-item">
              <button
                class="main-button"
                @click="confirmAction('confirmRevokeAdmin')"
              >
                {{ $t('admin_dash.users.revoke_admin') }}
              </button>
            </div>
          </div>
          <div
            v-if="!isModerator"
            class="dropdown-menu"
          >
            <div class="menu-item dropdown-item">
              <button
                class="main-button"
                @click="confirmAction('confirmGrantModerator')"
              >
                {{ $t('admin_dash.users.grant_moderator') }}
              </button>
            </div>
          </div>
          <div
            v-if="isModerator"
            class="dropdown-menu"
          >
            <div class="menu-item dropdown-item">
              <button
                class="main-button"
                @click="confirmAction('confirmRevokeModerator')"
              >
                {{ $t('admin_dash.users.revoke_moderator') }}
              </button>
            </div>
          </div>
          <div
            v-if="isApproved"
            class="dropdown-menu"
          >
            <div class="menu-item dropdown-item">
              <button
                class="main-button"
                @click="confirmAction('confirmApprove')"
              >
                {{ $t('admin_dash.users.approve') }}
              </button>
            </div>
          </div>
          <div
            v-if="isConfirmed"
            class="dropdown-menu"
          >
            <div class="menu-item dropdown-item">
              <button
                class="main-button"
                @click="confirmAction('confirmConfirm')"
              >
                {{ $t('admin_dash.users.confirm') }}
              </button>
            </div>
          </div>
          <div class="dropdown-menu">
            <div class="menu-item dropdown-item">
              <button
                class="main-button"
                @click="confirmAction('confirmResendConfirmationEmail')"
              >
                {{ $t('admin_dash.users.resend_confirmation_email') }}
              </button>
            </div>
          </div>
          <div class="dropdown-menu">
            <div class="menu-item dropdown-item">
              <button
                class="main-button"
                @click="confirmAction('confirmRequirePasswordChange')"
              >
                {{ $t('admin_dash.users.require_password_change') }}
              </button>
            </div>
          </div>
          <div class="dropdown-menu">
            <div class="menu-item dropdown-item">
              <button
                class="main-button"
                @click="confirmAction('confirmDisableMFA')"
              >
                {{ $t('admin_dash.users.disable_mfa') }}
              </button>
            </div>
          </div>
        </template>
      </Popover>
    </div>
    <div
      v-if="detailsExpanded"
    >
      <Modal
        class="settings-modal"
        :no-background="false"
        @backdrop-clicked="() => { detailsExpanded = false }"
      >
        <div class="settings-modal-panel panel">
          <div class="panel-heading">
            <h1 class="title">
              {{ $t('admin_dash.users.details.title') }}
            </h1>
            <button
              class="btn button-default"
              :title="$t('general.close')"
              @click="() => { detailsExpanded = false }"
            >
              <FAIcon
                icon="times"
                fixed-width
              />
            </button>
          </div>
          <div
            class="panel-body"
            style="overflow-y: auto;"
          >
            <h2 class="title">
              {{ $t('admin_dash.users.details.overview') }}
            </h2>
            <ul
              class="setting-list"
              style="columns: 2;"
            >
              <li>
                {{ $t('admin_dash.users.details.id') }}
              </li>
              <li>
                {{ $t('admin_dash.users.details.actor_type') }}
              </li>
              <li>
                {{ $t('admin_dash.users.details.roles') }}
              </li>
              <li>
                {{ $t('admin_dash.users.details.account_type') }}
              </li>
              <li>
                {{ $t('admin_dash.users.details.status') }}
              </li>
              <li>
                {{ user.id }}
              </li>
              <li>
                {{ $t('admin_dash.users.details.actor_types.' + user.actor_type.toLowerCase()) }}
              </li>
              <li>
                <span v-if="user.rights.admin === true"> {{ $t('admin_dash.users.details.admin') }} </span>
                <span v-if="user.rights.admin === true && user.rights.moderator === true"> ,&nbsp; </span>
                <span v-if="user.rights.moderator === true"> {{ $t('admin_dash.users.details.moderator') }} </span>
              </li>
              <li>
                <span v-if="user.is_local"> {{ $t('admin_dash.users.details.local') }} </span>
                <span v-else> {{ $t('admin_dash.users.details.remote') }} </span>
              </li>
              <li>
                <span v-if="user.deactivated === false"> {{ $t('admin_dash.users.details.active') }} </span>
                <span v-else> {{ $t('admin_dash.users.details.inactive') }} </span>
              </li>
            </ul>
            <h2 class="title">
              {{ $t('admin_dash.users.details.tags') }}
            </h2>
            <ul class="setting-list">
              <li
                v-for="tag in user.tags"
                :key="tag"
              >
                {{ tag }}
                <button
                  class="button button-default btn"
                  @click="removeUserTag(tag)"
                >
                  <FAIcon
                    icon="minus"
                    size="lg"
                  />
                </button>
              </li>
            </ul>
            <button
              class="button button-default btn"
              @click="$refs.addTextBox.show()"
            >
              {{ $t('admin_dash.users.tags.add_new') }}
              <FAIcon
                icon="plus"
                size="lg"
              />
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
                <Checkbox
                  v-model="showDirect"
                  @update:model-value="() => $refs.timelineList.reset()"
                >
                  {{ $t('admin_dash.users.filters.show_direct') }}
                </Checkbox>
                <Checkbox
                  v-model="showReblogs"
                  @update:model-value="() => $refs.timelineList.reset()"
                >
                  {{ $t('admin_dash.users.filters.show_reblogs') }}
                </Checkbox>
                <Select
                  v-model="timelineSorting"
                  @update:model-value="() => $refs.timelineList.reset()"
                >
                  <option value="asc">
                    {{ $t('admin_dash.users.filters.ascending') }}
                  </option>
                  <option value="des">
                    {{ $t('admin_dash.users.filters.descending') }}
                  </option>
                </Select>
                <Popover
                  ref="dropdownstatus"
                  trigger="click"
                  placement="top"
                >
                  <template #trigger>
                    <button
                      class="button button-default btn"
                    >
                      {{ $t('admin_dash.users.actions.title') }}
                    </button>
                  </template>
                  <p> wrap </p>
                  <template #content>
                    <div class="dropdown-menu">
                      <div class="menu-item dropdown-item">
                        <button
                          class="main-button"
                          @click="confirmAction('confirmDeleteStatus')"
                        >
                          {{ $t('admin_dash.users.delete_status') }}
                        </button>
                      </div>
                      <p> set sensitive </p>
                      <p> unset sensitive </p>
                      <p> make public </p>
                      <p> make unlisted </p>
                      <p> make private </p>
                      <p> make direct </p>
                    </div>
                  </template>
                </Popover>
              </template>
              <template #item="{item}">
                <AdminStatusCard
                  :status-details="item"
                  style="width: 100%"
                />
              </template>
              <template #empty>
                <p> {{ $t('admin_dash.users.user_has_no_posts') }} </p>
              </template>
              <template #load>
                <FAIcon
                  icon="circle-notch"
                  spin
                  size="lg"
                />
              </template>
            </PageList>
          </div>
        </div>
      </Modal>
    </div>
  </div>
  <GenericConfirm
    ref="confirmActivate"
    style="z-index: 10000;"
    :title="$t('admin_dash.users.bulk_actions.activate')"
    :cancel-text="$t('admin_dash.users.bulk_actions.no')"
    :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
    @action="userActionConfirmed('adminActivateUser')"
  />
  <GenericConfirm
    ref="confirmDeactivate"
    style="z-index: 10000;"
    :title="$t('admin_dash.users.bulk_actions.deactivate')"
    :cancel-text="$t('admin_dash.users.bulk_actions.no')"
    :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
    @action="userActionConfirmed('adminDeactivateUser')"
  />
  <GenericConfirm
    ref="confirmDeleteUser"
    style="z-index: 10000;"
    :title="$t('admin_dash.users.bulk_actions.delete_user')"
    :cancel-text="$t('admin_dash.users.bulk_actions.no')"
    :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
    @action="userActionConfirmed('adminDeleteUser')"
  />
  <GenericConfirm
    ref="confirmGrantAdmin"
    style="z-index: 10000;"
    :title="$t('admin_dash.users.bulk_actions.grant_moderator')"
    :cancel-text="$t('admin_dash.users.bulk_actions.no')"
    :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
    @action="userActionConfirmed('adminAddUserToAdminGroup')"
  />
  <GenericConfirm
    ref="confirmRevokeAdmin"
    style="z-index: 10000;"
    :title="$t('admin_dash.users.bulk_actions.revoke_admin')"
    :cancel-text="$t('admin_dash.users.bulk_actions.no')"
    :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
    @action="userActionConfirmed('adminRemoveUserFromAdminGroup')"
  />
  <GenericConfirm
    ref="confirmGrantModerator"
    style="z-index: 10000;"
    :title="$t('admin_dash.users.bulk_actions.grant_moderator')"
    :cancel-text="$t('admin_dash.users.bulk_actions.no')"
    :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
    @action="userActionConfirmed('adminAddUserToModeratorGroup')"
  />
  <GenericConfirm
    ref="confirmRevokeModerator"
    style="z-index: 10000;"
    :title="$t('admin_dash.users.bulk_actions.revoke_moderator')"
    :cancel-text="$t('admin_dash.users.bulk_actions.no')"
    :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
    @action="userActionConfirmed('adminRemoveUserFromModeratorGroup')"
  />
  <GenericConfirm
    ref="confirmApprove"
    style="z-index: 10000;"
    :title="$t('admin_dash.users.bulk_actions.approve')"
    :cancel-text="$t('admin_dash.users.bulk_actions.no')"
    :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
    @action="userActionConfirmed('adminApproveUser')"
  />
  <GenericConfirm
    ref="confirmConfirm"
    style="z-index: 10000;"
    :title="$t('admin_dash.users.bulk_actions.confirm')"
    :cancel-text="$t('admin_dash.users.bulk_actions.no')"
    :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
    @action="userActionConfirmed('adminConfirmUser')"
  />
  <GenericConfirm
    ref="confirmResendConfirmationEmail"
    style="z-index: 10000;"
    :title="$t('admin_dash.users.bulk_actions.resend_confirmation_email')"
    :cancel-text="$t('admin_dash.users.bulk_actions.no')"
    :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
    @action="userActionConfirmed('adminResendConfirmationEmail')"
  />
  <GenericConfirm
    ref="confirmRequirePasswordChange"
    style="z-index: 10000;"
    :title="$t('admin_dash.users.bulk_actions.require_password_change')"
    :cancel-text="$t('admin_dash.users.bulk_actions.no')"
    :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
    @action="userActionConfirmed('adminRequirePasswordChange')"
  />
  <GenericConfirm
    ref="confirmDisableMFA"
    style="z-index: 10000;"
    :title="$t('admin_dash.users.bulk_actions.disable_mfa')"
    :cancel-text="$t('admin_dash.users.bulk_actions.no')"
    :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
    @action="userActionConfirmed('adminDisableMFA')"
  />
  <TextConfirm
    ref="addTextBox"
    style="z-index: 10001;"
    :title="$t('admin_dash.users.tags.new_title')"
    :cancel-text="$t('admin_dash.users.tags.no')"
    :confirm-text="$t('admin_dash.users.tags.yes')"
    @action="addUserTag"
  />
</template>

<script src="./admin_card.js"></script>
<style lang="scss" src="./admin_card.scss"></style>
<style lang="scss" src="../settings_modal.scss"></style>
<!--<style lang="scss">
.admin-card-content-container {
  margin-top: 0.5em;
  text-align: right;

  button {
    width: 10em;
  }
}
</style>-->
