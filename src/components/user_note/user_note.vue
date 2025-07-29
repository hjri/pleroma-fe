<template>
  <div
    class="user-note"
    :class="{ '-frozen': frozen }"
  >
    <h4>{{ $t('user_card.personal_note') }}</h4>
    <textarea
      v-model="localNote"
      class="input note-text"
      :class="{ unstyled: !editing }"
      @focus="startEditing"
      @blur="finalizeEditing"
      rows="1"
      :placeholder="$t('user_card.note_blank_click')"
    />
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
    min-width: 100%;
    margin: -0.6em;
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
