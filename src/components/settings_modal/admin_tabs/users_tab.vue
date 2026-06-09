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
        <Checkbox v-model="filtersUnconfirmed">
          {{ $t('admin_dash.users.options.only_unconfirmed') }}
        </Checkbox>
      </div>
    </div>
    <List
      ref="usersList"
      :fetch-function="fetchUsers"
      @select="onSelect"
      selectable
      scrollable
    >
      <template #header="{selected}">
        <ModerationTools :users="selected" />
      </template>
      <template #item="{item}">
        <AdminCard :user-id="item.id" />
      </template>
      <template #load>
        <span> loading </span>
      </template>
      <template #empty>
        <span> no users </span>
      </template>
    </List>
  </div>
</template>
<script src="./users_tab.js"></script>
<style lang="scss" src="./users_tab.scss"></style>
