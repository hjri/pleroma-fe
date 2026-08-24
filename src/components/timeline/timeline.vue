<template>
  <!-- there is a brief moment during logout when old timeline gets forcibly deactivated -->
  <div v-if="timeline.fetcher" :class="['Timeline', classes.root]">
    {{ timelineRef }}
    <div
      v-if="!embedded"
      :class="classes.header"
    >
      <TimelineMenu
        v-if="!embedded"
        :timeline-name="timelineRef.name"
      />
      <div
        v-if="timeline.fetcher.loadingNewer"
        class="loadingIndicator"
      >
        <FAIcon
          fixed-width
          icon="circle-notch"
          spin
        />
      </div>
      <ScrollTopButton />
      <template v-if="mobileLayout">
        <div
          v-if="showLoadButton"
          class="rightside-button"
        >
          <button
            class="button-unstyled loadmore-button"
            :title="loadButtonString"
            @click.prevent="showNewStatuses"
          >
            <FAIcon
              fixed-width
              icon="circle-plus"
            />
            <div class="badge -counter">
              {{ mobileLoadButtonString }}
            </div>
          </button>
        </div>
        <div
          v-else
          class="loadmore-text faint veryfaint rightside-icon"
          :title="$t('timeline.up_to_date')"
          :aria-disabled="true"
          @click.prevent
        >
          <FAIcon
            fixed-width
            icon="check"
          />
        </div>
      </template>
      <template v-else>
        <button
          v-if="showLoadButton"
          class="button-default loadmore-button"
          @click.prevent="showNewStatuses"
        >
          {{ loadButtonString }}
        </button>
        <div
          v-else
          class="loadmore-text faint"
          @click.prevent
        >
          {{ $t('timeline.up_to_date') }}
        </div>
      </template>
      <QuickFilterSettings
        v-if="!mobileLayout"
        class="rightside-button"
      />
      <QuickViewSettings
        class="rightside-button"
      />
    </div>
    <div :class="classes.body">
      <div
        ref="timeline"
        class="timeline"
        role="feed"
      >
        <Conversation
          v-for="status in filteredVisibleStatuses"
          :key="status.id"
          role="listitem"
          class="status-fadein"
          :status-id="status.id"
          :in-profile="inProfile"
          :profile-user-id="timelineRef.argument"
          :virtual-hidden="virtualScrollingEnabled && !statusesToDisplay.has(status.id)"
          collapsable
        />
      </div>
    </div>
    <div v-if="!embedded || footerSlipgate" :class="classes.footer">
      <teleport
        :to="footerSlipgate"
        :disabled="!embedded || !footerSlipgate"
      >
        <div
          v-if="count === 0"
          class="new-status-notification text-center faint"
        >
          {{ $t('timeline.no_statuses') }}
        </div>
        <div
          v-else-if="timeline.fetcher.bottomedOut"
          class="new-status-notification text-center faint"
        >
          {{ $t('timeline.no_more_statuses') }}
        </div>
        <button
          v-else-if="!timeline.fetcher.loadingOlder"
          class="button-unstyled -link"
          @click.prevent="fetchOlderStatuses()"
        >
          <div class="new-status-notification text-center">
            {{ $t('timeline.load_older') }}
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
      </teleport>
      <!-- spacer to avoid having empty shrug -->
      <span v-if="embedded && footerSlipgate" />
    </div>
  </div>
</template>

<script src="./timeline.js"></script>

<style src="./timeline.scss" lang="scss"> </style>
