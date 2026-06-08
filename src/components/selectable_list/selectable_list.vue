<template>
  <div class="selectable-list">
    <div
      v-if="items.length > 0"
      class="selectable-list-header"
    >
      <div class="selectable-list-checkbox-wrapper">
        <Checkbox
          :model-value="allSelected"
          :indeterminate="someSelected"
          @update:model-value="toggleAll"
        >
          {{ $t('selectable_list.select_all') }}
        </Checkbox>
      </div>
      <div class="selectable-list-header-actions">
        <slot
          name="header"
          :selected="filteredSelected"
        />
      </div>
    </div>
    <List
      :items="items"
      :get-key="getKey"
      :get-class="item => isSelected(item) ? '-active' : ''"
    >
      <template #item="{item}">
        <div
          v-if="!boxOnly"
          class="selectable-list-item-inner"
          :class="{ 'selectable-list-item-selected-inner': isSelected(item) }"
          @click.stop="toggle(!isSelected(item), item)"
        >
          <div class="selectable-list-checkbox-wrapper">
            <Checkbox
              :model-value="isSelected(item)"
              @update:model-value="checked => toggle(checked, item)"
              @click.stop
            />
          </div>
          <slot
            name="item"
            :item="item"
          />
        </div>
        <div
          v-else
          class="selectable-list-item-inner"
          :class="{ 'selectable-list-item-selected-inner': isSelected(item) }"
        >
          <div
            class="selectable-list-checkbox-wrapper"
            @click.stop="toggle(!isSelected(item), item)"
          >
            <Checkbox
              :model-value="isSelected(item)"
              @update:model-value="checked => toggle(checked, item)"
              @click.stop
            />
          </div>
          <slot
            name="item"
            :item="item"
          />
        </div>
      </template>
      <template #empty>
        <slot name="empty" />
      </template>
      <template #load>
        <slot name="load" />
      </template>
    </List>
  </div>
</template>

<script src="./selectable_list.js"></script>

<style lang="scss">
.selectable-list {
  --__line-height: 1.5em;
  --__horizontal-gap: 0.75em;
  --__vertical-gap: 0.5em;

  display: flex;
  flex-direction: column;

  .list {
    flex: 1;
  }

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
