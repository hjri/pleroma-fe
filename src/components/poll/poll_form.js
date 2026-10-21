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
      // the unit and the amount it allows in one update: a second one in
      // the same tick would start from the old unit (the prop catches up
      // only on the parent's next render)
      set(newVal) {
        this.$emit('update:modelValue', {
          ...this.modelValue,
          expiryUnit: newVal,
          expiryAmount: this.clampExpiry(newVal, this.expiryAmount),
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
      return this.expiryLimits(this.expiryUnit).min
    },
    maxExpirationInCurrentUnit() {
      return this.expiryLimits(this.expiryUnit).max
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
          options: [...this.options, ''],
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
          options,
        })
      }
    },
    updateOption(index, value) {
      const options = [...this.options]
      options[index] = value

      this.$emit('update:modelValue', {
        ...this.modelValue,
        options,
      })
    },
    convertExpiryToUnit(unit, amount) {
      // Note: we want seconds and not milliseconds
      return DateUtils.secondsToUnit(unit, amount)
    },
    convertExpiryFromUnit(unit, amount) {
      return DateUtils.unitToSeconds(unit, amount)
    },
    expiryLimits(unit) {
      return {
        min: Math.ceil(
          this.convertExpiryToUnit(unit, this.pollLimits.min_expiration),
        ),
        max: Math.floor(
          this.convertExpiryToUnit(unit, this.pollLimits.max_expiration),
        ),
      }
    },
    clampExpiry(unit, amount) {
      const { min, max } = this.expiryLimits(unit)
      return Math.min(max, Math.max(min, Number(amount)))
    },
    // from the field itself: the prop can still hold the value before
    expiryAmountChange(event) {
      this.expiryAmount = this.clampExpiry(this.expiryUnit, event.target.value)
    },
  },
}
