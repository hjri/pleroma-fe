<template>
  <div class="theme-preview-container">
    <div class="underlay underlay-preview" />
    <div class="panel dummy">
      <div class="panel-heading">
        <h1 class="title">
          {{ $t('settings.style.preview.header') }}
          <span class="badge -notification">
            99
          </span>
        </h1>
        <span class="faint">
          {{ $t('settings.style.preview.header_faint') }}
        </span>
        <span class="alert error">
          {{ $t('settings.style.preview.error') }}
        </span>
        <button class="btn button-default">
          {{ $t('settings.style.preview.button') }}
        </button>
      </div>
      <div class="panel-body theme-preview-content">
        <div class="post">
          <div class="avatar still-image">
            ( ͡° ͜ʖ ͡°)
          </div>
          <div class="content">
            <h4>
              {{ $t('settings.style.preview.content') }}
            </h4>

            <i18n-t
              scope="global"
              keypath="settings.style.preview.text"
            >
              <code style="font-family: var(--postCodeFont);">
                {{ $t('settings.style.preview.mono') }}
              </code>
              <a style="color: var(--link);">
                {{ $t('settings.style.preview.link') }}
              </a>
            </i18n-t>

            <div class="icons">
              <FAIcon
                fixed-width
                style="color: var(--cBlue);"
                class="fa-scale-110 fa-old-padding"
                icon="reply"
              />
              <FAIcon
                fixed-width
                style="color: var(--cGreen);"
                class="fa-scale-110 fa-old-padding"
                icon="retweet"
              />
              <FAIcon
                fixed-width
                style="color: var(--cOrange);"
                class="fa-scale-110 fa-old-padding"
                icon="star"
              />
              <FAIcon
                fixed-width
                style="color: var(--cRed);"
                class="fa-scale-110 fa-old-padding"
                icon="times"
              />
            </div>
          </div>
        </div>

        <div class="after-post">
          <div class="avatar-alt">
            :^)
          </div>
          <div class="content">
            <i18n-t
              keypath="settings.style.preview.fine_print"
              tag="span"
              class="faint"
              scope="global"
            >
              <a style="color: var(--linkFaint);">
                {{ $t('settings.style.preview.faint_link') }}
              </a>
            </i18n-t>
          </div>
        </div>
        <div class="separator" />

        <span class="alert error">
          {{ $t('settings.style.preview.error') }}
        </span>
        <input
          :value="$t('settings.style.preview.input')"
          type="text"
          class="input"
        >

        <div class="actions">
          <Checkbox>
            {{ $t('settings.style.preview.checkbox') }}
          </Checkbox>
          <button class="btn button-default">
            {{ $t('settings.style.preview.button') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Checkbox from 'src/components/checkbox/checkbox.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faTimes,
  faStar,
  faRetweet,
  faReply
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faTimes,
  faStar,
  faRetweet,
  faReply
)

export default {
  components: {
    Checkbox
  }
}
</script>

<style lang="scss">
.theme-preview-container {
  position: relative;
  border-top: 1px dashed;
  border-bottom: 1px dashed;
  border-color: var(--border);
  margin: 1em 0;
  padding: 1em;
  background-color: var(--wallpaper);
  background-image: var(--body-background-image);
  background-size: cover;
  background-position: 50% 50%;

  .theme-preview-content {
    padding: 20px;
  }

  .dummy {
    .post {
      font-family: var(--postFont);
      display: flex;

      .content {
        flex: 1;

        h4 {
          margin-bottom: 0.25em;
        }

        .icons {
          margin-top: 0.5em;
          display: flex;

          i {
            margin-right: 1em;
          }
        }
      }
    }

    .after-post {
      margin-top: 1em;
      display: flex;
      align-items: center;
    }

    .avatar,
    .avatar-alt {
      background:
        linear-gradient(
          135deg,
          #b8e1fc 0%,
          #a9d2f3 10%,
          #90bae4 25%,
          #90bcea 37%,
          #90bff0 50%,
          #6ba8e5 51%,
          #a2daf5 83%,
          #bdf3fd 100%
        );
      color: black;
      font-family: sans-serif;
      text-align: center;
      margin-right: 1em;
    }

    .avatar-alt {
      flex: 0 auto;
      margin-left: 28px;
      font-size: 12px;
      min-width: 20px;
      min-height: 20px;
      line-height: 20px;
    }

    .avatar {
      flex: 0 auto;
      width: 48px;
      height: 48px;
      font-size: 14px;
      line-height: 48px;
    }

    .actions {
      display: flex;
      align-items: baseline;

      .checkbox {
        margin-right: 1em;
        flex: 1;
      }
    }

    .separator {
      margin: 1em;
      border-bottom: 1px solid;
      border-color: var(--border);
    }

    .btn {
      min-width: 3em;
    }
  }

  .underlay-preview {
    position: absolute;
    inset: 0 10px;
  }
}
 </style>
