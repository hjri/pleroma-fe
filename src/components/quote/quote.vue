<template>
  <article
    v-if="hasVisibleQuote"
    class="quoted-status"
  >
    <button
      class="button-unstyled -link display-quoted-status-button"
      :aria-expanded="shouldDisplayQuote"
      @click="toggleDisplayQuote"
    >
      {{ shouldDisplayQuote ? $t('status.hide_quote') : $t('status.display_quote') }}
      <FAIcon
        class="display-quoted-status-button-icon"
        :icon="shouldDisplayQuote ? 'chevron-up' : 'chevron-down'"
      />
    </button>
    <span
      v-show="showSpinner"
      class="loading-spinner"
    >
      <FAIcon
        class="fa-old-padding"
        spin
        icon="circle-notch"
      />
    </span>
    <Status
      v-if="shouldDisplayQuote"
      :statusoid="quotedStatus"
      :in-quote="true"
    />
  </article>
  <p
    v-else-if="hasInvisibleQuote"
    class="quoted-status -unavailable-prompt"
  >
    <i18n-t
      scope="global"
      keypath="status.invisible_quote"
    >
      <template #link>
        <bdi>
          <a
            v-if="statusId"
            :href="statusUrl"
            target="_blank"
          >
            {{ statusUrl }}
          </a>
          <router-link
            v-else
            :to="{ name: 'search', query: { query: statusUrl } }"
          >
            {{ statusUrl }}
          </router-link>
        </bdi>
      </template>
    </i18n-t>
  </p>
</template>

<script src="./quote.js"></script>

<style lang="scss">
.quoted-status {
  margin-top: 0.5em;
  border: 1px solid var(--border);
  border-radius: var(--roundness);

  &.-unavailable-prompt {
    padding: 0.5em;
  }

  .display-quoted-status-button {
    margin: 0.5em;

    &-icon {
      color: inherit;
    }
  }
}
</style>
