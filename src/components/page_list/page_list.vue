<template>
  <div class="page-list">
    <SelectableList
      ref="list"
      :box-only="true"
      :get-key="i => i"
      :items="items"
    >
      <template #header="slotProps">
        <slot
          name="header"
          v-bind="slotProps"
        />
      </template>
      <template #item="slotProps">
        <slot
          name="item"
          v-bind="slotProps"
        />
      </template>
      <template #load="slotProps">
        <slot
          v-if="is_loading"
          name="load"
          v-bind="slotProps"
        />
      </template>
      <template #empty="slotProps">
        <slot
          v-if="items.length == 0 && !is_loading"
          name="empty"
          v-bind="slotProps"
        />
      </template>
    </SelectableList>
    <div v-if="!single_page">
      <button
        v-if="can_load_more"
        class="button button-default btn"
        type="button"
        @click="load_more"
      >
        {{ $t('page_list.load_more') }}
      </button>
    </div>
  </div>
</template>

<script src="./page_list.js"></script>

<style lang="scss">
.page-list {
  --__line-height: 1.5em;
  --__horizontal-gap: 0.75em;
  --__vertical-gap: 0.5em;

  &-item-inner {
    display: flex;
    align-items: center;

    > * {
      min-width: 0;
    }
  }

  &-header {
    display: flex;
    align-items: center;
    padding: var(--__vertical-gap) var(--__horizontal-gap);
    border-bottom: 1px solid;
    border-bottom-color: var(--border);

    &-actions {
      flex: 1;
    }
  }

  &-checkbox-wrapper {
    padding-right: var(--__horizontal-gap);
    flex: none;
  }
}
</style>
