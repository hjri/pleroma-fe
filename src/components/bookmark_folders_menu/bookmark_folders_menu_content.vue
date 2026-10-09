<template>
  <ul>
    <NavigationEntry
      :item="{
        name: 'bookmarks',
        routeObject: { name: 'bookmarks' },
        label: 'nav.all_bookmarks',
        icon: 'bookmark'
      }"
      :show-pin="showPin"
    />
    <NavigationEntry
      v-for="item in folders"
      :key="item.id"
      :show-pin="showPin"
      :item="item"
    />
  </ul>
</template>

<script src="./bookmark_folders_menu_content.js"></script>
