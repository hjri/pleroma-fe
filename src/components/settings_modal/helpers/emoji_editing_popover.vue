<template>
  <Popover
    ref="emojiPopover"
    trigger="click"
    :placement="placement"
    bound-to-selector=".emoji-list"
    popover-class="emoji-tab-edit-popover popover-default"
    :bound-to="{ x: 'container' }"
    :offset="{ y: 5 }"
    :class="{'emoji-unsaved': isEdited}"
  >
    <template #trigger>
      <slot name="trigger" />
    </template>
    <template #content>
      <h3>
        {{ title }}
      </h3>

      <StillImage
        v-if="emojiPreview"
        class="emoji"
        :src="emojiPreview"
      />
      <div
        v-else
        class="emoji"
      />

      <div
        v-if="newUpload"
        class="emoji-tab-popover-new-upload"
      >
        <h4>{{ $t('admin_dash.emoji.emoji_source') }}</h4>

        <div class="emoji-tab-popover-input">
          <input
            type="file"
            accept="image/*"
            class="emoji-tab-popover-file input"
            @change="uploadFile = $event.target.files"
          >
        </div>
        <div class="emoji-tab-popover-input ">
          <input
            v-model="uploadURL"
            :placeholder="$t('admin_dash.emoji.upload_url')"
            class="emoji-data-input input"
          >
        </div>
      </div>

      <div>
        <div class="emoji-tab-popover-input">
          <label>
            {{ $t('admin_dash.emoji.shortcode') }}
            <input
              v-model="editedShortcode"
              class="emoji-data-input input"
              :placeholder="$t('admin_dash.emoji.new_shortcode')"
            >
          </label>
        </div>

        <div class="emoji-tab-popover-input">
          <label>
            {{ $t('admin_dash.emoji.filename') }}

            <input
              v-model="editedFile"
              class="emoji-data-input input"
              :placeholder="$t('admin_dash.emoji.new_filename')"
            >
          </label>
        </div>

        <div
          v-if="remote !== undefined"
          class="emoji-tab-popover-input"
        >
          <label>
            {{ $t('admin_dash.emoji.copy_to') }}

            <SelectComponent
              v-model="copyToPack"
              class="form-control"
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
          </label>
        </div>

        <!--
             For local emojis, disable the button if nothing was edited.
             For remote emojis, also disable it if a local pack is not selected.
             Remote emojis are processed by the same function that uploads new ones, as that is effectively what it does
        -->
        <button
          class="button button-default btn"
          type="button"
          :disabled="saveButtonDisabled"
          @click="(newUpload || remote !== undefined) ? uploadEmoji() : saveEditedEmoji()"
        >
          {{ $t('admin_dash.emoji.save') }}
        </button>

        <template v-if="!newUpload && remote === undefined">
          <button
            class="button button-default btn emoji-tab-popover-button"
            type="button"
            @click="deleteModalVisible = true"
          >
            {{ $t('admin_dash.emoji.delete') }}
          </button>
          <button
            class="button button-default btn emoji-tab-popover-button"
            type="button"
            @click="revertEmoji"
          >
            {{ $t('admin_dash.emoji.revert') }}
          </button>
          <ConfirmModal
            v-if="deleteModalVisible"
            :title="$t('admin_dash.emoji.delete_title')"
            :cancel-text="$t('status.delete_confirm_cancel_button')"
            :confirm-text="$t('status.delete_confirm_accept_button')"
            @cancelled="deleteModalVisible = false"
            @accepted="deleteEmoji"
          >
            {{ $t('admin_dash.emoji.delete_confirm', [shortcode]) }}
          </ConfirmModal>
        </template>
      </div>
    </template>
  </Popover>
</template>

<script>
import Popover from 'components/popover/popover.vue'
import SelectComponent from 'components/select/select.vue'
import { defineAsyncComponent } from 'vue'

import { useOAuthStore } from 'src/stores/oauth.js'

import {
  addNewEmojiFile,
  deleteEmojiFile,
  updateEmojiFile,
} from 'src/api/admin.js'

export default {
  components: {
    Popover,
    ConfirmModal: defineAsyncComponent(
      () => import('src/components/confirm_modal/confirm_modal.vue'),
    ),

    SelectComponent,
  },

  inject: ['emojiAddr'],
  props: {
    placement: {
      type: String,
      required: true,
    },

    newUpload: Boolean,

    title: {
      type: String,
      required: true,
    },
    packName: {
      type: String,
      required: true,
    },
    shortcode: {
      type: String,
      // Only exists when this is not a new upload
      default: '',
    },
    file: {
      type: String,
      // Only exists when this is not a new upload
      default: '',
    },

    // Only exists for emojis from remote packs
    remote: {
      type: Object,
      default: undefined,
    },
    knownLocalPacks: {
      type: Object,
      default: undefined,
    },
  },
  emits: ['updatePackFiles', 'displayError'],
  data() {
    return {
      uploadFile: [],
      uploadURL: '',
      editedShortcode: this.shortcode,
      editedFile: this.file,
      deleteModalVisible: false,
      copyToPack: '',
    }
  },
  computed: {
    emojiPreview() {
      if (this.newUpload && this.uploadFile.length > 0) {
        return URL.createObjectURL(this.uploadFile[0])
      } else if (this.newUpload && this.uploadURL !== '') {
        return this.uploadURL
      } else if (!this.newUpload) {
        return this.emojiAddr(this.file)
      }

      return null
    },
    isEdited() {
      return (
        !this.newUpload &&
        (this.editedShortcode !== this.shortcode ||
          this.editedFile !== this.file)
      )
    },
    saveButtonDisabled() {
      if (this.remote === undefined)
        return this.newUpload
          ? this.uploadURL === '' && this.uploadFile.length == 0
          : !this.isEdited
      else return this.copyToPack === ''
    },
  },
  methods: {
    saveEditedEmoji() {
      if (!this.isEdited) return

      updateEmojiFile({
        packName: this.packName,
        shortcode: this.shortcode,
        newShortcode: this.editedShortcode,
        newFilename: this.editedFile,
        force: false,
        credentials: useOAuthStore().token,
      })
        .then((resp) => {
          if (resp.error !== undefined) {
            this.$emit('displayError', resp.error)
            throw new Error(resp.error)
          }

          return resp.json()
        })
        .then((resp) => this.$emit('updatePackFiles', resp))
    },
    uploadEmoji() {
      let packName = this.remote === undefined ? this.packName : this.copyToPack
      addNewEmojiFile({
        packName: packName,
        file:
          this.remote === undefined
            ? this.uploadURL !== ''
              ? this.uploadURL
              : this.uploadFile[0]
            : this.emojiAddr(this.file),
        shortcode: this.editedShortcode,
        filename: this.editedFile,
        credentials: useOAuthStore().token,
      })
        .then((resp) => resp.json())
        .then((resp) => {
          if (resp.error !== undefined) {
            this.$emit('displayError', resp.error)
            return
          }

          this.$emit('updatePackFiles', resp, packName)
          this.$refs.emojiPopover.hidePopover()

          this.editedFile = ''
          this.editedShortcode = ''
          this.uploadFile = []
        })
    },
    revertEmoji() {
      this.editedFile = this.file
      this.editedShortcode = this.shortcode
    },
    deleteEmoji() {
      this.deleteModalVisible = false

      deleteEmojiFile({
        packName: this.packName,
        shortcode: this.shortcode,
        credentials: useOAuthStore().token,
      })
        .then((resp) => resp.json())
        .then((resp) => {
          if (resp.error !== undefined) {
            this.$emit('displayError', resp.error)
            return
          }

          this.$emit('updatePackFiles', resp, this.packName)
        })
    },
  },
}
</script>

<style lang="scss">
  .emoji-tab-edit-popover {
    padding-left: 0.5em;
    padding-right: 0.5em;
    padding-bottom: 0.5em;

    .emoji-tab-popover-new-upload {
      margin-bottom: 2em;
    }

    .emoji {
      width: 2.3em;
      height: 2.3em;
    }

    .Select {
      display: inline-block;
    }

    h4 {
      margin-bottom: 1em;
      margin-top: 1em;
    }
  }
</style>
