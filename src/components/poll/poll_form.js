import Select from 'src/components/select/select.vue'

import { useInstanceStore } from 'src/stores/instance.js'

import * as DateUtils from 'src/services/date_utils/date_utils.js'
import { pollFallback } from 'src/services/poll/poll.service.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faPlus, faTimes } from '@fortawesome/free-solid-svg-icons'

library.add(faTimes, faPlus)

export default {
  components: {
    Select,
  },
  name: 'PollForm',
  props: {
    visible: Boolean,
    modelValue: {
      type: Object,
      required: false,
      default: null,
    },
  },
  emits: ['update:modelValue'],
  computed: {
    // Model value
    options() {
      return pollFallback(this.modelValue, 'options')
    },
    pollType: {
      get() {
        return pollFallback(this.modelValue, 'pollType')
      },
      set(newVal) {
        this.$emit('update:modelValue', {
          ...this.modelValue,
          pollType: newVal,
        })
      },
    },
    expiryAmount: {
      get() {
        return pollFallback(this.modelValue, 'expiryAmount')
      },
      set(newVal) {
        this.$emit('update:modelValue', {
          ...this.modelValue,
          expiryAmount: newVal,
        })
      },
    },
    expiryUnit: {
      get() {
        return pollFallback(this.modelValue, 'expiryUnit')
      },
      set(newVal) {
        this.$emit('update:modelValue', {
          ...this.modelValue,
          expiryUnit: newVal,
        })
      },
    },

    // Configuration
    pollLimits() {
      return useInstanceStore().limits.pollLimits
    },
    maxOptions() {
      return this.pollLimits.max_options
    },
    maxLength() {
      return this.pollLimits.max_option_chars
    },
    expiryUnits() {
      const allUnits = ['minutes', 'hours', 'days']
      const expiry = this.convertExpiryFromUnit
      return allUnits.filter(
        (unit) => this.pollLimits.max_expiration >= expiry(unit, 1),
      )
    },
    minExpirationInCurrentUnit() {
      return Math.ceil(
        this.convertExpiryToUnit(
          this.expiryUnit,
          this.pollLimits.min_expiration,
        ),
      )
    },
    maxExpirationInCurrentUnit() {
      return Math.floor(
        this.convertExpiryToUnit(
          this.expiryUnit,
          this.pollLimits.max_expiration,
        ),
      )
    },
  },
  methods: {
    nextOption(index) {
      const element = this.$el.querySelector(`#poll-${index + 1}`)
      if (element) {
        element.focus()
      } else {
        // Try adding an option and try focusing on it
        const addedOption = this.addOption()
        if (addedOption) {
          this.$nextTick(function () {
            this.nextOption(index)
          })
        }
      }
    },
    addOption() {
      if (this.options.length < this.maxOptions) {
        this.$emit('update:modelValue', {
          ...this.modelValue,
          options: [...this.options, '']
        })

        return true
      }
      return false
    },
    deleteOption(index) {
      if (this.options.length > 2) {
        const options = [...this.options]
        options.splice(index, 1)

        this.$emit('update:modelValue', {
          ...this.modelValue,
          options
        })
      }
    },
    updateOption(index, value) {
      const options = [...this.options]
      options[index] = value

      this.$emit('update:modelValue', {
        ...this.modelValue,
        options
      })
    },
    convertExpiryToUnit(unit, amount) {
      // Note: we want seconds and not milliseconds
      return DateUtils.secondsToUnit(unit, amount)
    },
    convertExpiryFromUnit(unit, amount) {
      return DateUtils.unitToSeconds(unit, amount)
    },
    expiryAmountChange() {
      this.expiryAmount = Math.max(
        this.minExpirationInCurrentUnit,
        this.expiryAmount,
      )
      this.expiryAmount = Math.min(
        this.maxExpirationInCurrentUnit,
        this.expiryAmount,
      )
    },
  },
}
