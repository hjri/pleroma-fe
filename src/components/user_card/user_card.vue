<template>
  <div
    class="user-card"
    :class="classes"
  >
    <div
      :class="onClose ? '' : 'panel-heading -flexible-height'"
      class="user-card-inner"
    >
      <div class="user-info">
        <div class="user-identity">
          <div
            :class="{ 'hide-bio': hideBio }"
            :style="style"
            class="background-image"
          />
          <a
            v-if="avatarAction === 'zoom'"
            class="user-info-avatar -link"
            @click="zoomAvatar"
          >
            <UserAvatar
              :user="user"
              :url="avatarImgSrc"
            />
            <div class="user-info-avatar -link -overlay">
              <FAIcon
                class="fa-scale-110 fa-old-padding"
                icon="search-plus"
              />
            </div>
          </a>
          <button
            v-else-if="editable"
            class="user-info-avatar button-unstyled -link"
            :class="{ '-editable': editable }"
            @click="changeAvatar"
          >
            <UserAvatar :user="user" />
            <div class="user-info-avatar -link -overlay">
              <FAIcon
                class="fa-scale-110 fa-old-padding"
                icon="pencil"
              />
            </div>
          </button>
          <UserAvatar
            v-else-if="typeof avatarAction === 'function'"
            class="user-info-avatar"
            :user="user"
            @click="avatarAction"
          />
          <router-link
            v-else
            class="user-info-avatar"
            :to="userProfileLink(user)"
          >
            <UserAvatar :user="user" />
          </router-link>
          <div class="user-summary">
            <div class="top-line">
              <div
                class="other-actions"
              >
                <button
                  v-if="editable"
                  :disabled="newName && newName.length === 0"
                  class="btn button-unstyled edit-banner-button"
                  @click="changeBanner"
                >
                  {{ $t('settings.change_banner') }}
                  <FAIcon
                    fixed-width
                    class="icon"
                    icon="pencil"
                    :title="$t('user_card.change_banner')"
                  />
                </button>
                <button
                  v-if="editable"
                  :disabled="somethingToSave"
                  class="btn button-unstyled reset-profile-button"
                  @click="resetNews"
                >
                  {{ $t('settings.reset') }}
                  <FAIcon
                    fixed-width
                    class="icon"
                    icon="clock-rotate-left"
                    :title="$t('user_card.edit_profile')"
                  />
                </button>
                <button
                  v-if="editable"
                  :disabled="somethingToSave"
                  class="btn button-unstyled save-profile-button"
                  @click="updateProfile"
                >
                  {{ $t('settings.save') }}
                  <FAIcon
                    fixed-width
                    class="icon"
                    icon="save"
                    :title="$t('user_card.edit_profile')"
                  />
                </button>
                <button
                  v-else-if="!editable && !isOtherUser && user.is_local"
                  class="button-unstyled edit-profile-button"
                  @click.stop="openProfileTab"
                >
                  <FAIcon
                    fixed-width
                    class="icon"
                    icon="edit"
                    :title="$t('user_card.edit_profile')"
                  />
                </button>
                <a
                  v-if="isOtherUser && !user.is_local"
                  :href="user.statusnet_profile_url"
                  target="_blank"
                  class="button-unstyled external-link-button"
                >
                  <FAIcon
                    class="icon"
                    icon="external-link-alt"
                  />
                </a>
                <AccountActions
                  v-if="isOtherUser && loggedIn"
                  :user="user"
                  :relationship="relationship"
                />
                <router-link
                  v-if="onClose"
                  :to="userProfileLink(user)"
                  class="button-unstyled external-link-button"
                  @click="onClose"
                >
                  <FAIcon
                    class="icon"
                    icon="expand-alt"
                  />
                </router-link>
                <button
                  v-if="onClose"
                  class="button-unstyled external-link-button"
                  @click="onClose"
                >
                  <FAIcon
                    class="icon"
                    icon="times"
                  />
                </button>
              </div>
              <div class="name-wrapper">
                <router-link
                  v-if="!editable || !editingName"
                  :to="userProfileLink(user)"
                  class="user-name"
                >
                  <RichContent
                    :title="editable ? newName : user.name_unescaped"
                    :html="editable ? newName : user.name_unescaped"
                    :emoji="editable ? emoji : user.emoji"
                  />
                </router-link>
                <EmojiInput
                  v-else-if="editingName"
                  v-model="newName"
                  enable-emoji-picker
                  :suggest="emojiSuggestor"
                >
                  <template #default="inputProps">
                    <input
                      id="username"
                      v-model="newName"
                      class="input name-changer"
                      v-bind="propsToNative(inputProps)"
                    >
                  </template>
                </EmojiInput>
                <button
                  v-if="editable"
                  class="button-unstyled edit-button"
                  @click="editingName = !editingName"
                  :title="$t('settings.toggle_edit')"
                >
                  <FAIcon
                    class="icon"
                    icon="pencil"
                  />
                </button>
              </div>
            </div>
            <div class="bottom-line">
              <user-link
                class="user-screen-name"
                :user="user"
              />
              <span
                v-if="user.locked"
                class="lock-icon"
              >
                <FAIcon
                  icon="lock"
                  size="sm"
                />
              </span>
              <span
                v-if="relationship.followed_by && loggedIn && isOtherUser"
                class="alert neutral user-role"
              >
                {{ $t('user_card.follows_you') }}
              </span>
              <template v-if="!hideBio">
                <span
                  v-if="user.deactivated"
                  class="alert neutral user-role"
                >
                  {{ $t('user_card.deactivated') }}
                </span>
                <span
                  v-if="!!visibleRole"
                  class="alert neutral user-role"
                >
                  {{ $t(`general.role.${visibleRole}`) }}
                </span>
                <span
                  v-if="user.actor_type === 'Service'"
                  class="alert neutral user-role"
                >
                  {{ $t('user_card.bot') }}
                </span>
                <span
                  v-if="user.actor_type === 'Group'"
                  class="alert user-role"
                >
                  {{ $t('user_card.group') }}
                </span>
                <span
                  v-if="relationship.muting && muteExpiryAvailable"
                  class="alert neutral user-role"
                >
                  {{ muteExpiry }}
                </span>
                <span
                  v-if="relationship.blocking && blockExpiryAvailable"
                  class="alert neutral user-role"
                >
                  {{ blockExpiry }}
                </span>
              </template>
            </div>
          </div>
        </div>
        <div
          v-if="!editable && loggedIn && isOtherUser"
          class="user-interactions"
        >
          <div class="btn-group">
            <FollowButton
              :relationship="relationship"
              :user="user"
            />
            <template v-if="relationship.following">
              <ProgressButton
                v-if="!relationship.notifying"
                class="btn button-default"
                :click="subscribeUser"
                :title="$t('user_card.subscribe')"
              >
                <FAIcon icon="bell" />
              </ProgressButton>
              <ProgressButton
                v-else
                class="btn button-default toggled"
                :click="unsubscribeUser"
                :title="$t('user_card.unsubscribe')"
              >
                <FALayers>
                  <FAIcon
                    icon="rss"
                    transform="left-5 shrink-6 up-3 rotate-20"
                    flip="horizontal"
                  />
                  <FAIcon
                    icon="rss"
                    transform="right-5 shrink-6 up-3 rotate-20"
                  />
                  <FAIcon icon="bell" />
                </FALayers>
              </ProgressButton>
            </template>
          </div>
          <button
            v-if="relationship.muting"
            class="btn button-default btn-mute toggled"
            :disabled="user.deactivated"
            @click="unmuteUser"
          >
            {{ $t('user_card.muted') }}
          </button>
          <button
            v-else
            class="btn button-default btn-mute"
            :disabled="user.deactivated"
            @click="muteUser"
          >
            {{ $t('user_card.mute') }}
          </button>
          <button
            class="btn button-default btn-mention"
            :disabled="user.deactivated"
            @click="mentionUser"
          >
            {{ $t('user_card.mention') }}
          </button>
          <ModerationTools
            v-if="showModerationMenu"
            class="moderation-menu"
            :user="user"
          />
        </div>
        <div
          v-if="!loggedIn && user.is_local"
          class="user-interactions"
        >
          <RemoteFollow :user="user" />
        </div>
      </div>
    </div>
    <slot />
    <div
      v-if="!editable && loggedIn && isOtherUser && (hasNote || !hideBio) && !mergedConfig.userCardHidePersonalMarks"
      class="personal-marks"
    >
      <UserNote
        v-if="hasNote || (hasNoteEditor && supportsNote)"
        :user="user"
        :relationship="relationship"
        :editable="hasNoteEditor"
      />
      <div
        v-if="!hideBio"
        class="highlighter"
      >
        <h4>{{ $t('user_card.highlight_header') }}</h4>
        <Select
          :id="'userHighlightSel'+user.id"
          v-model="userHighlightType"
          class="userHighlightSel unstyled"
          :class="{ '-none': userHighlightType === 'disabled' }"
        >
          <option value="disabled">
            {{ $t('user_card.highlight_new.disabled') }}
          </option>
          <option value="solid">
            {{ $t('user_card.highlight_new.solid') }}
          </option>
          <option value="striped">
            {{ $t('user_card.highlight_new.striped') }}
          </option>
          <option value="side">
            {{ $t('user_card.highlight_new.side') }}
          </option>
        </Select>
        <!-- id's need to be unique, otherwise vue confuses which user-card checkbox belongs to -->
        <ColorInput
          v-if="userHighlightType !== 'disabled'"
          v-model="userHighlightColor"
          class="highlighter-color"
          :show-optional-checkbox="false"
          name="'userHighlightColorTx'+user.id"
          :unstyled="true"
        />
      </div>
    </div>
    <h4 v-if="editable">
      <span>
        {{ $t('settings.bio') }}
      </span>
      <button
        class="button-default"
        @click="editingBio = !editingBio"
      >
        {{ $t('settings.toggle_edit') }}
        <FAIcon
          class="fa-scale-110 fa-old-padding"
          icon="pencil"
        />
      </button>
    </h4>
    <template v-if="!editable || !editingBio">
      <RichContent
        v-if="!hideBio"
        class="user-card-bio"
        :class="{ '-justify-left': mergedConfig.userCardLeftJustify }"
        :html="editable ? newBio.replace(/\n/g, '<br>') : user.description_html"
        :emoji="editable ? emoji : user.emoji"
        :handle-links="true"
      />
    </template>
    <template v-else-if="editingBio">
      <EmojiInput
        v-model="newBio"
        enable-emoji-picker
        class="user-card-bio"
        :class="{ '-justify-left': mergedConfig.userCardLeftJustify }"
        :suggest="emojiUserSuggestor"
      >
        <template #default="inputProps">
          <textarea
            v-model="newBio"
            class="input bio resize-height"
            v-bind="propsToNative(inputProps)"
            :rows="newBio.split(/\n/g).length"
          />
        </template>
      </EmojiInput>
    </template>
    <h4 v-if="editable">
      <span>
        {{ $t('settings.profile_fields.label') }}
      </span>
      <button
        class="button-default"
        @click="editingFields = !editingFields"
      >
        {{ $t('settings.toggle_edit') }}
        <FAIcon
          class="fa-scale-110 fa-old-padding"
          icon="pencil"
        />
      </button>
    </h4>
    <template v-if="!editable || !editingFields">
      <div
        v-if="!hideBio && user.fields_html && user.fields_html.length > 0"
        class="user-profile-fields"
      >
        <dl
          v-for="(field, index) in (editable ? newFields : user.fields_html)"
          :key="index"
          class="user-profile-field"
        >
          <dt
            :title="field.name"
            class="user-profile-field-name"
          >
            <RichContent
              :html="field.name"
              :emoji="editable ? emoji : user.emoji"
            />
          </dt>
          <dd
            :title="field.value"
            class="user-profile-field-value"
          >
            <RichContent
              :html="field.value"
              :emoji="editable ? emoji : user.emoji"
            />
          </dd>
        </dl>
      </div>
    </template>
    <template v-else-if="editingFields">
      <div
        v-if="maxFields > 0"
        class="user-profile-fields"
      >
        <dl
          v-for="(_, i) in newFields"
          :key="i"
          class="user-profile-field"
        >
          <dt
            class="user-profile-field-name -edit"
          >
            <EmojiInput
              v-model="newFields[i].name"
              enable-emoji-picker
              :suggest="emojiSuggestor"
            >
              <template #default="inputProps">
                <input
                  v-model="newFields[i].name"
                  :placeholder="$t('settings.profile_fields.name')"
                  v-bind="propsToNative(inputProps)"
                  class="input"
                >
              </template>
            </EmojiInput>
          </dt>
          <dd
            class="user-profile-field-value -edit"
          >
            <EmojiInput
              v-model="newFields[i].value"
              enable-emoji-picker
              :suggest="emojiSuggestor"
            >
              <template #default="inputProps">
                <input
                  v-model="newFields[i].value"
                  :placeholder="$t('settings.profile_fields.value')"
                  v-bind="propsToNative(inputProps)"
                  class="input input"
                >
              </template>
            </EmojiInput>
            <button
              class="delete-field button-default -hover-highlight"
              @click="deleteField(i)"
            >
              <!-- TODO something is wrong with v-show here -->
              <FAIcon
                v-if="newFields.length > 1"
                icon="times"
              />
            </button>
          </dd>
        </dl>
        <button
          v-if="newFields.length < maxFields"
          class="user-profile-field-add add-field button-default -hover-highlight"
          @click="addField"
        >
          <FAIcon icon="plus" class="icon" />
          <span class="label">
            {{ $t("settings.profile_fields.add_field") }}
          </span>
        </button>
      </div>
    </template>
    <div
      class="user-extras"
      v-if="!hideBio"
    >
      <span
        v-if="!editable && !mergedConfig.hideUserStats"
        class="user-stats"
      >
        <dl
          v-if="!mergedConfig.hideUserStats && !hideBio"
          class="user-count"
          @click.prevent="setProfileView('statuses')"
        >
          <dd>{{ user.statuses_count }}</dd>
          {{ ' ' }}
          <dt>{{ $t('user_card.statuses') }}</dt>
        </dl>
        <dl
          class="user-count"
          @click.prevent="setProfileView('statuses')"
        >
          <dd>{{ dailyAvg }}</dd>
          {{ ' ' }}
          <dt>{{ $t('user_card.statuses_per_day') }}</dt>
        </dl>
        <dl
          class="user-count"
          @click.prevent="setProfileView('friends')"
        >
          <dd>{{ hideFollowsCount ? $t('user_card.hidden') : user.friends_count }}</dd>
          {{ ' ' }}
          <dt>{{ $t('user_card.followees') }}</dt>
        </dl>
        <dl
          class="user-count"
          @click.prevent="setProfileView('followers')"
        >
          <dd>{{ hideFollowersCount ? $t('user_card.hidden') : user.followers_count }}</dd>
          {{ ' ' }}
          <dt>{{ $t('user_card.followers') }}</dt>
        </dl>
      </span>
      <template v-if="!hideBio">
        <div
          v-if="user.birthday && !editable"
          class="birthday"
        >
          <FAIcon
            class="fa-old-padding"
            icon="birthday-cake"
          />
          {{ $t('user_card.birthday', { birthday: formattedBirthday }) }}
        </div>
        <div
          v-else-if="editable"
          class="birthday"
        >
          <div>
            <Checkbox v-model="showBirthday">
              {{ $t('settings.birthday.show_birthday') }}
            </Checkbox>
          </div>
          <FAIcon
            class="fa-old-padding"
            icon="birthday-cake"
          />
          {{ $t('settings.birthday.label') }}
          <input
            id="birthday"
            v-model="newBirthday"
            type="date"
            class="input birthday-input"
          >
        </div>
      </template>
    </div>
    <teleport to="#modal">
      <UserTimedFilterModal
        ref="timedMuteDialog"
        :user="user"
        :is-mute="true"
      />
    </teleport>
    <teleport to="#modal">
      <Modal
        v-if="editImage"
        :is-mute="true"
        class="edit-image"
        :class="{ '-banner': editImage === 'banner' }"
        @backdrop-clicked="editImage = false"
      >
        <div class="panel">
          <div class="panel-heading">
            <h1 class="title">
              {{ editImage === 'avatar' ? $t('settings.change_avatar') : $t('settings.change_banner') }}
            </h1>
          </div>
          <div class="panel-body">
            <div class="images-container">
              <img
                :src="editImage === 'avatar' ? avatarImgSrc : bannerImgSrc"
                class="current-avatar"
              />
              <FAIcon
                class="separator"
                :icon="editImage === 'avatar' ? 'chevron-right' : 'chevron-down'"
              />
              <image-cropper
                ref="cropper"
                class="cropper"
                :aspect-ratio="editImage === 'avatar' ? 1 : 3"
                @submit="submitImage"
              />
            </div>
            <button
              id="pick-image"
              class="button-default btn"
              type="button"
              @click="() => this.$refs.cropper.pickImage()"
            >
              {{ $t('settings.upload_picture') }}
            </button>
            <p class="visibility-notice">
              {{ $t('settings.avatar_size_instruction') }}
            </p>
            <button
              :title="editImage === 'avatar' ? $t('settings.reset_avatar') : $t('settings.reset_banner')"
              class="button-unstyled reset-button"
              @click="resetImage"
            >
            </button>
            <div class="panel-footer">
              <div/>
              <button
                class="button-default btn"
                type="button"
                @click="destroy"
              >
                {{ this.$t('image_cropper.cancel') }}
              </button>
              <button
                class="button-default btn"
                type="button"
                @click="this.$refs.cropper.submit(true)"
              >
                {{ $t('image_cropper.save') }}
              </button>
              <button
                class="button-default btn"
                type="button"
                @click="this.$refs.cropper.submit(false)"
              >
                {{ $t('image_cropper.save_without_cropping') }}
              </button>
              <FAIcon
                v-if="submitting"
                spin
                icon="circle-notch"
              />
            </div>
          </div>
        </div>
      </Modal>
    </teleport>
  </div>
</template>

<script src="./user_card.js"></script>

<style lang="scss" src="./user_card.scss" />
