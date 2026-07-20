<template>
  <time
    :datetime="time"
    :title="localeDateString"
  >
    {{ relativeOrAbsoluteTimeString }}
  </time>
</template>

<script src="./timeago.js" />
