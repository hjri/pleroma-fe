<template>
  <div class="dropdown-menu bookmark-folder-menu">
    <div
      v-for="folder in folders"
      :key="folder.id"
      class="menu-item dropdown-item -icon-double"
    >
      <button
        class="main-button"
        @click="toggleFolder(folder.id)"
        @click.stop="close"
      >
        <span
          class="input menu-checkbox -radio"
          :class="{ 'menu-checkbox-checked': status.bookmark_folder_id == folder.id }"
        />
        <StillImage
          v-if="folder.emoji_url"
          :src="folder.emoji_url"
          class="emoji"
        />
        <span
          v-else
          class="iconLetter fa-scale-110 fa-old-padding"
        >
          {{ folder.name[0] }}
        </span>
        {{ ' ' + folder.name }}
      </button>
    </div>
  </div>
</template>

<script src="./status_bookmark_folder_menu.js"></script>
<style src="./status_bookmark_folder_menu.scss" />
