<template>
  <div class="Bookmark-folders panel panel-default">
    <div class="panel-heading">
      <h1 class="title">
        {{ $t('nav.bookmark_folders') }}
      </h1>
      <router-link
        :to="{ name: 'bookmark-folder-new' }"
        class="button-default btn new-folder-button"
      >
        {{ $t("bookmark_folders.new") }}
      </router-link>
    </div>
    <div class="panel-body">
      <div class="list-item FolderCard">
        <router-link
          :to="{ name: 'bookmarks' }"
          class="folder-name"
        >
          <span class="icon">
            <FAIcon
              fixed-width
              class="fa-scale-110 menu-icon"
              icon="bookmark"
            />
          </span>{{ $t('nav.all_bookmarks') }}
        </router-link>
      </div>
      <FolderCard
        v-for="folder in bookmarkFolders.slice().reverse()"
        :key="folder"
        :name="folder.name"
        :emoji="folder.emoji"
        :emoji-url="folder.emoji_url"
        :link="{ name: 'bookmark-folder', params: { id: folder.id } }"
        :link-edit="{ name: 'bookmark-folder-edit', params: { id: folder.id } }"
        class="list-item"
      />
    </div>
  </div>
</template>

<script src="./bookmark_folders.js"></script>

<style lang="scss">
.Bookmark-folders {
  .new-folder-button {
    padding: 0 0.5em;
  }
}
</style>
