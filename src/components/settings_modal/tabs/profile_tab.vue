<template>
  <div class="profile-tab">
    <div class="setting-item">
      <UserCard
        :user-id="user.id"
        :editable="true"
        :switcher="false"
        rounded="top"
      />
      <p v-if="role === 'admin' || role === 'moderator'">
        <Checkbox v-model="showRole">
          <template v-if="role === 'admin'">
            {{ $t('settings.show_admin_badge') }}
          </template>
          <template v-if="role === 'moderator'">
            {{ $t('settings.show_moderator_badge') }}
          </template>
        </Checkbox>
      </p>
      <p>
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
        </label>
      </p>
      <div v-if="groupActorAvailable">
        <small>
          {{ $t('settings.actor_type_description') }}
        </small>
      </div>
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
      <h2>{{ $t('settings.avatar') }}</h2>
      <p class="visibility-notice">
        {{ $t('settings.avatar_size_instruction') }}
      </p>
      <div class="current-avatar-container">
        <img
          :src="user.profile_image_url_original"
          class="current-avatar"
        >
        <button
          v-if="!isDefaultAvatar && pickAvatarBtnVisible"
          :title="$t('settings.reset_avatar')"
          class="button-unstyled reset-button"
          @click="resetAvatar"
        >
          <FAIcon
            icon="times"
            type="button"
          />
        </button>
      </div>
      <p>{{ $t('settings.set_new_avatar') }}</p>
      <button
        v-show="pickAvatarBtnVisible"
        id="pick-avatar"
        class="button-default btn"
        type="button"
      >
        {{ $t('settings.upload_a_photo') }}
      </button>
      <image-cropper
        trigger="#pick-avatar"
        :submit-handler="submitAvatar"
        @open="pickAvatarBtnVisible=false"
        @close="pickAvatarBtnVisible=true"
      />
    </div>
    <div class="setting-item">
      <h2>{{ $t('settings.profile_banner') }}</h2>
      <div class="banner-background-preview">
        <img :src="user.cover_photo">
        <button
          v-if="!isDefaultBanner"
          class="button-unstyled reset-button"
          :title="$t('settings.reset_profile_banner')"
          @click="resetBanner"
        >
          <FAIcon
            icon="times"
            type="button"
          />
        </button>
      </div>
      <p>{{ $t('settings.set_new_profile_banner') }}</p>
      <img
        v-if="bannerPreview"
        class="banner-background-preview"
        :src="bannerPreview"
      >
      <div>
        <input
          type="file"
          class="input"
          @change="uploadFile('banner', $event)"
        >
      </div>
      <FAIcon
        v-if="bannerUploading"
        class="uploading"
        spin
        icon="circle-notch"
      />
      <button
        v-else-if="bannerPreview"
        class="btn button-default"
        @click="submitBanner(banner)"
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
