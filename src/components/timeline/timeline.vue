<template>
  <!-- there is a brief moment during logout when old timeline gets forcibly deactivated -->
  <div
    v-if="timeline.fetcher"
    :class="['Timeline', classes.root]"
  >
    <div
      v-if="!embedded"
      :class="classes.header"
    >
      <TimelineMenu
        v-if="!embedded"
        :timeline-name="timelineRef.name"
        :id="'timeline-header-' + uniqueId"
      />
      <div
        v-if="timeline.fetcher.loadingNewer && !showLoadButton"
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
            @click.prevent="showNewStatuses(false)"
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
          v-else-if="!timeline.fetcher.loadingNewer"
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
          @click.prevent="showNewStatuses(false)"
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
    <div
      v-if="paginationEnabled && page > 0"
      class="pagination panel-subheading"
    >
      <button
        class="panel-body button-unstyled"
        @click.left.prevent="previousPage"
      >
        <div class="new-status-notification text-center">
          {{ $t('timeline.previous_page') }}
        </div>
      </button>
    </div>
    <div :class="classes.body">
      <div
        class="timeline"
        ref="timeline"
        role="feed"
        :aria-labelledby="embedded ? undefined : ('timeline-header-'+ uniqueId)"
      >
        <template
          v-for="element in heightChart"
          :key="element.id"
        >
          <Conversation
            v-if="element.type === 'item'"
            class="timeline-conversation"
            :status-id="element.id"
            :scroll-compensation="element.visible"
            :top="element.top"

            :data-vs-height="element.height"
            :data-vs-top="element.top"
            :data-vs-id="element.id"
            :data-vs-visible="element.visible"

            @suspendable-state-change="changeSuspendState"
            @height-change="updateVirtualHeight"
          />
          <div
            v-if="element.type === 'spacer'"
            class="virtual-spacer"
            aria-hidden="true"
            :style="{ height: element.height + 'px' }"
          />
        </template>
      </div>
      <template v-if="!hideEmpty && count === 0">
        <div
          v-if="timeline.fetcher.loadingNewer || timeline.fetcher.loadingOlder"
          class="timeline-placeholder"
        >
          <FAIcon
            icon="circle-notch"
            spin
            size="4x"
          />
        </div>
        <div
          v-else
          class="timeline-placeholder faint"
        >
          {{ $t('timeline.no_statuses') }}
        </div>
      </template>
    </div>
    <div v-if="!embedded || footerSlipgate" :class="classes.footer">
      <teleport
        :to="footerSlipgate"
        :disabled="!embedded || !footerSlipgate"
      >
        <div
          v-if="paginationEnabled"
          class="pagination"
        >
          <button
            v-if="!isLastPage && !pageLoading"
            class="button-unstyled"
            @click.left.prevent="nextPage"
          >
            <div class="new-status-notification text-center">
              {{ $t('timeline.next_page') }}
            </div>
          </button>
          <div
            v-else-if="pageLoading"
            class="new-status-notification text-center"
          >
            <FAIcon
              icon="circle-notch"
              spin
              size="lg"
            />
          </div>
          <div
            v-else-if="!embedded || footerSlipgate"
            class="new-status-notification text-center faint"
          >
            {{ $t('timeline.no_more_statuses') }}
          </div>
        </div>
        <div
          v-else
          class="infinite-scroll"
        >
          <button
            v-if="!timeline.fetcher.bottomedOut && !timeline.fetcher.loadingOlder"
            class="button-unstyled"
            @click.prevent="fetchOlderStatuses()"
          >
            <div class="new-status-notification text-center">
              {{ $t('timeline.load_older') }}
            </div>
          </button>
          <div
            v-else-if="timeline.fetcher.loadingOlder"
            class="new-status-notification text-center"
          >
            <FAIcon
              icon="circle-notch"
              spin
              size="lg"
            />
          </div>
          <div
            v-else-if="!embedded || footerSlipgate"
            class="new-status-notification text-center faint"
          >
            {{ $t('timeline.no_more_statuses') }}
          </div>
        </div>
      </teleport>
      <!-- spacer to avoid having empty shrug -->
      <span v-if="embedded && footerSlipgate" />
    </div>
  </div>
</template>

<script src="./timeline.js"></script>

<style src="./timeline.scss" lang="scss"> </style>
