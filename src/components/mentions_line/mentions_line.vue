<template>
  <span class="MentionsLine">
    <template
      v-for="mention in mentionsComputed"
      :key="mention.index"
    >
      <MentionLink
        class="mention-link"
        :content="mention.content"
        :url="mention.url"
      />
      <template v-if="mention.index !== mentionsComputed.length - 1">
        {{ ' ' }}
      </template>
    </template>
    <span
      v-if="manyMentions"
      class="extraMentions"
    >
      {{ ' ' }}
      <span
        v-if="expanded"
        class="fullExtraMentions"
      >
      <template
        v-for="mention in extraMentions"
        :key="mention.index"
      >
        <MentionLink
          class="mention-link"
          :content="mention.content"
          :url="mention.url"
        /><template v-if="mention.index === mentionsExtra.length - 1">
          {{ ' ' }}
        </template>
      </template>
      </span><button
        v-if="!expanded"
        class="button-unstyled -link showMoreLess"
        @click="toggleShowMore"
      >
        {{ $t('status.plus_more', { number: extraMentions.length }) }}
      </button><button
        v-if="expanded"
        class="button-unstyled -link showMoreLess"
        @click="toggleShowMore"
      >
        {{ $t('general.show_less') }}
      </button>
    </span>
  </span>
</template>
<script src="./mentions_line.js"></script>
<style lang="scss" src="./mentions_line.scss" />
