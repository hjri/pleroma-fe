<template>
  <div :label="$t('settings.notifications')">
    <div class="setting-item">
      <h3>{{ $t('settings.notification_setting_annoyance') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting path="closingDrawerMarksAsSeen">
            {{ $t('settings.notification_setting_drawer_marks_as_seen') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting path="ignoreInactionableSeen">
            {{ $t('settings.notification_setting_ignore_inactionable_seen') }}
          </BooleanSetting>
          <div>
            <small>
              {{ $t('settings.notification_setting_ignore_inactionable_seen_tip') }}
            </small>
          </div>
        </li>
        <li>
          <BooleanSetting
            path="unseenAtTop"
            expert="1"
          >
            {{ $t('settings.notification_setting_unseen_at_top') }}
          </BooleanSetting>
        </li>
      </ul>
    </div>
    <div class="setting-item">
      <h3>{{ $t('settings.notification_setting_filters') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting
            source="profile"
            path="blockNotificationsFromStrangers"
          >
            {{ $t('settings.notification_setting_block_from_strangers') }}
          </BooleanSetting>
        </li>
        <li>
          <h4> {{ $t('settings.notification_visibility') }}</h4>
          <p v-if="expertLevel > 0">
            {{ $t('settings.notification_setting_filters_chrome_push') }}
          </p>
          <ul class="setting-list two-column">
            <li>
              <h5> {{ $t('settings.notification_visibility_mentions') }}</h5>
              <ul class="setting-list">
                <li>
                  <BooleanSetting path="notificationVisibility.mentions">
                    {{ $t('settings.notification_visibility_in_column') }}
                  </BooleanSetting>
                </li>
                <li>
                  <BooleanSetting path="notificationNative.mentions">
                    {{ $t('settings.notification_visibility_native_notifications') }}
                  </BooleanSetting>
                </li>
              </ul>
            </li>
            <li>
              <h5> {{ $t('settings.notification_visibility_statuses') }}</h5>
              <ul class="setting-list">
                <li>
                  <BooleanSetting path="notificationVisibility.statuses">
                    {{ $t('settings.notification_visibility_in_column') }}
                  </BooleanSetting>
                </li>
                <li>
                  <BooleanSetting path="notificationNative.statuses">
                    {{ $t('settings.notification_visibility_native_notifications') }}
                  </BooleanSetting>
                </li>
              </ul>
            </li>
            <li>
              <h5> {{ $t('settings.notification_visibility_likes') }}</h5>
              <ul class="setting-list">
                <li>
                  <BooleanSetting path="notificationVisibility.likes">
                    {{ $t('settings.notification_visibility_in_column') }}
                  </BooleanSetting>
                </li>
                <li>
                  <BooleanSetting path="notificationNative.likes">
                    {{ $t('settings.notification_visibility_native_notifications') }}
                  </BooleanSetting>
                </li>
              </ul>
            </li>
            <li>
              <h5> {{ $t('settings.notification_visibility_repeats') }}</h5>
              <ul class="setting-list">
                <li>
                  <BooleanSetting path="notificationVisibility.repeats">
                    {{ $t('settings.notification_visibility_in_column') }}
                  </BooleanSetting>
                </li>
                <li>
                  <BooleanSetting path="notificationNative.repeats">
                    {{ $t('settings.notification_visibility_native_notifications') }}
                  </BooleanSetting>
                </li>
              </ul>
            </li>
            <li>
              <h5> {{ $t('settings.notification_visibility_emoji_reactions') }}</h5>
              <ul class="setting-list">
                <li>
                  <BooleanSetting path="notificationVisibility.emojiReactions">
                    {{ $t('settings.notification_visibility_in_column') }}
                  </BooleanSetting>
                </li>
                <li>
                  <BooleanSetting path="notificationNative.emojiReactions">
                    {{ $t('settings.notification_visibility_native_notifications') }}
                  </BooleanSetting>
                </li>
              </ul>
            </li>
            <li>
              <h5> {{ $t('settings.notification_visibility_follows') }}</h5>
              <ul class="setting-list">
                <li>
                  <BooleanSetting path="notificationVisibility.follows">
                    {{ $t('settings.notification_visibility_in_column') }}
                  </BooleanSetting>
                </li>
                <li>
                  <BooleanSetting path="notificationNative.follows">
                    {{ $t('settings.notification_visibility_native_notifications') }}
                  </BooleanSetting>
                </li>
              </ul>
            </li>
            <li>
              <h5> {{ $t('settings.notification_visibility_follow_requests') }}</h5>
              <ul class="setting-list">
                <li>
                  <BooleanSetting path="notificationVisibility.followRequest">
                    {{ $t('settings.notification_visibility_in_column') }}
                  </BooleanSetting>
                </li>
                <li>
                  <BooleanSetting path="notificationNative.followRequest">
                    {{ $t('settings.notification_visibility_native_notifications') }}
                  </BooleanSetting>
                </li>
              </ul>
            </li>
            <li>
              <h5> {{ $t('settings.notification_visibility_moves') }}</h5>
              <ul class="setting-list">
                <li>
                  <BooleanSetting path="notificationVisibility.moves">
                    {{ $t('settings.notification_visibility_in_column') }}
                  </BooleanSetting>
                </li>
                <li>
                  <BooleanSetting path="notificationNative.moves">
                    {{ $t('settings.notification_visibility_native_notifications') }}
                  </BooleanSetting>
                </li>
              </ul>
            </li>
            <li>
              <h5> {{ $t('settings.notification_visibility_polls') }}</h5>
              <ul class="setting-list">
                <li>
                  <BooleanSetting path="notificationVisibility.polls">
                    {{ $t('settings.notification_visibility_in_column') }}
                  </BooleanSetting>
                </li>
                <li>
                  <BooleanSetting path="notificationNative.polls">
                    {{ $t('settings.notification_visibility_native_notifications') }}
                  </BooleanSetting>
                </li>
              </ul>
            </li>
            <li v-if="canReceiveReports">
              <h5> {{ $t('settings.notification_visibility_reports') }}</h5>
              <ul class="setting-list">
                <li>
                  <BooleanSetting path="notificationVisibility.reports">
                    {{ $t('settings.notification_visibility_in_column') }}
                  </BooleanSetting>
                </li>
                <li>
                  <BooleanSetting path="notificationNative.reports">
                    {{ $t('settings.notification_visibility_native_notifications') }}
                  </BooleanSetting>
                </li>
              </ul>
            </li>
          </ul>
        </li>
        <li>
          <BooleanSetting path="showExtraNotifications">
            {{ $t('settings.notification_show_extra') }}
          </BooleanSetting>
        </li>
        <li>
          <ul class="setting-list suboptions">
            <li>
              <BooleanSetting
                path="showChatsInExtraNotifications"
                :disabled="!mergedConfig.showExtraNotifications"
              >
                {{ $t('settings.notification_extra_chats') }}
              </BooleanSetting>
            </li>
            <li>
              <BooleanSetting
                path="showAnnouncementsInExtraNotifications"
                :disabled="!mergedConfig.showExtraNotifications"
              >
                {{ $t('settings.notification_extra_announcements') }}
              </BooleanSetting>
            </li>
            <li>
              <BooleanSetting
                path="showFollowRequestsInExtraNotifications"
                :disabled="!mergedConfig.showExtraNotifications"
              >
                {{ $t('settings.notification_extra_follow_requests') }}
              </BooleanSetting>
            </li>
            <li>
              <BooleanSetting
                path="showExtraNotificationsTip"
                :disabled="!mergedConfig.showExtraNotifications"
              >
                {{ $t('settings.notification_extra_tip') }}
              </BooleanSetting>
            </li>
          </ul>
        </li>
      </ul>
    </div>

    <div
      v-if="expertLevel > 0"
      class="setting-item"
    >
      <h3>{{ $t('settings.notification_setting_privacy') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting
            path="webPushNotifications"
            expert="1"
          >
            {{ $t('settings.enable_web_push_notifications') }}
          </BooleanSetting>
          <ul class="setting-list suboptions">
            <li>
              <BooleanSetting
                path="webPushAlwaysShowNotifications"
                :disabled="!mergedConfig.webPushNotifications"
              >
                {{ $t('settings.enable_web_push_always_show') }}
              </BooleanSetting>
              <div :class="{ faint: !mergedConfig.webPushNotifications }">
                <small>
                  {{ $t('settings.enable_web_push_always_show_tip') }}
                </small>
              </div>
            </li>
          </ul>
        </li>
        <li>
          <BooleanSetting
            source="profile"
            path="webPushHideContents"
            expert="1"
          >
            {{ $t('settings.notification_setting_hide_notification_contents') }}
          </BooleanSetting>
        </li>
      </ul>
    </div>
    <div class="setting-item">
      <p>{{ $t('settings.notification_mutes') }}</p>
      <p>{{ $t('settings.notification_blocks') }}</p>
    </div>
  </div>
</template>

<script src="./notifications_tab.js"></script>
<!-- <style lang="scss" src="./profile.scss"></style> -->
