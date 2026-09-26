<template>
  <main class="InstancePicker">
    <form
      class="panel panel-default instance-picker-panel"
      @submit.prevent="submit"
    >
      <h1 class="panel-heading instance-picker-title">
        {{ $t('hosted.title') }}
      </h1>
      <div class="panel-body">
        <p>{{ $t('hosted.intro') }}</p>
        <label
          class="instance-picker-label"
          for="instance-picker-input"
        >{{ $t('hosted.instance') }}</label>
        <div class="instance-picker-row">
          <input
            id="instance-picker-input"
            v-model="input"
            class="input"
            type="text"
            inputmode="url"
            autocapitalize="off"
            autocomplete="url"
            spellcheck="false"
            placeholder="pleroma.example"
            :aria-invalid="!!error"
            :aria-describedby="error ? 'instance-picker-error' : null"
            :disabled="busy"
          >
          <button
            class="btn button-default"
            type="submit"
            :disabled="busy || !input.trim()"
          >
            {{ busy ? $t('hosted.checking') : $t('hosted.continue') }}
          </button>
        </div>
        <p
          v-if="error"
          id="instance-picker-error"
          class="alert error instance-picker-error"
          role="alert"
        >
          {{ $t(error) }}
        </p>
        <p class="faint instance-picker-note">
          {{ $t('hosted.note') }}
        </p>
      </div>
    </form>
  </main>
</template>

<script>
import {
  checkInstance,
  chooseInstance,
  instanceOrigin,
} from 'src/services/hosted/hosted.js'

// Hosted mode, before anything else: which instance to use. Once one
// answers, it is remembered and the app starts with it.
export default {
  props: {
    check: { type: Function, default: checkInstance },
    onChosen: { type: Function, default: () => window.location.reload() },
  },
  data: () => ({ input: '', error: null, busy: false }),
  methods: {
    async submit() {
      const origin = instanceOrigin(this.input)
      if (!origin) {
        this.error = 'hosted.not_a_domain'
        return
      }
      this.busy = true
      this.error = null
      const ok = await this.check(origin)
      this.busy = false
      if (!ok) {
        this.error = 'hosted.unreachable'
        return
      }
      chooseInstance(origin)
      this.onChosen(origin)
    },
  },
}
</script>

<style lang="scss">
.InstancePicker {
  display: grid;
  grid-template-columns: minmax(0, 28em);
  place-content: center;
  min-height: 100vh;
  padding: 1em;
  box-sizing: border-box;

  .panel-body {
    padding: 0 1em 1em;

    p {
      padding: 0;
      margin: 1em 0 0;
    }
  }

  .instance-picker-title {
    margin: 0;
    font-size: 1.2em;
  }

  .instance-picker-label {
    display: block;
    margin: 1em 0 0.3em;
    font-weight: 600;
  }

  .instance-picker-row {
    display: flex;
    gap: 0.5em;

    .input {
      flex: 1 1 auto;
      min-width: 0;
    }
  }

  .instance-picker-error {
    margin-top: 0.75em;
  }

  .instance-picker-note {
    margin-top: 1em;
    font-size: 0.9em;
  }
}
</style>
