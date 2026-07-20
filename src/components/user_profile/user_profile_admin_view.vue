<template>
  <div
    v-if="user"
    class="user-profile -admin-view panel panel-default"
  >
    <div class="panel-body card-wrapper">
      <UserCard
        :user-id="userId"
        :compact="true"
        hide-bio
        hide-buttons
      />
      <Checkbox
        v-model="godmode"
        class="filter"
      >
        {{ $t('admin_dash.users.filters.show_direct') }}
      </Checkbox>
      <Checkbox
        v-model="showReblogs"
        class="filter"
      >
        {{ $t('admin_dash.users.filters.show_reblogs') }}
      </Checkbox>
    </div>
    <List
      ref="list"
      :fetch-function="fetchStatuses"
      scrollable
    >
      <template #item="{item}">
        <Status
          :statusoid="item"
          :in-conversation="false"
          :focused="false"
          ignore-mute
        />
      </template>
    </List>
  </div>
</template>

<script src="./user_profile_admin_view.js"></script>

<style src="./user_profile.scss" lang="scss"></style>
