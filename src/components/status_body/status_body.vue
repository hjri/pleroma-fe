<template>
  <div
    class="StatusBody"
    :class="{ '-compact': compact, '-single-line': singleLine }"
  >
    <div class="body">
      <div
        v-if="hasSubject"
        class="summary-wrapper"
        :class="{ '-tall': (hasLongSubject && !showingLongSubject) }"
      >
        <RichContent
          class="media-body summary"
          :faint="compact"
          :html="status.summary_raw_html"
          :emoji="status.emojis"
          :is-local="status.isLocal"
          :allow-non-square-emoji="allowNonSquareEmoji"
          :pause-mfm="pauseMfm"
          :scale-mfm="scaleMfm"
        />
        <button
          v-show="hasLongSubject && showingLongSubject"
          class="button-unstyled -link tall-subject-hider"
          @click.prevent="toggleShowingLongSubject"
        >
          {{ $t("status.hide_full_subject") }}
        </button>
        <button
          v-show="hasLongSubject && !showingLongSubject"
          class="button-unstyled -link tall-subject-hider"
          @click.prevent="toggleShowingLongSubject"
        >
          {{ $t("status.show_full_subject") }}
        </button>
      </div>
      <div
        class="text-wrapper"
        :class="{'-tall-status': hideTallStatus, '-hidden': shouldHide, '-expanded': showingMore }"
      >
        <RichContent
          v-if="!(singleLine && hasSubject) && !shouldHide"
          :class="{ '-single-line': singleLine }"
          class="text media-body"
          :html="status.raw_html"
          :collapse="collapse"
          :emoji="status.emojis"
          :handle-links="true"
          :faint="compact"
          :greentext="mergedConfig.greentext"
          :attentions="status.attentions"
          :is-local="status.is_local"
          :allow-non-square-emoji="allowNonSquareEmoji"
          :pause-mfm="pauseMfm"
          :scale-mfm="scaleMfm"
          @parse-ready="onParseReady"
        />
        <div
          v-show="shouldShowExpandToggle"
          :class="toggleButtonClasses"
        >
          <button
            class="btn button-default toggle-button"
            :aria-expanded="showingMore"
            @click.prevent="toggleShowMore"
          >
            {{ toggleText }}
          </button>
        </div>
      </div>
    </div>
    <slot v-if="!hideSubjectStatus" />
  </div>
</template>
<script src="./status_body.js"></script>
<style lang="scss" src="./status_body.scss" />
