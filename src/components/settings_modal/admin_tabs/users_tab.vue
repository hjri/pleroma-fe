<template>
  <div :label="$t('admin_dash.users.management')">
    <div class="setting-item">
      <h2> {{ $t('admin_dash.users.title_filter_user_search') }} </h2>
      <ul
        class="setting-list"
      >
        <li>
          <input
            v-model="filters_query"
            :placeholder="$t('admin_dash.users.placeholder_query')"
            class="input string-input"
            @input="reset()"
          >
        </li>
        <li>
          <input
            v-model="filters_name"
            :placeholder="$t('admin_dash.users.placeholder_name')"
            class="input string-input"
            @input="reset()"
          >
        </li>
        <li>
          <input
            v-model="filters_email"
            :placeholder="$t('admin_dash.users.placeholder_email')"
            class="input string-input"
            @input="reset()"
          >
        </li>
        <li>
          <Select
            v-model="filters_origin"
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
        </li>
        <li>
          <Select
            v-model="filters_activity"
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
        </li>
        <li>
          <Select
            v-model="filters_permission"
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
            @update:model-value="v => {filters.need_approval = v; reset();}"
          >
            {{ $t('admin_dash.users.only_unapproved') }}
          </Checkbox>
        </li>
        <li>
          <Checkbox
            @update:model-value="v => {filters.unconfirmed = v; reset();}"
          >
            {{ $t('admin_dash.users.only_unconfirmed') }}
          </Checkbox>
        </li>
        <li>
          <button
            class="button button-default btn"
            type="button"
            @click="reset"
          >
            {{ $t('admin_dash.users.refresh') }}
          </button>
        </li>
      </ul>
    </div>
    <div
      class="setting-item"
    >
      <h2> {{ $t('admin_dash.users.title_users') }} </h2>
      <PageList
        ref="userList"
        :refresh="true"
        :get-key="i => i"
        :box_only="true"
        :page_size="20"
        :fetch_page="(store, opts) => fetch_page(store, opts)"
      >
        <template #header>
          <button
            class="button button-default btn"
            type="button"
            @click="activate_selection"
          >
            {{ $t('admin_dash.users.activate') }}
          </button>
          <button
            class="button button-default btn"
            type="button"
            @click="deactivate_selection"
          >
            {{ $t('admin_dash.users.deactivate') }}
          </button>
          <button
            class="button button-default btn"
            type="button"
            @click="delete_selection"
          >
            {{ $t('admin_dash.users.delete') }}
          </button>
        </template>
        <template #item="{item}">
          <AdminCard :user_details="item" />
        </template>
      </PageList>
    </div>
  </div>
</template>
<script src="./users_tab.js"></script>
<style lang="scss" src="./users_tab.scss"></style>
