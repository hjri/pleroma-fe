<template>
  <DialogModal
    v-body-scroll-lock="true"
    class="error-modal"
    @cancel="onCancel"
  >
    <template #header>
      <span v-text="title ?? $t('general.generic_error')" />
    </template>

    <div class="content">
      <FAIcon
        class="error-icon"
        icon="circle-xmark"
        size="3x"
        fixed-width
      />
      <div class="text">
        <slot>
          <p>
            <strong><code v-text="error.name" /></strong>
            {{ ' - ' }}
            <span v-text="error.message" />
          </p>

          <details open>
            <summary>{{ $t('general.generic_error_details') }}</summary>
            <code
              class="stack pre"
              v-text="error.stack"
            />
          </details>
        </slot>
      </div>
    </div>
    <div class="below">
      <slot name="below" />
    </div>
    <template #footer>
      <slot name="footerLeft" />

      <button
        v-if="recoverText"
        class="btn button-default"
        @click.prevent="$emit('recover')"
        v-text="recoverText"
      />

      <button
        class="btn button-default"
        @click.prevent="$emit('clear')"
        v-text="clearText ?? $t('general.close')"
      />
    </template>
  </DialogModal>
</template>

<script src="./error_modal.js"></script>
<style lang="scss">
.error-modal {
  .error-icon {
    margin-left: 0.75rem;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .content {
    display: flex;
    align-items: center;
    text-align: left;
    justify-content: center;
    line-height: 1.5;

    p {
      margin-top: 0.75em;
      margin-bottom: 0.75em;

      &:first-child {
        margin-top: 0;
      }

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .stack {
    margin: 0;
    overflow-x: auto;
  }

  .below:not(:empty) {
    margin-top: 1em;
  }

  .text {
    max-width: 50ch;
    margin-left: 0.5em;
    margin-right: 3.5em;
  }
}
</style>
