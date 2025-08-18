<template>
  <div v-if="!justDeleted">
    <div v-if="!isLoaded">
      {{ $t('admin_dash.users.loading_user') }}
    </div>
    <div v-else>
      <BasicUserCard :user="user" />
      <div v-if="!topLevelExpanded">
        <button
          class="button button-default btn"
          type="button"
          @click="topLevelExpanded = true"
        >
          {{ $t('admin_dash.users.expand_user') }}
        </button>
      </div>
      <div
        v-else
      >
        <Modal
          @backdrop-clicked="() => { topLevelExpanded = false }"
        >
          <ul class="setting-list">
            <li>
              <button
                class="button button-default btn"
                type="button"
                @click="topLevelExpanded = false"
              >
                {{ $t('admin_dash.users.collapse_user') }}
              </button>
            </li>
            <li
              v-if="isLocal"
            >
              <Checkbox
                :model-value="isAdmin"
                @update:model-value="v => toggleAdmin(v)"
              >
                {{ $t('admin_dash.users.is_admin') }}
              </Checkbox>
            </li>
            <li
              v-if="isLocal"
            >
              <Checkbox
                :model-value="isModerator"
                @update:model-value="v => toggleModerator(v)"
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
                @click="toggleApproval(true)"
              >
                {{ $t('admin_dash.users.approve') }}
              </button>
            </li>
            <li>
              <Checkbox
                :model-value="isActivated"
                @update:model-value="v => toggleActivation(v)"
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
            <button
              class="button button-default btn"
              type="button"
              @click="deleteSelection"
            >
              {{ $t('admin_dash.users.delete') }}
            </button>
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
