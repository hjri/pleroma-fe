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
          :selected="filteredSelected"
        />
      </div>
    </div>
    <div
      class="list"
      role="list"
    >
      <div
        v-for="item in finalItems"
        :key="getKey(item)"
        class="list-item"
        :class="[getClass(item), nonInteractive ? '-non-interactive' : '']"
        role="listitem"
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
      </div>
      <div
        v-if="finalItems.length === 0 && !!$slots.empty"
        class="list-empty-content faint"
      >
        <slot name="empty" />
        <slot name="load" />
      </div>
      <div class="footer">
        <button
          v-if="error"
          class="button-unstyled -link -fullwidth alert error"
          @click="fetchEntries"
        >
          {{ $t('general.generic_error') }}
          {{ error }}
        </button>
        <FAIcon
          v-else-if="loading"
          spin
          icon="circle-notch"
        />
        <a
          v-else-if="!bottomedOut"
          @click="fetchEntries"
          role="button"
          tabindex="0"
        >
          {{ $t('general.more') }}
        </a>
        <span v-else>
          {{ $t('general.no_more') }}
        </span>
      </div>
    </div>
  </div>
</template>

<script src="./list.js"></script>

<style src="./list.css"></style>
