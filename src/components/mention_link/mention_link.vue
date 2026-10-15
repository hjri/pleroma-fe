<template>
  <span
    class="MentionLink"
  >
    <a
      v-if="!user"
      :href="url"
      class="original"
      target="_blank"
      v-html="content"
    />
    <UserPopover
      v-else
      class="new"
      :class="{ '-no-link-click': shouldShowTooltip }"
      :user-id="user.id"
      :disabled="!shouldShowTooltip"
      v-bind="popoverAttrs"
    >
      <router-link
        :to="link"
        custom
        v-slot="{ href, navigate }"
      >
        <a
          :href="href"
          @click.left.exact.prevent="e => onClick(e, navigate)"
          :aria-label="$t('user_card.open_profile')"
        >
          <UserAvatar
            v-if="shouldShowAvatar"
            class="mention-avatar"
            :user-id="user.id"
          /><span
            class="shortName"
          >@<span
            class="userName"
            v-html="userName"
          /><span
            v-if="shouldShowFullUserName"
            class="serverName"
            :class="{ '-faded': shouldFadeDomain }"
            v-html="'@' + serverName"
          /><UnicodeDomainIndicator
            v-if="shouldShowFullUserName"
            :user="user"
          />
          </span>
          <span
            v-if="isYou && shouldShowYous"
            :class="{ '-you': shouldBoldenYou }"
          > {{ ' ' + $t('status.you') }}</span>
        </a>
      </router-link>
    </UserPopover>
    <span
      v-if="user"
      ref="full"
      class="full"
      aria-hidden="true"
    >
      <!-- eslint-disable vue/no-v-html -->
      @<span v-html="userName" /><span v-html="'@' + serverName" />
      <!-- eslint-enable vue/no-v-html -->
    </span>
  </span>
</template>

<script src="./mention_link.js" />

<style lang="scss" src="./mention_link.scss" />
