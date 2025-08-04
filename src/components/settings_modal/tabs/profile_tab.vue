<template>
  <div class="profile-tab">
    <UserCard
      :user-id="user.id"
      :editable="true"
      :switcher="false"
      rounded="top"
    >
      <template v-if="role === 'admin' || role === 'moderator'">
      <h4>{{ $t('settings.show_labels') }}</h4>
      <p class="user-card-setting">
        <Checkbox v-model="showRole">
          <template v-if="role === 'admin'">
            {{ $t('settings.show_admin_badge') }}
          </template>
          <template v-if="role === 'moderator'">
            {{ $t('settings.show_moderator_badge') }}
          </template>
        </Checkbox>
      </p>
      </template>
      <h4>{{ $t('settings.user_type') }}</h4>
      <p class="user-card-setting">
        <label>
          {{ $t('settings.actor_type') }}
          <Select v-model="actorType">
            <option
              v-for="option in availableActorTypes"
              :key="option"
              :value="option"
            >
              {{ $t('settings.actor_type_' + option) }}
            </option>
          </Select>
          <div v-if="groupActorAvailable">
            <small>
              {{ $t('settings.actor_type_description') }}
            </small>
          </div>
        </label>
      </p>
    </UserCard>
    <div class="setting-item">
      <p>
        <interface-language-switcher
          :prompt-text="$t('settings.email_language')"
          :language="emailLanguage"
          :set-language="val => emailLanguage = val"
        />
      </p>
      <button
        :disabled="newName && newName.length === 0"
        class="btn button-default"
        @click="updateProfile"
      >
        {{ $t('settings.save') }}
      </button>
    </div>
    <div class="setting-item">
      <h2>{{ $t('settings.profile_background') }}</h2>
      <div class="banner-background-preview">
        <img :src="user.background_image">
        <button
          v-if="!isDefaultBackground"
          class="button-unstyled reset-button"
          :title="$t('settings.reset_profile_background')"
          @click="resetBackground"
        >
          <FAIcon
            icon="times"
            type="button"
          />
        </button>
      </div>
      <p>{{ $t('settings.set_new_profile_background') }}</p>
      <img
        v-if="backgroundPreview"
        class="banner-background-preview"
        :src="backgroundPreview"
      >
      <div>
        <input
          type="file"
          class="input"
          @change="uploadFile('background', $event)"
        >
      </div>
      <FAIcon
        v-if="backgroundUploading"
        class="uploading"
        spin
        icon="circle-notch"
      />
      <button
        v-else-if="backgroundPreview"
        class="btn button-default"
        @click="submitBackground(background)"
      >
        {{ $t('settings.save') }}
      </button>
    </div>
    <div class="setting-item">
      <h2>{{ $t('settings.account_privacy') }}</h2>
      <ul class="setting-list">
        <li>
          <BooleanSetting
            source="profile"
            path="locked"
          >
            {{ $t('settings.lock_account_description') }}
          </BooleanSetting>
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
