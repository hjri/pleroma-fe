<template>
  <div>
    <div
      v-if="user"
      class="user-profile panel panel-default"
    >
      <div class="panel-body card-wrapper">
        <UserCard
          :user-id="userId"
          :switcher="true"
          :compact="compactProfiles"
          avatar-action="zoom"
          :has-note-editor="true"
        />
      </div>
      <tab-switcher
        v-if="userId"
        :active-tab="tab"
        :render-only-focused="true"
        :on-switch="onTabSwitch"
      >
        <div
          key="statuses"
          class="statuses"
          :label="$t('user_card.statuses')"
          :title="$t('user_profile.timeline_title')"
        >
          <Timeline
            key="statuses"
            :timeline-ref="{ name: 'userPinned', argument: userId }"
            embedded
            in-profile
            hide-empty
          />
          <Timeline
            :timeline-ref="{ name: 'user', argument: userId }"
            embedded
            in-profile
            skip-pinned
            :footer-slipgate="footerRef"
          />
        </div>
        <div
          v-if="followsTabVisible && user"
          key="followees"
          class="panel-body"
          :label="$t('user_card.followees')"
          :disabled="!user.friends_count"
        >
          <List
            :fetch-function="fetchUsers('Friends')"
            :external-items="friends"
          >
            <template #item="{item}">
              <FollowCard :user="item" />
            </template>
          </List>
        </div>
        <div
          v-if="followersTabVisible && user"
          key="followers"
          class="panel-body"
          :label="$t('user_card.followers')"
          :disabled="!user.followers_count"
        >
          <List
            :fetch-function="fetchUsers('Followers')"
            :external-items="followers"
          >
            <template #item="{item}">
              <FollowCard
                :user="item"
                :no-follows-you="isUs"
              />
            </template>
          </List>
        </div>
        <Timeline
          key="media"
          :label="$t('user_card.media')"
          :title="$t('user_card.media')"
          :timeline-ref="{ name: 'media', argument: userId }"
          embedded
          in-profile
          :footer-slipgate="footerRef"
        />
        <Timeline
          v-if="favoritesTabVisible"
          key="favorites"
          :label="$t('user_card.favorites')"
          :title="$t('user_card.favorites')"
          :timeline-ref="{ name: 'favorites', argument: userId }"
          :argument="isUs ? undefined : userId"
          embedded
          in-profile
          :footer-slipgate="footerRef"
        />
      </tab-switcher>
      <div
        :ref="setFooterRef"
        class="panel-footer"
      />
    </div>
    <div
      v-else
      class="panel user-profile-placeholder"
    >
      <div class="panel-heading">
        <h1 class="title">
          {{ $t('settings.profile_tab') }}
        </h1>
      </div>
      <div class="panel-body">
        <div
          v-if="error"
          class="alert error"
        >
          <span class="error-message">{{ error }}</span>
        </div>
        <FAIcon
          v-else
          spin
          icon="circle-notch"
        />
      </div>
    </div>
  </div>
</template>

<script src="./user_profile.js"></script>

<style src="./user_profile.scss" lang="scss"></style>
