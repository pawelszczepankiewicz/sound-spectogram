<template>
  <div class="loading">
    <div class="spinner"></div>
    <p>{{ message }}</p>
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: "Loading...",
  },
});
</script>

<style lang="scss" scoped>
.loading {
  text-align: center;
  padding: 3rem;
  animation: fadeIn 0.3s ease-out;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 3px solid $border;
  border-top-color: $accent;
  border-radius: 50%;
  margin: 0 auto 1rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

p {
  color: $text-secondary;
}
</style>
