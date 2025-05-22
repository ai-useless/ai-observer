<template>
  <div
    style='
      position: fixed;
      bottom: 0;
      width: 100%;
      background: transparent;
      z-index: 1000;
      max-width: min(100%, 600px);
      border-radius: 16px;
      margin-bottom: 16px;
    '
  >
    <slot />
  </div>
</template>

<script setup lang='ts'>
</script>

<style scoped lang='sass'>
</style>
