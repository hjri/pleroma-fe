<template>
  <div class="profile-tab">
    <div class="setting-item profile-edit">
      <h2>{{ $t('settings.account_profile_edit') }}</h2>
      <UserCard
        :user-id="user.id"
        :editable="true"
        :switcher="false"
        rounded="top"
        >
      </UserCard>
    </div>
    <div class="setting-item">
      <h2>{{ $t('settings.account_privacy') }}</h2>
      <ul class="setting-list">
        <li>
          <Checkbox v-model="locked">
            {{ $t('settings.lock_account_description') }}
          </Checkbox>
          <ProfileSettingIndicator :is-profile="true" />
        </li>
        <li>
          <BooleanSetting
            source="profile"
            path="discoverable"
          >
            {{ $t('settings.discoverable') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting
            source="profile"
            path="allowFollowingMove"
          >
            {{ $t('settings.allow_following_move') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting
            source="profile"
            path="hideFavorites"
          >
            {{ $t('settings.hide_favorites_description') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting
            source="profile"
            path="hideFollowers"
          >
            {{ $t('settings.hide_followers_description') }}
          </BooleanSetting>
          <ul class="setting-list suboptions">
            <li>
              <BooleanSetting
                source="profile"
                path="hideFollowersCount"
                parent-path="hideFollowers"
              >
                {{ $t('settings.hide_followers_count_description') }}
              </BooleanSetting>
            </li>
          </ul>
        </li>
        <li>
          <BooleanSetting
            source="profile"
            path="hideFollows"
          >
            {{ $t('settings.hide_follows_description') }}
          </BooleanSetting>
          <ul class="setting-list suboptions">
            <li>
              <BooleanSetting
                source="profile"
                path="hideFollowsCount"
                parent-path="hideFollows"
              >
                {{ $t('settings.hide_follows_count_description') }}
              </BooleanSetting>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./profile_tab.js"></script>
<style lang="scss" src="./profile_tab.scss"></style>
