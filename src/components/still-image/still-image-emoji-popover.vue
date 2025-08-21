<template>
  <Popover
    ref="emojiPopover"
    trigger="click"
    placement="top"
    :bound-to="{ x: 'container' }"
    :offset="{ y: 10 }"
    @show="fetchEmojiPacksIfAdmin"
  >
    <template #trigger>
      <StillImage v-bind="$attrs" />
    </template>
    <template #content>
      <div class="emoji-popover">
        <h3>{{ $attrs.title }}</h3>

        <div class="emoji-popover-centered">
          <StillImage
            class="emoji"
            v-bind="$attrs"
          />
        </div>

        <div v-if="isUserAdmin && !isLocal">
          <button
            class="button button-default btn emoji-popover-button"
            type="button"
            @click="copyToLocalPack"
            :disabled="packName == ''"
          >
            {{ $t('admin_dash.emoji.copy_to_pack') }}
          </button>

          <SelectComponent
            v-model="packName"
          >
            <option
              value=""
              disabled
              hidden
            >
              {{ $t('admin_dash.emoji.emoji_pack') }}
            </option>
            <option
              v-for="(pack, listPackName) in knownLocalPacks"
              :key="listPackName"
              :label="listPackName"
            >
              {{ listPackName }}
            </option>
          </SelectComponent>
        </div>
      </div>
    </template>
  </Popover>
</template>

<script>
  import { assign } from 'lodash'

  import StillImage from './still-image.vue'
  import Popover from 'components/popover/popover.vue'
  import SelectComponent from 'components/select/select.vue'
  import { useInterfaceStore } from 'src/stores/interface'

  export default {
    components: { StillImage, Popover, SelectComponent },
    props: {
      shortcode: {
        type: String,
        required: true
      },
      isLocal: {
        type: Boolean,
        required: true
      }
    },
    data() {
      return {
        knownLocalPacks: { },
        packName: ""
      }
    },
    computed: {
      isUserAdmin () {
        return this.$store.state.users.currentUser.rights.admin
      }
    },
    methods: {
      displayError (msg) {
        useInterfaceStore().pushGlobalNotice({
          messageKey: 'admin_dash.emoji.error',
          messageArgs: [msg],
          level: 'error'
        })
      },
      copyToLocalPack() {
        this.$store.state.api.backendInteractor.addNewEmojiFile({
          packName: this.packName,
          file: this.$attrs.src,
          shortcode: this.shortcode,
          filename: ""
        }).then(resp => resp.json()).then(resp => {
          if (resp.error !== undefined) {
            this.displayError(resp.error)
            return
          }
          useInterfaceStore().pushGlobalNotice({
            messageKey: 'admin_dash.emoji.copied_successfully',
            messageArgs: [this.shortcode, this.packName],
            level: 'success'
          })

          this.$refs.emojiPopover.hidePopover()
          this.packName = ''
        })
      },

      // Copied from emoji_tab.js
      loadPacksPaginated (listFunction) {
        const pageSize = 25
        const allPacks = {}

        return listFunction({ instance: this.$store.state.instance.server, page: 1, pageSize: 0 })
          .then(data => data.json())
          .then(data => {
            if (data.error !== undefined) { return Promise.reject(data.error) }

            let resultingPromise = Promise.resolve({})
            for (let i = 0; i < Math.ceil(data.count / pageSize); i++) {
              resultingPromise = resultingPromise.then(() => listFunction({ instance: this.$store.state.instance.server, page: i, pageSize })
              ).then(data => data.json()).then(pageData => {
                if (pageData.error !== undefined) { return Promise.reject(pageData.error) }

                assign(allPacks, pageData.packs)
              })
            }

            return resultingPromise
          })
          .then(() => allPacks)
          .catch(data => {
            this.displayError(data)
          })
      },
      fetchEmojiPacksIfAdmin() {
        if (!this.isUserAdmin) return

        this.loadPacksPaginated(this.$store.state.api.backendInteractor.listEmojiPacks)
            .then(allPacks => {
              // Sort by key
              const sorted = Object.keys(allPacks).sort().reduce((acc, key) => {
                if (key.length === 0) return acc
                acc[key] = allPacks[key]
                return acc
              }, {})
              this.knownLocalPacks = sorted
            })
      }
    }
  }
</script>

<style>
  .emoji-popover {
    margin: 0 0.5em 0.5em;
    text-align: center;

    .emoji {
      width: 4.6em;
      height: 4.6em;
    }

    .emoji-popover-centered {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .emoji-popover-button {
      width: 100%;
      margin-top: 0.5em;
    }

    .Select {
      width: 100%;
    }
  }
</style>
