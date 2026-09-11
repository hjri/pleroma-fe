<template>
  <div class="user-selector">
    <div class="input-row">
      <component :is="editing ? 'label' : 'div'" class="input-label">
        <slot>
        </slot>
        <input
          v-show="editing"
          v-model="usernameInput"
          class="input"
          :placeholder="$t('user_selector.username_input_placeholder')"
        >
        <span
          v-show="!editing"
          class="result-display"
        >
          <BasicUserCard
            v-if="user"
            :user="user"
          />
          <span v-else>
            {{ $t('user_selector.none') }}
          </span>
        </span>
      </component>
      <button
        v-if="!editing"
        class="btn button-default"
        @click.prevent="editing = true"
        :title="$t('user_selector.edit')"
      >
        <FAIcon
          icon="pencil"
        />
      </button>
      <button
        class="btn button-default"
        :title="$t('user_selector.clear')"
        @click.prevent="clear"
      >
        <FAIcon
          icon="xmark"
        />
      </button>
    </div>
    <List
      v-if="editing && searchResults.length"
      :external-items="searchResults"
    >
      <template #item="{item}">
        <BasicUserCard :user="item" />
        <button
          class="btn button-default"
          @click.prevent="selectUser(item)"
        >{{ $t('user_selector.select') }}</button>
      </template>
    </List>
    <span
      v-else-if="loading"
      :aria-label="$t('general.loading')"
    >
      <FAIcon
        class="fa-old-padding"
        spin
        icon="circle-notch"
      />
    </span>
  </div>
</template>

<script src="./user_selector_input.js"></script>

<style>
.user-selector {
  display: flex;
  flex-direction: column;
  align-items: stretch;

  .input-row {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .input-label {
    flex: 1;
    display: flex;
    max-width: 100%;
    flex-direction: row;
    align-items: center;
    overflow-x: hidden;
  }

  .input, .result-display {
    flex: 1;
    margin-left: 0.5rem;
    margin-right: 0.5rem;
  }

  .result-display {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
}
</style>
