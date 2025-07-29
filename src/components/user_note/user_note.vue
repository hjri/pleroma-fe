<template>
  <div
    class="user-note"
    :class="{ '-frozen': frozen }"
  >
    <h4>{{ $t('user_card.personal_note') }}</h4>
    <textarea
      v-show="editing"
      v-model="localNote"
      class="input note-text"
      @blur="finalizeEditing"
    />
    <span
      v-show="!editing"
      class="note-text"
      :class="{ '-blank': !relationship.note }"
      @click="startEditing"
    >
      {{ relationship.note || $t('user_card.note_blank_click') }}
    </span>
    <span
      class="overlay"
      v-if="frozen"
    >
      <PanelLoading />
    </span>
  </div>
</template>

<script src="./user_note.js"></script>

<style lang="scss">
.user-note {
  position: relative;

  h4 {
    justify-content: space-between;
    margin-bottom: 0.5em;
  }

  .note-text {
    align-self: stretch;
  }

  .note-text.-blank {
    font-style: italic;
    color: var(--textFaint);
  }

  .overlay {
    position: absolute;
    inset: 0;
    background-color: rgb(0 0 0 / 30%);

    .panel-loading {
      font-size: 1em;
    }
  }
}
</style>
