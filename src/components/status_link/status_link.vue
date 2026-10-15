<template>
  <StatusPopover
    class="StatusLink"
    :class="{ '-link': link }"
    :status-id="statusId"
    @click.left.exact="onPopoverClick"
  >
    <template v-if="link">
      <router-link
        :to="destination"
        custom
        v-slot="{ href, navigate }"
      >
        <a
          :href="href"
          @click.left.exact.prevent="e => onLinkClick(e, navigate)"
        >
          <slot />
        </a>
      </router-link>
    </template>
    <template v-else>
      <slot />
    </template>
  </StatusPopover>
</template>
<script src="./status_link.js" />
<style src="./status_link.scss" />
