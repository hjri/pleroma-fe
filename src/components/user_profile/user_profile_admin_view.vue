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
        class="godmode"
      >
        {{ $t('admin_dash.users.godmode') }}
      </Checkbox>
    </div>
    <List
      ref="list"
      :fetch-function="fetchStatuses"
      scrollable
      @select="onSelect"
    >
      <template #item="{item}">
        <Status :statusoid="item" />
      </template>
    </List>
  </div>
</template>

<script src="./user_profile_admin_view.js"></script>

<style src="./user_profile.scss" lang="scss"></style>
