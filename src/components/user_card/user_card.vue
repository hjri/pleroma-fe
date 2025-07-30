<template>
  <div
    class="user-card"
    :class="classes"
  >
    <div :class="onClose ? '' : 'panel-heading -flexible-height'" class="user-card-inner">
      <div class="user-info">
        <div class="other-actions">
          <button
            v-if="!isOtherUser && user.is_local"
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
        <div
          :class="{ 'hide-bio': hideBio }"
          :style="style"
          class="background-image"
        />
        <div class="user-identity">
          <a
            v-if="avatarAction === 'zoom'"
            class="user-info-avatar -link"
            @click="zoomAvatar"
          >
            <UserAvatar :user="user" />
            <div class="user-info-avatar -link -overlay">
              <FAIcon
                class="fa-scale-110 fa-old-padding"
                icon="search-plus"
              />
            </div>
          </a>
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
              <router-link
                :to="userProfileLink(user)"
                class="user-name"
              >
                <RichContent
                  :title="user.name"
                  :html="user.name"
                  :emoji="user.emoji"
                />
              </router-link>
            </div>
            <div class="bottom-line">
              <div class="user-screen-name">
                <user-link
                  :user="user"
                />
                <span v-if="user.locked">
                  <FAIcon
                    class="lock-icon"
                    icon="lock"
                    size="sm"
                  />
                </span>
              </div>
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
              <span
                v-if="relationship.followed_by && loggedIn && isOtherUser"
                class="alert neutral user-role"
              >
                {{ $t('user_card.follows_you') }}
              </span>
            </div>
          </div>
        </div>
        <div
          v-if="loggedIn && isOtherUser"
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
    <div class="personal-marks" v-if="loggedIn && isOtherUser && (hasNote || !hideBio) && !mergedConfig.userCardHidePersonalMarks">
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
          class="highlighter-color"
          v-model="userHighlightColor"
          :show-optional-checkbox="false"
          name="'userHighlightColorTx'+user.id"
          :unstyled="true"
        />
      </div>
    </div>
    <RichContent
      v-if="!hideBio"
      class="user-card-bio"
      :class="{ '-justify-left': mergedConfig.userCardLeftJustify }"
      :html="user.description_html"
      :emoji="user.emoji"
      :handle-links="true"
    />
    <div
      v-if="!hideBio && user.fields_html && user.fields_html.length > 0"
      class="user-profile-fields"
    >
      <dl
        v-for="(field, index) in user.fields_html"
        :key="index"
        class="user-profile-field"
      >
        <dt
          :title="user.fields_text[index].name"
          class="user-profile-field-name"
        >
          <RichContent
            :html="field.name"
            :emoji="user.emoji"
          />
        </dt>
        <dd
          :title="user.fields_text[index].value"
          class="user-profile-field-value"
        >
          <RichContent
            :html="field.value"
            :emoji="user.emoji"
          />
        </dd>
      </dl>
    </div>
    <div class="user-extras" v-if="!hideBio">
      <span
        v-if="!mergedConfig.hideUserStats"
        class="user-stats"
      >
        <dl
          class="user-count"
          @click.prevent="setProfileView('statuses')"
          v-if="!mergedConfig.hideUserStats && !hideBio"
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
      <div class="birthday" v-if="!hideBio && !!user.birthday">
        <FAIcon
          class="fa-old-padding"
          icon="birthday-cake"
        />
        {{ $t('user_card.birthday', { birthday: formattedBirthday }) }}
      </div>
    </div>
    <teleport to="#modal">
      <UserTimedFilterModal
        :user="user"
        :is-mute="true"
        ref="timedMuteDialog"
      />
    </teleport>
  </div>
</template>

<script src="./user_card.js"></script>

<style lang="scss" src="./user_card.scss" />
