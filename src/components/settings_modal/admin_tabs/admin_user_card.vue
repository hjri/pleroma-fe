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
      class="AdminUserCard"
      :user="user"
      show-line-labels
    >
      <div>
        <strong>
          {{ $t('admin_dash.users.labels.email_colon') }}
        </strong>
        {{ ' ' }}
        <span
          v-if="user.adminData.email == null"
          class="faint"
        >
          {{ $t('general.not_available') }}
        </span>
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
          {{ user.adminData.registration_reason }}
        </span>
      </details>
      <div class="right-side">
        <span
          v-if="user.is_local && isAdmin"
          class="alert neutral user-role"
        >
          {{ $t('admin_dash.users.indicator.admin') }}
        </span>
        <span
          v-if="user.is_local && isModerator"
          class="alert neutral user-role"
        >
          {{ $t('admin_dash.users.indicator.moderator') }}
        </span>
        <span
          v-if="isActivated"
          class="alert success user-role"
        >
          {{ $t('admin_dash.users.indicator.active') }}
        </span>
        <span
          v-if="!isActivated"
          class="alert error user-role"
        >
          {{ $t('admin_dash.users.indicator.deactivated') }}
        </span>
        <span
          v-if="user.is_local && user.adminData.is_confirmed"
          class="alert success user-role"
        >
          {{ $t('admin_dash.users.indicator.confirmed') }}
        </span>
        <span
          v-if="user.is_local && !user.adminData.is_confirmed"
          class="alert warning user-role"
        >
          {{ $t('admin_dash.users.indicator.unconfirmed') }}
        </span>
        <span
          v-if="user.is_local && user.adminData.is_approved"
          class="alert success user-role"
        >
          {{ $t('admin_dash.users.indicator.approved') }}
        </span>
        <span
          v-if="user.is_local && !user.adminData.is_approved"
          class="alert warning user-role"
        >
          {{ $t('admin_dash.users.indicator.unapproved') }}
        </span>
        <span
          v-if="user.adminData.is_suggested"
          class="alert info user-role"
        >
          {{ $t('admin_dash.users.indicator.suggested') }}
        </span>
        <ModerationTools
          class="moderation-menu"
          :users="[user]"
        />
      </div>
    </BasicUserCard>
  </template>
</template>

<script src="./admin_user_card.js"></script>

<style lang="scss" src="./admin_user_card.scss"></style>
