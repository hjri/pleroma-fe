<template>
  <div
    v-if="user"
    class="user-profile panel panel-default"
  >
    <div class="panel-body card-wrapper">
      <UserCard
        :user-id="userId"
        :compact="compactProfiles"
        avatar-action="zoom"
        :hide-bio="true"
      />
    </div>
    <List
      :fetch-function="fetchStatuses"
      @select="onSelect"
      scrollable
    >
      <template #item="{item}">
        <Conversation
          :user="item"
        />
      </template>
    </List>
  </div>
</template>

<script src="./user_profile_admin_view.js"></script>

<style src="./user_profile.scss" lang="scss"></style>
