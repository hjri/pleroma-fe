<template>
  <div class="rightside-button scroll-to-top">
    <button
      class="button-unstyled scroll-to-top-button"
      type="button"
      :title="$t('general.scroll_to_top')"
      @click="scrollToTop"
    >
      <FALayers class="fa-scale-110 fa-old-padding-layer">
        <FAIcon icon="arrow-up" />
        <FAIcon
          icon="minus"
          transform="up-7"
        />
      </FALayers>
    </button>
  </div>
</template>

<script src="./scroll_top_button.js"></script>
<style lang="scss">
.scroll-to-top {
  display: none;
}

.-scrolled .scroll-to-top {
  display: inline-block;
}
</style>
