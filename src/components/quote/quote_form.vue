<template>
  <div
    v-if="visible"
    class="quote-form"
  >
    <div class="input-container">
      <input
        v-model="text"
        type="text"
        size="1"
        class="input"
        :placeholder="$t('post_status.quote_url')"
        :aria-label="$t('post_status.quote_url')"
      >
    </div>
    <Quote
      :status-id="id"
      :status-url="url"
      :status-visible="quoteVisible"
      :initially-expanded="true"
      :loading="loading"
      @loading="setLoading"
      @error="handleError"
    />
  </div>
</template>

<script src="./quote_form.js"></script>

<style lang="scss">
.quote-form {
  display: flex;
  flex-direction: column;
  padding: 0 0.5em 0.5em;

  .input-container {
    width: 100%;
    display: flex;
    flex-direction: row;

    input {
      width: 100%;
    }

    .checkbox {
      white-space: pre;
      display: flex;
      flex-flow: row-reverse;
      line-height: 2;
      column-gap: 0.5em;
      align-items: center;
      user-select: none;
    }
  }
}
</style>
