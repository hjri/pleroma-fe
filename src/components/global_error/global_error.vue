<template>
  <teleport to="#modal">
    <ErrorModal
      v-if="globalError"
      :error="globalError.error"
      :title="title"
      :recover-text="recoverText"
      @recover="recover"
      @clear="clear"
    >
      <template v-if="content">
        <p>{{ content }}</p>

        <details v-if="details">
          <summary>{{ $t('general.generic_error_details') }}</summary>
          <code
            class="stack pre"
            v-text="details"
          />
        </details>
      </template>
    </ErrorModal>
  </teleport>
</template>

<script src="./global_error.js"></script>
