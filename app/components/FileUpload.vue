// File: components/FileUpload.vue
<template>
  <section class="upload-section">
    <div class="upload-options">
      <div class="option-tabs">
        <button 
          class="tab-button"
          :class="{ active: activeTab === 'upload' }"
          @click="activeTab = 'upload'"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
          Upload File
        </button>
        <button 
          class="tab-button"
          :class="{ active: activeTab === 'record' }"
          @click="activeTab = 'record'"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
          Record Audio
        </button>
      </div>
    </div>

    <div v-if="activeTab === 'upload'" class="upload-tab">
      <div
        class="upload-area"
        :class="{ dragging: isDragging }"
        @click="triggerFileInput"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <UploadIcon class="upload-icon" />
        <div class="upload-text">
          <h3>Drop your audio file here</h3>
          <p>or click to browse</p>
          <button class="upload-button" @click.stop="triggerFileInput">
            <span>Choose File</span>
          </button>
        </div>
        <input
          ref="fileInput"
          type="file"
          class="file-input"
          accept="audio/*"
          @change="handleFileSelect"
        />
      </div>
    </div>

    <div v-if="activeTab === 'record'" class="record-tab">
      <MicrophoneRecorder @recording-ready="handleRecording" />
    </div>

    <div class="file-info" v-if="currentFile">
      <div class="file-details">
        <span class="file-name">{{ currentFile.name }}</span>
        <span class="file-source">{{ fileSource }}</span>
        <button class="remove-file" @click="$emit('file-uploaded', null)">
          Remove
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  currentFile: Object,
});

const emit = defineEmits(["file-uploaded"]);

const fileInput = ref(null);
const isDragging = ref(false);
const activeTab = ref('upload');
const fileSource = ref('');

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleDragOver = () => {
  isDragging.value = true;
};

const handleDragLeave = () => {
  isDragging.value = false;
};

const handleDrop = (e) => {
  isDragging.value = false;
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    validateAndEmitFile(files[0]);
  }
};

const handleFileSelect = (e) => {
  const files = e.target.files;
  if (files?.length > 0) {
    validateAndEmitFile(files[0]);
  }
};

const validateAndEmitFile = (file) => {
  if (!file.type.startsWith("audio/")) {
    alert("Please upload an audio file");
    return;
  }
  fileSource.value = 'Uploaded File';
  emit("file-uploaded", file);
};

const handleRecording = (recordedFile) => {
  fileSource.value = 'Recorded Audio';
  emit("file-uploaded", recordedFile);
  activeTab.value = 'upload'; // Switch back to upload tab after recording
};
</script>

<style lang="scss" scoped>
.upload-section {
  background: $bg-secondary;
  border-radius: 20px;
  padding: 3rem;
  margin-bottom: 3rem;
  border: 1px solid $border;
  animation: fadeInUp 0.8s ease-out;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, $accent, transparent);
    animation: shimmer 3s linear infinite;
  }

  @include mobile {
    padding: 2rem;
  }
}

.upload-options {
  margin-bottom: 2rem;
}

.option-tabs {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 2rem;

  @include mobile {
    flex-direction: column;
  }
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid $border;
  background: $bg-tertiary;
  color: $text-secondary;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;

  &:hover {
    border-color: $accent;
    color: $text-primary;
  }

  &.active {
    background: $accent;
    border-color: $accent;
    color: white;
  }

  svg {
    width: 20px;
    height: 20px;
  }
}

.upload-tab,
.record-tab {
  animation: fadeIn 0.3s ease-out;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.upload-area {
  border: 2px dashed $border;
  border-radius: 15px;
  padding: 4rem 2rem;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  background: $bg-tertiary;

  &:hover {
    border-color: $accent;
    background: rgba($accent, 0.05);
  }

  &.dragging {
    border-color: $accent;
    background: rgba($accent, 0.1);
    transform: scale(1.02);
  }
}

.upload-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  opacity: 0.7;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.upload-text {
  h3 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  p {
    color: $text-secondary;
    margin-bottom: 1.5rem;
  }
}

.file-input {
  display: none;
}

.upload-button {
  @include button-primary;
}

.file-info {
  margin-top: 2rem;
  padding: 1.5rem;
  background: $bg-tertiary;
  border-radius: 10px;
  animation: fadeIn 0.5s ease-out;
}

.file-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.file-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: $success;
}

.file-source {
  font-size: 0.9rem;
  color: $text-secondary;
  background: $bg-primary;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  border: 1px solid $border;
}

.remove-file {
  @include button-danger;
}
</style>
