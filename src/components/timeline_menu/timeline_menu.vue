<template>
  <Popover
    trigger="click"
    class="TimelineMenu"
    :class="{ 'open': isOpen }"
    :bound-to="{ x: 'container' }"
    bound-to-selector=".Timeline"
    popover-class="timeline-menu-popover popover-default"
    @show="openMenu"
    @close="() => isOpen = false"
  >
    <template #content>
      <ListsMenuContent
        v-if="useListsMenu"
        :show-pin="false"
        class="timelines"
      />
      <BookmarkFoldersMenuContent
        v-else-if="useBookmarkFoldersMenu"
        class="timelines"
      />
      <ul v-else>
        <NavigationEntry
          v-for="item in timelinesList"
          :key="item.name"
          :show-pin="false"
          :item="item"
        />
      </ul>
    </template>
    <template #trigger>
      <span class="button-unstyled timeline-menu-title">
        <h1 class="title timeline-title">{{ timelineName }}</h1>
        <span>
          <FAIcon
            size="sm"
            icon="chevron-down"
          />
        </span>
        <span
          class="click-blocker"
          @click="blockOpen"
        />
      </span>
    </template>
  </Popover>
</template>

<script src="./timeline_menu.js"></script>

<style lang="scss">
.timeline-menu-popover {
  min-width: 24rem;
  max-width: 100vw;
  margin-top: 0.6rem;
  font-size: 1rem;
  border-top-right-radius: 0;
  border-top-left-radius: 0;

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
}

.TimelineMenu {
  margin-right: auto;
  min-width: 0;

  .popover-trigger-button {
    vertical-align: bottom;
  }

  .panel::after {
    border-top-right-radius: 0;
    border-top-left-radius: 0;
  }

  .timeline-menu-title {
    margin: 0;
    cursor: pointer;
    user-select: none;
    width: 100%;
    display: flex;

    .timeline-menu-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    svg {
      margin-left: 0.6em;
      transition: transform 100ms;
    }

    .click-blocker {
      cursor: default;
      flex-grow: 1;
    }
  }

  &.open .timeline-menu-title svg {
    transform: rotate(180deg);
  }

  .panel {
    box-shadow: var(--popoverShadow);
  }
}
</style>
