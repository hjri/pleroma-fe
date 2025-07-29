<template>
  <div v-if="!just_deleted">
    <div v-if="!isLoaded">
      {{ $t('admin_dash.users.loading_user') }}
    </div>
    <div v-else>
      <div v-if="user_details.id !== $store.state.users.currentUser.id">
        <BasicUserCard :user="user" />
        <div v-if="!top_level_expanded">
          <button
            class="button button-default btn"
            type="button"
            @click="top_level_expanded = true"
          >
            {{ $t('admin_dash.users.expand_user') }}
          </button>
        </div>
        <div
          v-else
        >
          <ul class="setting-list">
            <li>
              <button
                class="button button-default btn"
                type="button"
                @click="top_level_expanded = false"
              >
                {{ $t('admin_dash.users.collapse_user') }}
              </button>
            </li>
            <li
              v-if="is_local"
            >
              <Checkbox
                :model-value="is_admin"
                @update:model-value="v => toggle_admin(v)"
              >
                {{ $t('admin_dash.users.is_admin') }}
              </Checkbox>
            </li>
            <li
              v-if="is_local"
            >
              <Checkbox
                :model-value="is_moderator"
                @update:model-value="v => toggle_moderator(v)"
              >
                {{ $t('admin_dash.users.is_moderator') }}
              </Checkbox>
            </li>
            <li
              v-if="is_local && !just_confirmed && !is_confirmed"
            >
              <button
                class="button button-default btn"
                type="button"
                @click="confirm_user()"
              >
                {{ $t('admin_dash.users.is_confirmed') }}
              </button>
            </li>
            <li
              v-if="is_local && !just_confirmed && !is_confirmed"
            >
              <button
                class="button button-default btn"
                type="button"
                @click="resend_confirmation_email()"
              >
                {{ $t('admin_dash.users.resend_confirmation_email') }}
              </button>
            </li>
            <li
              v-if="is_local && !is_approved"
            >
              <button
                class="button button-default btn"
                type="button"
                @click="toggle_approval(true)"
              >
                {{ $t('admin_dash.users.approve') }}
              </button>
            </li>
            <li>
              <Checkbox
                :model-value="is_activated"
                @update:model-value="v => toggle_activation(v)"
              >
                {{ $t('admin_dash.users.is_active') }}
              </Checkbox>
            </li>
            <li>
              <button
                class="button button-default btn"
                type="button"
                @click="delete_user()"
              >
                {{ $t('admin_dash.users.delete_user') }}
              </button>
            </li>
          </ul>
        </div>
        <div v-if="!timeline_expanded">
          <button
            class="button button-default btn"
            type="button"
            @click="timeline_expanded = true"
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
            @click="timeline_expanded = false"
          >
            {{ $t('admin_dash.users.collapse_timeline') }}
          </button>
          <PageList
            ref="timelineList"
            :refresh="true"
            :get-key="i => i"
            :box_only="true"
            :page_size="20"
            :single_page="true"
            :fetch_page="(store, opts) => fetch_statuses(store, opts)"
          >
            <template #header>
              <button
                class="button button-default btn"
                type="button"
                @click="delete_selection"
              >
                {{ $t('admin_dash.users.delete') }}
              </button>
            </template>
            <template #item="{item}">
              <AdminStatusCard :status_details="item" />
            </template>
            <template #empty>
              <p> {{ $t('admin_dash.users.user_has_no_posts') }} </p>
            </template>
            <template #load>
              <p> {{ $t('admin_dash.users.loading') }} </p>
            </template>
          </PageList>
        </div>
        <div v-if="!json_expanded">
          <button
            class="button button-default btn"
            type="button"
            @click="json_expanded = true"
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
            @click="json_expanded = false"
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
