<template>
  <teleport
    :disabled="minimalMode || disableTeleport"
    :to="teleportTarget"
  >
    <component
      :is="noHeading ? 'div' : 'aside'"
      ref="root"
      :class="{ minimal: minimalMode }"
      class="Notifications"
    >
      <div :class="mainClass">
        <div
          v-if="!noHeading"
          class="notifications-heading panel-heading -sticky"
        >
          <h1 class="title">
            {{ $t('notifications.notifications') }}
            <span
              v-if="unseenCountBadgeText"
              class="badge -notification unseen-count"
            >{{ unseenCountBadgeText }}</span>
          </h1>
          <div
            v-if="showScrollTop"
            class="rightside-button"
          >
            <button
              class="button-unstyled scroll-to-top-button"
              type="button"
              :title="$t('general.scroll_to_top')"
              @click="scrollToTop"
            >
              <FALayers class="fa-scale-110 fa-old-padding-layer">
                <FAIcon icon="arrow-up" />
                <FAIcon
                  icon="minus"
                  transform="up-7"
                />
              </FALayers>
            </button>
          </div>
          <button
            v-if="unseenCount"
            class="button-default read-button"
            type="button"
            @click.prevent="markAsSeen"
          >
            {{ $t('notifications.read') }}
          </button>
          <NotificationFilters class="rightside-button" />
        </div>
        <div
          role="feed"
        >
          <div
            v-if="showExtraNotifications"
            role="listitem"
            class="notification"
          >
            <extra-notifications />
          </div>
          <div
            v-for="notification in notificationsToDisplay"
            :key="notification.id"
            role="listitem"
            class="notification"
            :class="{unseen: !minimalMode && shouldShowUnseen(notification)}"
            @click="e => notificationClicked(notification)"
          >
            <div class="notification-overlay" />
            <notification
              :notification="notification"
              @interacted="e => notificationInteracted(notification)"
            />
          </div>
        </div>
        <div class="panel-footer">
          <div
            v-if="bottomedOut"
            class="new-status-notification text-center faint"
          >
            {{ $t('notifications.no_more_notifications') }}
          </div>
          <button
            v-else-if="!loading"
            class="button-unstyled -link text-center"
            @click.prevent="fetchOlderNotifications()"
          >
            <div class="new-status-notification text-center">
              {{ minimalMode ? $t('interactions.load_older') : $t('notifications.load_older') }}
            </div>
          </button>
          <div
            v-else
            class="new-status-notification text-center"
          >
            <FAIcon
              icon="circle-notch"
              spin
              size="lg"
            />
          </div>
        </div>
      </div>
    </component>
  </teleport>
</template>

<script src="./notifications.js"></script>
<style lang="scss" src="./notifications.scss"></style>
