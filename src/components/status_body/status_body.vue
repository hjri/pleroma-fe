<template>
  <div
    class="StatusBody"
    :class="{ '-compact': compact }"
  >
    <div class="body">
      <div
        v-if="status.summary_raw_html"
        class="summary-wrapper"
        :class="{ '-tall': (longSubject && !showingLongSubject) }"
      >
        <RichContent
          class="media-body summary"
          :faint="compact"
          :html="status.summary_raw_html"
          :emoji="status.emojis"
        />
        <button
          v-show="longSubject && showingLongSubject"
          class="button-unstyled -link tall-subject-hider"
          @click.prevent="toggleShowingLongSubject"
        >
          {{ $t("status.hide_full_subject") }}
        </button>
        <button
          v-show="longSubject && !showingLongSubject"
          class="button-unstyled -link tall-subject-hider"
          @click.prevent="toggleShowingLongSubject"
        >
          {{ $t("status.show_full_subject") }}
        </button>
      </div>
      <div
        class="text-wrapper"
        :class="{'-tall-status': hideTallStatus, '-expanded': showingMore}"
      >
        <RichContent
          v-if="!hideSubjectStatus && !(singleLine && status.summary_raw_html)"
          :class="{ '-single-line': singleLine }"
          class="text media-body"
          :html="status.raw_html"
          :emoji="status.emojis"
          :handle-links="true"
          :faint="compact"
          :greentext="mergedConfig.greentext"
          :attentions="status.attentions"
          @parse-ready="onParseReady"
        />
        <div
          v-show="shouldShowToggle"
          :class="toggleButtonClasses"
        >
          <button
            class="btn button-default toggle-button"
            :class="{ '-focused': focused }"
            :aria-expanded="showingMore"
            @click.prevent="toggleShowMore"
          >
            {{ toggleText }}
            <template v-if="!showingMore">
              <FAIcon
                v-if="attachmentTypes.includes('image')"
                icon="image"
              />
              <FAIcon
                v-if="attachmentTypes.includes('video')"
                icon="video"
              />
              <FAIcon
                v-if="attachmentTypes.includes('audio')"
                icon="music"
              />
              <FAIcon
                v-if="attachmentTypes.includes('unknown')"
                icon="file"
              />
              <FAIcon
                v-if="status.poll && status.poll.options"
                icon="poll-h"
              />
              <FAIcon
                v-if="status.card"
                icon="link"
              />
            </template>
          </button>
        </div>
      </div>
    </div>
    <slot v-if="!hideSubjectStatus" />
  </div>
</template>
<script src="./status_body.js"></script>
<style lang="scss" src="./status_body.scss" />
