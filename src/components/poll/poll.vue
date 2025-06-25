<template>
  <div
    class="poll"
    :class="containerClass"
  >
    <div
      :role="showResults ? 'section' : (poll.multiple ? 'group' : 'radiogroup')"
    >
      <div
        v-for="(option, index) in options"
        :key="index"
        class="poll-option"
      >
        <div
          v-if="showResults"
          :title="resultTitle(option)"
          class="option-result"
        >
          <div class="option-result-label">
            <span class="result-percentage">
              {{ percentageForOption(option.votes_count) }}%
            </span>
            <RichContent
              :html="option.title_html"
              :handle-links="false"
              :emoji="emoji"
            />
          </div>
          <div
            class="result-fill"
            :style="{ 'width': `${percentageForOption(option.votes_count)}%` }"
          />
        </div>
        <div
          v-else
          tabindex="0"
          :role="poll.multiple ? 'checkbox' : 'radio'"
          :aria-labelledby="`option-vote-${randomSeed}-${index}`"
          :aria-checked="choices[index]"
        >
          <Checkbox
            :radio="!poll.multiple"
            :disabled="loading"
            :model-value="choices[index]"
            @update:model-value="value => activateOption(index, value)"
          >
            <RichContent
              :id="`option-vote-${randomSeed}-${index}`"
              :html="option.title_html"
              :handle-links="false"
              :emoji="emoji"
            />
          </Checkbox>
        </div>
      </div>
    </div>
    <div class="footer faint">
      <p>
        <span
          v-if="poll.pleroma?.non_anonymous"
          :title="$t('polls.non_anonymous_title')"
        >
          {{ $t('polls.non_anonymous') }}
          &nbsp;·&nbsp;
        </span>
        <span class="total">
          <template v-if="typeof poll.voters_count === 'number'">
            {{ $t("polls.people_voted_count", { count: poll.voters_count }, poll.voters_count) }}
          </template>
          <template v-else>
            {{ $t("polls.votes_count", { count: poll.votes_count }, poll.votes_count) }}
          </template>
          <span v-if="expiresAt !== null">
            &nbsp;·&nbsp;
          </span>
        </span>
        <span v-if="expiresAt !== null">
          <i18n-t
            scope="global"
            :keypath="expirationLabel"
          >
            <Timeago
              :time="expiresAt"
              :auto-update="60"
              :now-threshold="0"
            />
          </i18n-t>
        </span>
      </p>
      <button
        v-if="!showResults"
        class="btn button-default poll-vote-button"
        type="button"
        :disabled="isDisabled"
        @click="vote"
      >
        {{ $t('polls.vote') }}
      </button>
    </div>
  </div>
</template>

<script src="./poll.js"></script>

<style src="./poll.scss" lang="scss" />
