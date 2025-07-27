<template>
  <div :label="$t('admin_dash.users.management')">
    <div class="setting-item">
      <h2> filter user search </h2>
      <input
        v-model="filters_query"
        :placeholder="$t('admin_dash.users.placeholder_query')"
        class="input string-input"
        @input="v => update_query(v.target.value)"
      ><br>
      <input
        v-model="filters_name"
        :placeholder="$t('admin_dash.users.placeholder_name')"
        class="input string-input"
        @input="v => update_name(v.target.value)"
      ><br>
      <input
        v-model="filters_email"
        :placeholder="$t('admin_dash.users.placeholder_email')"
        class="input string-input"
        @input="v => update_email(v.target.value)"
      ><br>
      <Select
        :model-value="filters_origin"
        @update:model-value="v => update_origin(v)"
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
      <Select
        :model-value="filters_activity"
        @update:model-value="v => update_activity(v)"
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
      <Select
        :model-value="filters_permission"
        @update:model-value="v => update_permission(v)"
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
      <Checkbox
        @update:model-value="v => {filters.need_approval = v; reset();}"
      >
        {{ $t('admin_dash.users.only_unapproved') }}
      </Checkbox>
      <Checkbox
        @update:model-value="v => {filters.unconfirmed = v; reset();}"
      >
        {{ $t('admin_dash.users.only_unconfirmed') }}
      </Checkbox><br>
      <button
        class="button button-default btn"
        type="button"
        @click="reset"
      >
        {{ $t('admin_dash.users.refresh') }}
      </button>
    </div>
    <PageList
      ref="userList"
      :refresh="true"
      :get-key="i => i"
      :box-only="true"
      :page-size="50"
      :fetch-page="(store, opts) => fetch_page(store, opts)"
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
        <AdminCard :user-details="item" />
      </template>
    </PageList>
  </div>
</template>
<script src="./users_tab.js"></script>
<style lang="scss" src="./users_tab.scss"></style>
