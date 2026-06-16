<template>
  <div class="FolderCard">
    <router-link
      :to="link"
      class="folder-name"
    >
      <img
        v-if="emojiUrl"
        class="iconEmoji iconEmoji-image"
        :src="emojiUrl"
        :alt="emoji"
        :title="emoji"
      >
      <span
        v-else-if="emoji"
        class="iconEmoji"
      >
        <span>
          {{ emoji }}
        </span>
      </span>
      <span
        v-else-if="firstLetter"
        class="icon iconLetter fa-scale-110"
      >{{ firstLetter }}</span>{{ name }}
    </router-link>
    <router-link
      :to="linkEdit"
      class="button-folder-edit"
    >
      <FAIcon
        class="fa-scale-110 fa-old-padding"
        icon="ellipsis-h"
      />
    </router-link>
  </div>
</template>

<script src="./folder_card.js"></script>

<style lang="scss">
.FolderCard {
  display: flex;
  align-items: center;

  .folder-name {
    display: flex;
    align-items: center;
    flex-grow: 1;

    .icon,
    .iconLetter,
    .iconEmoji {
      display: inline-block;
      height: 2.5rem;
      width: 2.5rem;
      margin-right: 0.5rem;
    }

    .icon,
    .iconLetter {
      font-size: 1.5rem;
      line-height: 2.5rem;
      text-align: center;
    }

    .iconEmoji {
      text-align: center;
      object-fit: contain;
      vertical-align: middle;

      > span {
        font-size: 1.5rem;
        line-height: 2.5rem;
      }
    }

    img.iconEmoji {
      padding: 0.25em;
      box-sizing: border-box;
    }
  }
}
</style>
