<template>
  <div
    v-if="user"
    class="user-profile -admin-view panel panel-default"
  >
    <div class="panel-body card-wrapper">
      <UserCard
        :user-id="userId"
        :compact="true"
        avatar-action="zoom"
        hide-bio
        hide-buttons
      />
    </div>
    <List
      :fetch-function="fetchStatuses"
      @select="onSelect"
      scrollable
    >
      <template #item="{item}">
        <Status
          :statusoid="item"
        />
      </template>
    </List>
  </div>
</template>

<script src="./user_profile_admin_view.js"></script>

<style src="./user_profile.scss" lang="scss"></style>
