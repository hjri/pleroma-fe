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
    </SelectableList>
    <div v-if="!singlePage">
      <button
        v-if="canLoadMore"
        class="button button-default btn"
        type="button"
        @click="loadMore"
      >
        {{ $t('page_list.load_more') }}
      </button>
      <p> prev first next </p>
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
