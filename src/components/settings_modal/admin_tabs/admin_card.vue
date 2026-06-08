<template>
  <template v-if="!user">
    <FAIcon
      icon="circle-notch"
      spin
      size="lg"
    />
  </template>
  <template v-else>
    <BasicUserCard
      class="AdminCard"
      :user="user"
    >
      <div class="right-side">
        <label
          v-if="isAdmin"
          class="alert neutral user-role"
        >
          {{ $t('admin_dash.users.indicator.admin') }}
        </label>
        <label
          v-if="isModerator"
          class="alert neutral user-role"
        >
          {{ $t('admin_dash.users.indicator.moderator') }}
        </label>
        <label
          v-if="isActivated"
          class="alert info user-role"
        >
          {{ $t('admin_dash.users.indicator.active') }}
        </label>
        <label
          v-if="!isActivated"
          class="alert error user-role"
        >
          {{ $t('admin_dash.users.indicator.deactivated') }}
        </label>
        <label
          v-if="isConfirmed"
          class="alert neutral user-role"
        >
          {{ $t('admin_dash.users.indicator.confirmed') }}
        </label>
        <ModerationTools
          class="moderation-menu"
          :user="user"
        />
      </div>
    </BasicUserCard>
  </template>
</template>

<script src="./admin_card.js"></script>

<style lang="scss" src="./admin_card.scss"></style>
