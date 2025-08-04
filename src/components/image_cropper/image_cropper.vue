<template>
  <div class="image-cropper">
    <div class="image">
      <cropper-canvas
        ref="cropperCanvas"
        background
        class="image-cropper-canvas"
        height="100%"
      >
        <cropper-image
          v-if="dataUrl"
          ref="cropperImage"
          :src="dataUrl"
          alt="Picture"
          class="image-cropper-image"
          translatable
          scalable
        />
        <cropper-shade hidden />
        <cropper-handle
          action="select"
          plain
        />
        <cropper-selection
          ref="cropperSelection"
          initial-coverage="0.9"
          :aspect-ratio="aspectRatio"
          movable
          resizable
          @change="onCropperSelectionChange"
        >
          <cropper-grid
            role="grid"
            covered
          />
          <cropper-crosshair centered />
          <cropper-handle
            action="move"
            theme-color="rgba(255, 255, 255, 0.35)"
          />
          <cropper-handle action="n-resize" />
          <cropper-handle action="e-resize" />
          <cropper-handle action="s-resize" />
          <cropper-handle action="w-resize" />
          <cropper-handle action="ne-resize" />
          <cropper-handle action="nw-resize" />
          <cropper-handle action="se-resize" />
          <cropper-handle action="sw-resize" />
        </cropper-selection>
      </cropper-canvas>
    </div>
    <input
      ref="input"
      type="file"
      class="input image-cropper-img-input"
      :accept="mimes"
    />
  </div>
</template>

<script src="./image_cropper.js"></script>

<style lang="scss">
.image-cropper {
  display: flex;
  flex-direction: column;

  &-canvas, .image {
    height: 100%;
  }

  & &-img-input {
    display: none;
  }

  &-buttons-wrapper {
    display: grid;
    grid-gap: 0.5em;
    grid-template-columns: 1fr 1fr 1fr;

    button {
      margin-top: 1em;
    }
  }
}
</style>
