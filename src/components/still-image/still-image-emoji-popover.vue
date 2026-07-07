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

        <template v-if="isUserAdmin && !isLocal">
          <span
            v-if="adminPacksLocalLoading"
            class="loading-spinner"
          >
            <FAIcon
              class="fa-old-padding"
              spin
              icon="circle-notch"
            />
          </span>
          <div v-else>
            <button
              class="button button-default btn emoji-popover-button"
              type="button"
              :disabled="packName == ''"
              @click="copyToLocalPack"
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
                v-for="(pack, listPackName) in adminPacksLocal"
                :key="listPackName"
                :label="listPackName"
              >
                {{ listPackName }}
              </option>
            </SelectComponent>
          </div>
        </template>
      </div>
    </template>
  </Popover>
</template>

<script src="./still-image-emoji-popover" />

<style>
  .emoji-popover {
    margin: 0 0.5em 0.5em;
    text-align: center;

    .emoji {
      width: calc(var(--emoji-size) * 3);
      height: calc(var(--emoji-size) * 3);
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
