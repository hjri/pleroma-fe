<template>
  <div
    class="UsersTab"
    :label="$t('admin_dash.users.management')"
  >
    <h3>
      {{ $t('admin_dash.users.title') }}
    </h3>
    <div class="filters-section">
      <label class="filter">
        <div class="query-label">
          {{ $t('admin_dash.users.labels.query') }}
        </div>
        <input
          v-model="filtersQuery"
          class="input string-input filter-input"
        >
      </label>
      <label class="filter">
        <div class="query-label">
          {{ $t('admin_dash.users.labels.name') }}
        </div>
        <input
          v-model="filtersName"
          class="input string-input filter-input"
        >
      </label>
      <label class="filter">
        <div class="query-label">
          {{ $t('admin_dash.users.labels.email') }}
        </div>
        <input
          v-model="filtersEmail"
          class="input string-input filter-input"
        >
      </label>
      <div class="filter">
        <div class="query-label">
          {{ $t('admin_dash.users.labels.origin') }}
        </div>
        <Select
          v-model="filtersOrigin"
        >
          <option
            value="all"
          >
            {{ $t('admin_dash.users.options.all') }}
          </option>
          <option
            value="local"
          >
            {{ $t('admin_dash.users.options.only_local') }}
          </option>
          <option
            value="external"
          >
            {{ $t('admin_dash.users.options.only_external') }}
          </option>
        </Select>
      </div>
      <div class="filter">
        <div class="query-label">
          {{ $t('admin_dash.users.labels.activity') }}
        </div>
        <Select
          v-model="filtersActivity"
        >
          <option
            value="all"
          >
            {{ $t('admin_dash.users.options.all') }}
          </option>
          <option
            value="active"
          >
            {{ $t('admin_dash.users.options.only_active') }}
          </option>
          <option
            value="deactivated"
          >
            {{ $t('admin_dash.users.options.only_deactivated') }}
          </option>
        </Select>
      </div>
      <div class="filter">
        <div class="query-label">
          {{ $t('admin_dash.users.labels.privileges') }}
        </div>
        <Select v-model="filtersPrivileges">
          <option
            value="all"
          >
            {{ $t('admin_dash.users.options.all') }}
          </option>
          <option
            value="admin"
          >
            {{ $t('admin_dash.users.options.only_admins') }}
          </option>
          <option
            value="modsnadmins"
          >
            {{ $t('admin_dash.users.options.only_privileged') }}
          </option>
          <option
            value="moderator"
          >
            {{ $t('admin_dash.users.options.only_moderators') }}
          </option>
        </Select>
      </div>
      <div class="filter">
        <Checkbox v-model="filtersNeedApproval">
          {{ $t('admin_dash.users.options.only_unapproved') }}
        </Checkbox>
      </div>
      <div class="filter">
        <Checkbox v-model="filtersUncomfirmed">
          {{ $t('admin_dash.users.options.only_unconfirmed') }}
        </Checkbox>
      </div>
    </div>
    <List
      ref="usersList"
      :fetch-function="fetchUsers"
      selectable
      scrollable
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
              {{ $t('admin_dash.users.actions.title') }}
            </button>
          </template>
          <template #content>
            <div class="dropdown-menu">
              <div class="menu-item dropdown-item">
                <button
                  class="main-button"
                  @click="confirmSelection('confirmActivate')"
                >
                  {{ $t('admin_dash.users.actions.activate') }}
                </button>
              </div>
              <div class="menu-item dropdown-item">
                <button
                  class="main-button"
                  @click="confirmSelection('confirmDeactivate')"
                >
                  {{ $t('admin_dash.users.actions.deactivate') }}
                </button>
              </div>
              <div class="menu-item dropdown-item">
                <button
                  class="main-button"
                  @click="confirmSelection('confirmDelete')"
                >
                  {{ $t('admin_dash.users.actions.delete_user') }}
                </button>
              </div>
              <div class="menu-item dropdown-item">
                <button
                  class="main-button"
                  @click="confirmSelection('confirmGrantAdmin')"
                >
                  {{ $t('admin_dash.users.actions.grant_admin') }}
                </button>
              </div>
              <div class="menu-item dropdown-item">
                <button
                  class="main-button"
                  @click="confirmSelection('confirmRevokeAdmin')"
                >
                  {{ $t('admin_dash.users.actions.revoke_admin') }}
                </button>
              </div>
              <div class="menu-item dropdown-item">
                <button
                  class="main-button"
                  @click="confirmSelection('confirmGrantModerator')"
                >
                  {{ $t('admin_dash.users.actions.grant_moderator') }}
                </button>
              </div>
              <div class="menu-item dropdown-item">
                <button
                  class="main-button"
                  @click="confirmSelection('confirmRevokeModerator')"
                >
                  {{ $t('admin_dash.users.actions.revoke_moderator') }}
                </button>
              </div>
              <div class="menu-item dropdown-item">
                <button
                  class="main-button"
                  @click="confirmSelection('confirmApprove')"
                >
                  {{ $t('admin_dash.users.actions.approve') }}
                </button>
              </div>
              <div class="menu-item dropdown-item">
                <button
                  class="main-button"
                  @click="confirmSelection('confirmConfirm')"
                >
                  {{ $t('admin_dash.users.actions.confirm') }}
                </button>
              </div>
              <div class="menu-item dropdown-item">
                <button
                  class="main-button"
                  @click="confirmSelection('confirmResendEmail')"
                >
                  {{ $t('admin_dash.users.actions.resend_confirmation_email') }}
                </button>
              </div>
              <div class="menu-item dropdown-item">
                <button
                  class="main-button"
                  @click="confirmSelection('confirmRequirePasswordChange')"
                >
                  {{ $t('admin_dash.users.actions.require_password_change') }}
                </button>
              </div>
              <div class="menu-item dropdown-item">
                <button
                  class="main-button"
                  @click="confirmSelection('confirmDisableMFA')"
                >
                  {{ $t('admin_dash.users.actions.disable_mfa') }}
                </button>
              </div>
            </div>
          </template>
        </Popover>
      </template>
      <template #item="{item}">
        <AdminCard :user-details="item" />
      </template>
      <template #load>
        <span> loading </span>
      </template>
      <template #empty>
        <span> no users </span>
      </template>
    </List>
    <GenericConfirm
      ref="confirmActivate"
      :title="$t('admin_dash.users.actions.confirm_multi.title')"
      :message="$t('admin_dash.users.actions.confirm_multi.activate')"
      :cancel-text="$t('admin_dash.users.actions.no')"
      :confirm-text="$t('admin_dash.users.actions.yes')"
      @action="selectionConfirmed('adminActivateUser')"
    />
    <GenericConfirm
      ref="confirmDeactivate"
      :title="$t('admin_dash.users.actions.confirm_multi.title')"
      :message="$t('admin_dash.users.actions.confirm_multi.deactivate')"
      :cancel-text="$t('admin_dash.users.actions.no')"
      :confirm-text="$t('admin_dash.users.actions.yes')"
      @action="selectionConfirmed('adminDeactivateUser')"
    />
    <GenericConfirm
      ref="confirmDelete"
      :title="$t('admin_dash.users.actions.confirm_multi.title')"
      :message="$t('admin_dash.users.actions.confirm_multi.delete_user')"
      :cancel-text="$t('admin_dash.users.actions.no')"
      :confirm-text="$t('admin_dash.users.actions.yes')"
      @action="selectionConfirmed('adminDeleteUser')"
    />
    <GenericConfirm
      ref="confirmGrantAdmin"
      :title="$t('admin_dash.users.actions.confirm_multi.title')"
      :message="$t('admin_dash.users.actions.confirm_multi.grant_admin')"
      :cancel-text="$t('admin_dash.users.actions.no')"
      :confirm-text="$t('admin_dash.users.actions.yes')"
      @action="selectionConfirmed('adminAddUserToAdminGroup')"
    />
    <GenericConfirm
      ref="confirmRevokeAdmin"
      :title="$t('admin_dash.users.actions.confirm_multi.title')"
      :message="$t('admin_dash.users.actions.confirm_multi.revoke_admin')"
      :cancel-text="$t('admin_dash.users.actions.no')"
      :confirm-text="$t('admin_dash.users.actions.yes')"
      @action="selectionConfirmed('adminRemoveUserFromAdminGroup')"
    />
    <GenericConfirm
      ref="confirmGrantModerator"
      :title="$t('admin_dash.users.actions.confirm_multi.title')"
      :message="$t('admin_dash.users.actions.confirm_multi.grant_moderator')"
      :cancel-text="$t('admin_dash.users.actions.no')"
      :confirm-text="$t('admin_dash.users.actions.yes')"
      @action="selectionConfirmed('adminAddUserToModeratorGroup')"
    />
    <GenericConfirm
      ref="confirmRevokeModerator"
      :title="$t('admin_dash.users.actions.confirm_multi.title')"
      :message="$t('admin_dash.users.actions.confirm_multi.revoke_moderator')"
      :cancel-text="$t('admin_dash.users.actions.no')"
      :confirm-text="$t('admin_dash.users.actions.yes')"
      @action="selectionConfirmed('adminRemoveUserFromModeratorGroup')"
    />
    <GenericConfirm
      ref="confirmApprove"
      :title="$t('admin_dash.users.actions.confirm_multi.title')"
      :message="$t('admin_dash.users.actions.confirm_multi.approve')"
      :cancel-text="$t('admin_dash.users.actions.no')"
      :confirm-text="$t('admin_dash.users.actions.yes')"
      @action="selectionConfirmed('adminApproveUser')"
    />
    <GenericConfirm
      ref="confirmConfirm"
      :title="$t('admin_dash.users.actions.confirm_multi.title')"
      :message="$t('admin_dash.users.actions.confirm_multi.confirm')"
      :cancel-text="$t('admin_dash.users.actions.no')"
      :confirm-text="$t('admin_dash.users.actions.yes')"
      @action="selectionConfirmed('adminConfirmUser')"
    />
    <GenericConfirm
      ref="confirmResendEmail"
      :title="$t('admin_dash.users.actions.confirm_multi.title')"
      :message="$t('admin_dash.users.actions.confirm_multi.resend_confirmation_email')"
      :cancel-text="$t('admin_dash.users.actions.no')"
      :confirm-text="$t('admin_dash.users.actions.yes')"
      @action="selectionConfirmed('adminResendConfirmationEmail')"
    />
    <GenericConfirm
      ref="confirmRequirePasswordChange"
      :title="$t('admin_dash.users.actions.confirm_multi.title')"
      :message="$t('admin_dash.users.actions.confirm_multi.require_password_change')"
      :cancel-text="$t('admin_dash.users.actions.no')"
      :confirm-text="$t('admin_dash.users.actions.yes')"
      @action="selectionConfirmed('adminRequirePasswordChange')"
    />
    <GenericConfirm
      ref="confirmDisableMFA"
      :title="$t('admin_dash.users.actions.confirm_multi.title')"
      :message="$t('admin_dash.users.actions.confirm_multi.disable_mfa')"
      :cancel-text="$t('admin_dash.users.actions.no')"
      :confirm-text="$t('admin_dash.users.actions.yes')"
      @action="selectionConfirmed('adminDisableMFA')"
    />
  </div>
</template>
<script src="./users_tab.js"></script>
<style lang="scss" src="./users_tab.scss"></style>
