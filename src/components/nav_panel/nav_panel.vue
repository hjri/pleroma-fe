<template>
<nav
  class="NavPanel"
  :aria-label="$t('nav.navigation')"
  :aria-expanded="!collapsed"
  >
    <div class="panel panel-default">
      <div
        v-if="!forceExpand"
        class="panel-heading nav-panel-heading"
      >
        <NavigationPins :limit="6" />
        <div class="spacer" />
        <button
          :title="$t('nav.expand_navigation')"
          class="button-unstyled"
          @click="toggleCollapse"
        >
          <FAIcon
            class="navigation-chevron"
            fixed-width
            :icon="collapsed ? 'chevron-down' : 'chevron-up'"
          />
        </button>
      </div>
      <ul
        v-if="!collapsed || forceExpand"
        class="panel-body"
        role="menu"
        :title="$t('nav.all_navigation')"
      >
        <NavigationEntry
          v-if="currentUser || !privateMode"
          :show-pin="false"
          :item="{ icon: 'stream', label: 'nav.timelines' }"
          role="menuitem"
          aria-controls="nav-timelines-list"
          :aria-expanded="showTimelines"
          @click="toggleTimelines"
        >
          <FAIcon
            class="timelines-chevron"
            fixed-width
            :icon="showTimelines ? 'chevron-up' : 'chevron-down'"
          />
        </NavigationEntry>
        <div
          v-show="showTimelines"
          class="timelines-background menu-item-collapsible"
          :class="{ '-expanded': showTimelines }"
          id="nav-timelines-list"
          :aria-label="$t('nav.timelines')"
          :aria-expanded="showTimelines"
          role="group"
        >
          <div class="timelines">
            <NavigationEntry
              v-for="item in timelinesItems"
              :key="item.name"
              :show-pin="editMode || forceEditMode"
              :item="item"
            />
          </div>
        </div>
        <NavigationEntry
          v-if="currentUser"
          :show-pin="false"
          :item="{ icon: 'list', label: 'nav.lists' }"
          :aria-expanded="showLists ? 'true' : 'false'"
          role="menuitem"
          aria-controls="nav-lists-list"
          :aria-label="$t('nav.lists')"
          @click="toggleLists"
        >
          <router-link
            :title="$t('lists.manage_lists')"
            class="button-unstyled extra-button"
            :to="{ name: 'lists' }"
            @click.stop
          >
            <FAIcon
              fixed-width
              icon="wrench"
            />
          </router-link>
          <FAIcon
            class="timelines-chevron"
            fixed-width
            :icon="showLists ? 'chevron-up' : 'chevron-down'"
          />
        </NavigationEntry>
        <div
          v-show="showLists"
          class="timelines-background menu-item-collapsible"
          :class="{ '-expanded': showLists }"
          id="nav-lists-list"
          :aria-label="$t('nav.lists')"
          :aria-expanded="showLists"
          role="group"
        >
          <ListsMenuContent
            :show-pin="editMode || forceEditMode"
            class="timelines"
          />
        </div>
        <NavigationEntry
          v-if="currentUser && pleromaBookmarkFoldersAvailable"
          :show-pin="false"
          :item="{ icon: 'bookmark', label: 'nav.bookmarks' }"
          :aria-expanded="showBookmarkFolders ? 'true' : 'false'"
          role="menuitem"
          aria-controls="nav-bookmark-folders-list"
          :aria-label="$t('nav.bookmarks')"
          @click="toggleBookmarkFolders"
        >
          <router-link
            :title="$t('bookmarks.manage_bookmark_folders')"
            class="button-unstyled extra-button"
            :to="{ name: 'bookmark-folders' }"
            @click.stop
          >
            <FAIcon
              fixed-width
              icon="wrench"
            />
          </router-link>
          <FAIcon
            class="timelines-chevron"
            fixed-width
            :icon="showBookmarkFolders ? 'chevron-up' : 'chevron-down'"
          />
        </NavigationEntry>
        <div
          v-show="showBookmarkFolders"
          class="timelines-background menu-item-collapsible"
          :class="{ '-expanded': showBookmarkFolders }"
          :aria-label="$t('nav.bookmark_folders')"
          :aria-expanded="showLists"
          id="nav-bookmark-folders-list"
          role="group"
        >
          <BookmarkFoldersMenuContent
            :show-pin="editMode || forceEditMode"
            class="timelines"
          />
        </div>
        <NavigationEntry
          v-for="item in rootItems"
          :key="item.name"
          :show-pin="editMode || forceEditMode"
          :item="item"
        />
        <NavigationEntry
          v-if="!forceEditMode && currentUser"
          :show-pin="false"
          :item="{ labelRaw: editMode ? $t('nav.edit_finish') : $t('nav.edit_pinned'), icon: editMode ? 'check' : 'wrench' }"
          @click="toggleEditMode"
        />
      </ul>
    </div>
  </nav>
</template>

<script src="./nav_panel.js"></script>

<style lang="scss">
.NavPanel {
  .panel {
    overflow: hidden;
    box-shadow: var(--shadow);
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .navigation-chevron {
    margin-left: 0.8em;
    margin-right: 0.8em;
    font-size: 1.1em;
  }

  .timelines-background {
    padding: 0 0 0 0.6em;
  }

  .nav-panel-heading {
    // breaks without a unit
    // stylelint-disable-next-line length-zero-no-unit
    --panel-heading-height-padding: 0px;
  }
}
</style>
