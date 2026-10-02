<template>
  <div
    class="List"
    :class="{ '-scrollable': scrollable }"
  >
    <div
      v-if="selectable"
      class="header"
    >
      <div class="checkbox-wrapper">
        <Checkbox
          :model-value="allSelected"
          :indeterminate="someSelected"
          @update:model-value="toggleAll"
        >
          {{ $t('selectable_list.select_all') }}
        </Checkbox>
      </div>
      <div class="actions">
        <slot
          name="header"
          :selected="selectedItems"
        />
      </div>
    </div>
    <ul class="list">
      <li
        v-for="item in finalItems"
        :key="getKey(item)"
        class="list-item"
        :class="[getClass(item), nonInteractive ? '-non-interactive' : '']"
      >
        <div
          v-if="selectable"
          class="checkbox-wrapper"
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
      </li>
      <li
        v-if="finalItems.length === 0 && !!$slots.empty"
        class="list-item list-empty-content faint"
      >
        <slot name="empty" />
      </li>
      <li class="footer">
        <button
          v-if="error"
          class="button-unstyled -link -fullwidth alert error"
          @click="fetchEntries"
        >
          {{ $t('general.generic_error') }}
        </button>
        <FAIcon
          v-else-if="loading"
          spin
          icon="circle-notch"
        />
        <button
          v-else-if="!bottomedOut"
          tabindex="0"
          class="button-unstyled"
          @click="fetchEntries"
        >
          {{ $t('general.more') }}
        </button>
        <span v-else-if="finalItems.length !== 0">
          {{ $t('general.no_more') }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script src="./list.js"></script>

<style src="./list.css"></style>
