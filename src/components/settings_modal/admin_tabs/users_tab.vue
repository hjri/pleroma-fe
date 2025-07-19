<template>
  <div :label="$t('admin_dash.tabs.users')">
    <Checkbox
      :model-value="filters[local]"
      @update:model-value="v => {filters.local = v; reset();}"
    >
      only local
    </Checkbox><br>
    <Checkbox
      :model-value="filters[external]"
      @update:model-value="v => {filters.external = v; reset();}"
    >
      only external
    </Checkbox><br>
    <Checkbox
      :model-value="filters[active]"
      @update:model-value="v => {filters.active = v; reset();}"
    >
      only active
    </Checkbox><br>
    <Checkbox
      :model-value="filters[need_approval]"
      @update:model-value="v => {filters.need_approval = v; reset();}"
    >
      only unconfirmed
    </Checkbox><br>
    <Checkbox
      :model-value="filters[deactivated]"
      @update:model-value="v => {filters.deactivated = v; reset();}"
    >
      only deactivated
    </Checkbox><br>
    <Checkbox
      :model-value="filters[is_admin]"
      @update:model-value="v => {filters.is_admin = v; reset();}"
    >
      only if admin
    </Checkbox><br>
    <Checkbox
      :model-value="filters[is_moderator]"
      @update:model-value="v => {filters.is_moderator = v; reset();}"
    >
      only if moderator
    </Checkbox><br>
    <button
      class="button button-default btn"
      type="button"
      @click="delete_selection"
    >
      {{ $t('admin_dash.users.activate') }}
    </button>
    <button
      class="button button-default btn"
      type="button"
      @click="activate_selection"
    >
      {{ $t('admin_dash.users.deactivate') }}
    </button>
    <button
      class="button button-default btn"
      type="button"
      @click="deactivate_selection"
    >
      {{ $t('admin_dash.users.delete') }}
    </button>
    <PageList
      ref="userList"
      :refresh="true"
      :get-key="i => i"
      :box-only="true"
      :page-size="50"
      :fetch-page="(store, opts) => this.fetch_page(store, opts)"
    >
      <template #item="{item}">
        <AdminCard :user-id="item.id" />
        <button
          class="button button-default btn"
          type="button"
          @click="delete_user"
        >
          {{ $t('admin_dash.users.activate') }}
        </button>
        <button
          class="button button-default btn"
          type="button"
          @click="activate_user"
        >
          {{ $t('admin_dash.users.deactivate') }}
        </button>
        <button
          class="button button-default btn"
          type="button"
          @click="deactivate_user"
        >
          {{ $t('admin_dash.users.delete') }}
        </button>
      </template>
    </PageList>
  </div>
</template>
<script src="./users_tab.js"></script>
