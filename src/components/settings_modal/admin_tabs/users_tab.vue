<template>
  <div :label="$t('admin_dash.users.management')">
    <div
      class="setting-item"
    >
      <h2> {{ $t('admin_dash.users.title_users') }} </h2>
      <ul class="setting-list">
        <li>
          <label class="query-label"> {{ $t('admin_dash.users.label_query') }} </label>
          <input
            v-model="filtersQuery"
            class="input string-input filter-input"
            @input="reset()"
          >
          <label class="query-label"> {{ $t('admin_dash.users.label_name') }} </label>
          <input
            v-model="filtersName"
            class="input string-input filter-input"
            @input="reset()"
          >
          <label class="query-label"> {{ $t('admin_dash.users.label_email') }} </label>
          <input
            v-model="filtersEmail"
            class="input string-input filter-input"
            @input="reset()"
          >
        </li>
        <li>
          <label class="query-label"> {{ $t('admin_dash.users.label_origin') }} </label>
          <Select
            v-model="filtersOrigin"
            @update:model-value="reset"
          >
            <option
              value="all"
            >
              {{ $t('admin_dash.users.all') }}
            </option>
            <option
              value="local"
            >
              {{ $t('admin_dash.users.only_local') }}
            </option>
            <option
              value="external"
            >
              {{ $t('admin_dash.users.only_external') }}
            </option>
          </Select>
          <label class="query-label"> {{ $t('admin_dash.users.label_activity') }} </label>
          <Select
            v-model="filtersActivity"
            @update:model-value="reset"
          >
            <option
              value="all"
            >
              {{ $t('admin_dash.users.all') }}
            </option>
            <option
              value="active"
            >
              {{ $t('admin_dash.users.only_active') }}
            </option>
            <option
              value="deactivated"
            >
              {{ $t('admin_dash.users.only_deactivated') }}
            </option>
          </Select>
          <label class="query-label"> {{ $t('admin_dash.users.label_privileges') }} </label>
          <Select
            v-model="filtersPrivileges"
            @update:model-value="reset"
          >
            <option
              value="all"
            >
              {{ $t('admin_dash.users.all') }}
            </option>
            <option
              value="admin"
            >
              {{ $t('admin_dash.users.only_administrators') }}
            </option>
            <option
              value="modsnadmins"
            >
              {{ $t('admin_dash.users.all_privileged') }}
            </option>
            <option
              value="moderator"
            >
              {{ $t('admin_dash.users.only_moderators') }}
            </option>
          </Select>
        </li>
        <li>
          <Checkbox
            class="query-label"
            @update:model-value="v => {filtersNeedApproval = v; reset();}"
          >
            {{ $t('admin_dash.users.only_unapproved') }}
          </Checkbox>
          <Checkbox
            class="query-label"
            @update:model-value="v => {filtersUncomfirmed = v; reset();}"
          >
            {{ $t('admin_dash.users.only_unconfirmed') }}
          </Checkbox>
        </li>
      </ul>
      <PageList
        ref="userList"
        :refresh="true"
        :get-key="i => i"
        :box-only="true"
        :page-size="20"
        :fetch-page="(store, opts) => fetchPage(store, opts)"
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
                    @click="activateSelection"
                  >
                    {{ $t('admin_dash.users.activate') }}
                  </button>
                </div>
                <div class="menu-item dropdown-item">
                  <button
                    class="main-button"
                    @click="deactivateSelection"
                  >
                    {{ $t('admin_dash.users.deactivate') }}
                  </button>
                </div>
                <div class="menu-item dropdown-item">
                  <button
                    class="main-button"
                    @click="deleteSelection"
                  >
                    {{ $t('admin_dash.users.delete') }}
                  </button>
                </div>
                <div class="menu-item dropdown-item">
                  <button
                    class="main-button"
                    @click="grantAdminSelection"
                  >
                    {{ $t('admin_dash.users.grant_admin') }}
                  </button>
                </div>
                <div class="menu-item dropdown-item">
                  <button
                    class="main-button"
                    @click="revokeAdminSelection"
                  >
                    {{ $t('admin_dash.users.revoke_admin') }}
                  </button>
                </div>
                <div class="menu-item dropdown-item">
                  <button
                    class="main-button"
                    @click="grantModeratorSelection"
                  >
                    {{ $t('admin_dash.users.grant_moderator') }}
                  </button>
                </div>
                <div class="menu-item dropdown-item">
                  <button
                    class="main-button"
                    @click="revokeModeratorSelection"
                  >
                    {{ $t('admin_dash.users.revoke_moderator') }}
                  </button>
                </div>
                <div class="menu-item dropdown-item">
                  <button
                    class="main-button"
                    @click="approveSelection"
                  >
                    {{ $t('admin_dash.users.approve') }}
                  </button>
                </div>
                <div class="menu-item dropdown-item">
                  <button
                    class="main-button"
                    @click="confirmUserSelection"
                  >
                    {{ $t('admin_dash.users.confirm_user') }}
                  </button>
                </div>
                <div class="menu-item dropdown-item">
                  <button
                    class="main-button"
                    @click="requirePasswordChangeSelection"
                  >
                    {{ $t('admin_dash.users.require_password_change') }}
                  </button>
                </div>
              </div>
            </template>
          </Popover>
        </template>
        <template #item="{item}">
          <AdminCard :user-details="item" />
        </template>
      </PageList>
    </div>
    <GenericConfirm
      ref="confirmActivate"
      :title="$t('admin_dash.users.bulk_actions.activate')"
      :cancel-text="$t('admin_dash.users.bulk_actions.no')"
      :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
      @callback="activateSelectedConfirmed"
    />
    <GenericConfirm
      ref="confirmDeactivate"
      :title="$t('admin_dash.users.bulk_actions.deactivate')"
      :cancel-text="$t('admin_dash.users.bulk_actions.no')"
      :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
      @callback="deactivateSelectionConfirmed"
    />
    <GenericConfirm
      ref="confirmDelete"
      :title="$t('admin_dash.users.bulk_actions.delete')"
      :cancel-text="$t('admin_dash.users.bulk_actions.no')"
      :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
      @callback="deleteSelectionConfirmed"
    />
    <GenericConfirm
      ref="confirmGrantAdmin"
      :title="$t('admin_dash.users.bulk_actions.grant_admin')"
      :cancel-text="$t('admin_dash.users.bulk_actions.no')"
      :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
      @callback="grantAdminSelectionConfirmed"
    />
    <GenericConfirm
      ref="confirmRevokeAdmin"
      :title="$t('admin_dash.users.bulk_actions.revoke_admin')"
      :cancel-text="$t('admin_dash.users.bulk_actions.no')"
      :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
      @callback="revokeAdminSelectionConfirmed"
    />
    <GenericConfirm
      ref="confirmGrantModerator"
      :title="$t('admin_dash.users.bulk_actions.grant_moderator')"
      :cancel-text="$t('admin_dash.users.bulk_actions.no')"
      :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
      @callback="grantModeratorSelectionConfirmed"
    />
    <GenericConfirm
      ref="confirmRevokeModerator"
      :title="$t('admin_dash.users.bulk_actions.revoke_moderator')"
      :cancel-text="$t('admin_dash.users.bulk_actions.no')"
      :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
      @callback="revokeModeratorSelectionConfirmed"
    />
    <GenericConfirm
      ref="confirmConfirmUser"
      :title="$t('admin_dash.users.bulk_actions.confirmUser')"
      :cancel-text="$t('admin_dash.users.bulk_actions.no')"
      :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
      @callback="confirmUserSelectionConfirmed"
    />
    <GenericConfirm
      ref="confirmResendEmail"
      :title="$t('admin_dash.users.bulk_actions.resend_confirmation_email')"
      :cancel-text="$t('admin_dash.users.bulk_actions.no')"
      :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
      @callback="resendEmailSelectionConfirmed"
    />
    <GenericConfirm
      ref="confirmRequirePasswordChange"
      :title="$t('admin_dash.users.bulk_actions.require_password_change')"
      :cancel-text="$t('admin_dash.users.bulk_actions.no')"
      :confirm-text="$t('admin_dash.users.bulk_actions.yes')"
      @callback="requirePasswordChangeSelectionConfirmed"
    />
  </div>
</template>
<script src="./users_tab.js"></script>
<style lang="scss" src="./users_tab.scss"></style>
