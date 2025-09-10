<template>
  <div v-if="!justDeleted">
    <div v-if="!isLoaded">
      {{ $t('admin_dash.users.loading_user') }}
    </div>
    <div v-else>
      <div class="inline-layout">
        <BasicUserCard :user="user" />
        <label
          v-if="isAdmin"
          class="alert neutral user-role"
        >
          {{ $t('admin_dash.users.indicator_admin') }}
        </label>
        <label
          v-if="isModerator"
          class="alert neutral user-role"
        >
          {{ $t('admin_dash.users.indicator_moderator') }}
        </label>
        <label
          v-if="isActivated"
          class="alert info user-role"
        >
          {{ $t('admin_dash.users.indicator_active') }}
        </label>
        <label
          v-if="!isActivated"
          class="alert error user-role"
        >
          {{ $t('admin_dash.users.indicator_deactivated') }}
        </label>
        <label
          v-if="isConfirmed"
          class="alert neutral user-role"
        >
          {{ $t('admin_dash.users.indicator_confirmed') }}
        </label>
        <button
          class="button button-default btn"
          type="button"
          @click="detailsExpanded = true"
        >
          {{ $t('admin_dash.users.title_details') }}
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
              {{ $t('admin_dash.users.title_actions') }}
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
          :no-background="false"
          @backdrop-clicked="() => { detailsExpanded = false }"
        >
          <div style="background-color: rgb(80 80 80 / 100%); width: 80%; height: 60%; overflow-y: auto;">
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
                <p> add options to sort statuses </p>
                <Popover
                  ref="dropdownstatus"
                  trigger="click"
                  placement="top"
                >
                  <template #trigger>
                    <button
                      class="button button-default btn"
                    >
                      {{ $t('admin_dash.user.title_actions') }}
                    </button>
                  </template>
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
          <!--
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
          -->
        </Modal>
      </div>
      <!--
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
      -->
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
  </div>
</template>

<script src="./admin_card.js"></script>
<style lang="scss" src="./admin_card.scss"></style>
<!--<style lang="scss">
.admin-card-content-container {
  margin-top: 0.5em;
  text-align: right;

  button {
    width: 10em;
  }
}
</style>-->
