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
      show-line-labels
    >
      <div>
        <strong>
          {{ $t('admin_dash.users.labels.email_colon') }}
        </strong>
        {{ ' ' }}
        <template v-if="user.adminData.email == null">
          {{ $t('general.not_available') }}
        </template>
        <a :href="'mailto:' + user.adminData.email">
          {{ user.adminData.email }}
        </a>
      </div>
      <details
        v-if="user.adminData.registration_reason != null"
        open
      >
        <summary>
          {{ $t('user_card.admin_data.registration_reason') }}
        </summary>
        <span>
          {{  user.adminData.registration_reason }}
        </span>
      </details>
      <div class="right-side">
        <label
          v-if="user.is_local && isAdmin"
          class="alert neutral user-role"
        >
          {{ $t('admin_dash.users.indicator.admin') }}
        </label>
        <label
          v-if="user.is_local && isModerator"
          class="alert neutral user-role"
        >
          {{ $t('admin_dash.users.indicator.moderator') }}
        </label>
        <label
          v-if="isActivated"
          class="alert success user-role"
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
          v-if="user.is_local && user.adminData.is_confirmed"
          class="alert success user-role"
        >
          {{ $t('admin_dash.users.indicator.confirmed') }}
        </label>
        <label
          v-if="user.is_local && !user.adminData.is_confirmed"
          class="alert warning user-role"
        >
          {{ $t('admin_dash.users.indicator.unconfirmed') }}
        </label>
        <label
          v-if="user.is_local && user.adminData.is_approved"
          class="alert success user-role"
        >
          {{ $t('admin_dash.users.indicator.approved') }}
        </label>
        <label
          v-if="user.is_local && !user.adminData.is_approved"
          class="alert warning user-role"
        >
          {{ $t('admin_dash.users.indicator.unapproved') }}
        </label>
        <label
          v-if="user.adminData.is_suggested"
          class="alert info user-role"
        >
          {{ $t('admin_dash.users.indicator.suggested') }}
        </label>
        <ModerationTools
          class="moderation-menu"
          :users="[user]"
        />
      </div>
    </BasicUserCard>
  </template>
</template>

<script src="./admin_card.js"></script>

<style lang="scss" src="./admin_card.scss"></style>
