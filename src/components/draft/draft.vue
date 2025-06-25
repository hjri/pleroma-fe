<template>
  <article class="Draft">
    <div
      v-if="!editing"
      class="status-content"
    >
      <div>
        <i18n-t
          v-if="draft.type === 'reply' || draft.type === 'edit'"
          tag="span"
          :keypath="draft.type === 'reply' ? 'drafts.replying' : 'drafts.editing'"
        >
          <template #statusLink>
            <router-link
              class="faint-link"
              :to="{ name: 'conversation', params: { id: draft.refId } }"
            >
              {{ refStatus ? refStatus.external_url : $t('drafts.unavailable') }}
            </router-link>
          </template>
        </i18n-t>
        <StatusContent
          v-if="draft.refId && refStatus"
          class="status-content"
          :status="refStatus"
          :compact="true"
        />
      </div>
      <div class="status-preview">
        <span class="status_content">
          <p v-if="draft.spoilerText">
            <i>
              {{ draft.spoilerText }}:
            </i>
          </p>
          <p v-if="draft.status">{{ draft.status }}</p>
          <p
            v-else
            class="faint"
          >{{ $t('drafts.empty') }}</p>
        </span>
        <gallery
          v-if="draft.files?.length !== 0"
          class="attachments media-body"
          :compact="true"
          :nsfw="nsfwClickthrough"
          :attachments="draft.files"
          :limit="1"
          size="small"
          @play="$emit('mediaplay', attachment.id)"
          @pause="$emit('mediapause', attachment.id)"
        />
        <div
          v-if="draft.poll.options"
          class="poll-indicator-container"
          :title="$t('drafts.poll_tooltip')"
        >
          <div class="poll-indicator">
            <FAIcon
              icon="poll-h"
              size="3x"
            />
          </div>
        </div>
      </div>
    </div>
    <div v-if="editing">
      <PostStatusForm
        v-if="draft.type !== 'edit'"
        :hide-draft="true"
        v-bind="postStatusFormProps"
      />
      <EditStatusForm
        v-else
        :hide-draft="true"
        :params="postStatusFormProps"
      />
    </div>
    <teleport to="#modal">
      <confirm-modal
        v-if="showingConfirmDialog"
        :title="$t('drafts.abandon_confirm_title')"
        :confirm-text="$t('drafts.abandon_confirm_accept_button')"
        :cancel-text="$t('drafts.abandon_confirm_cancel_button')"
        @accepted="doAbandon"
        @cancelled="hideConfirmDialog"
      >
        {{ $t('drafts.abandon_confirm') }}
      </confirm-modal>
    </teleport>
    <div class="actions">
      <button
        class="btn button-default"
        :aria-expanded="editing"
        @click.prevent.stop="toggleEditing"
      >
        {{ editing ? $t('drafts.save') : $t('drafts.continue') }}
      </button>
      <button
        class="btn button-default"
        @click.prevent.stop="abandon"
      >
        {{ $t('drafts.abandon') }}
      </button>
    </div>
  </article>
</template>

<script src="./draft.js"></script>

<style lang="scss">
.Draft {
  position: relative;

  .status-content {
    padding: 0.5em;
    margin: 0.5em 0;
  }

  .status-preview {
    display: grid;
    grid-template-columns: 1fr;
    grid-auto-columns: 10em;
    grid-auto-flow: column;
    grid-gap: 0.5em;
    align-items: start;
    max-width: 100%;

    p {
      white-space: normal;
      overflow-x: hidden;
    }

    .poll-indicator-container {
      border-radius: var(--roundness);
      display: grid;
      place-items: center center;
      align-self: start;
      height: 0;
      padding-bottom: 62.5%;
      position: relative;
    }

    .poll-indicator {
      box-sizing: border-box;
      border: 1px solid var(--border);
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center center;
      width: 100%;
      height: 100%;
    }
  }

  .actions {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;

    .btn {
      flex: 1;
      margin-left: 1em;
      margin-right: 1em;
    }
  }
}
</style>
