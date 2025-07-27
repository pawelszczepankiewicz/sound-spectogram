// File: pages/index.vue
<template>
  <div class="container">
    <FileUpload @file-uploaded="handleFileUpload" :current-file="currentFile" />

    <LoadingSpinner v-if="isLoading" message="Analyzing audio file..." />

    <SpectrogramViewer
      v-if="audioUrl && !isLoading"
      :audio-url="audioUrl"
      :file-name="currentFile?.name"
      @remove-file="removeFile"
    />
  </div>
</template>

<script setup>
import { ref, onUnmounted } from "vue";

const currentFile = ref(null);
const audioUrl = ref(null);
const isLoading = ref(false);

const handleFileUpload = async (file) => {
  isLoading.value = true;
  currentFile.value = file;

  // Create object URL for the audio file
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value);
  }

  audioUrl.value = URL.createObjectURL(file);

  // Simulate processing time
  setTimeout(() => {
    isLoading.value = false;
  }, 1000);
};

const removeFile = () => {
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value);
  }
  currentFile.value = null;
  audioUrl.value = null;
};

// Cleanup on unmount
onUnmounted(() => {
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value);
  }
});
</script>

<style lang="scss" scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}
</style>
