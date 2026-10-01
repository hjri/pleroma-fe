<template>
  <div class="UserListMenu">
    <Popover
      trigger="hover"
      placement="right"
      v-bind="triggerAttrs"
      remove-padding
    >
      <template #content>
        <div class="dropdown-menu">
          <div
            v-for="list in lists"
            :key="list.id"
            class="menu-item dropdown-item -icon"
          >
            <button
              class="main-button"
              @click="toggleList(list.id)"
            >
              <span
                class="input menu-checkbox"
                :class="{ 'menu-checkbox-checked': list.inList }"
              />
              {{ list.title }}
            </button>
          </div>
        </div>
      </template>
      <template #trigger>
        <span class="main-button">
          {{ $t('lists.manage_lists') }}
          <FAIcon
            class="chevron-icon"
            size="lg"
            icon="chevron-right"
          />
        </span>
      </template>
    </Popover>
  </div>
</template>

<script src="./user_list_menu.js"></script>
