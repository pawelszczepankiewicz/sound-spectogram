<template>
  <div class="app-layout">
    <div class="bg-animation"></div>
    <AppHeader />
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup>
// Layout setup
</script>

<style lang="scss" scoped>
.app-layout {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

.bg-animation {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: -1;
  background: linear-gradient(135deg, $bg-primary 0%, $bg-secondary 100%);
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    width: 200%;
    height: 200%;
    top: -50%;
    left: -50%;
    background: radial-gradient(circle, rgba($accent, 0.1) 0%, transparent 70%);
    animation: pulse 15s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.3;
  }
}

.main-content {
  position: relative;
  z-index: 1;
}
</style>
