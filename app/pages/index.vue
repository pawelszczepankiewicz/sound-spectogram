<template>
  <div class="container">
    <div class="mode-selector">
      <button 
        class="mode-button"
        :class="{ active: mode === 'analyze' }"
        @click="setModeAnalyze"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
        </svg>
        Analyze Audio
      </button>
      <button 
        class="mode-button"
        :class="{ active: mode === 'create' }"
        @click="setModeCreate"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.71,4.63L19.37,3.29C19,2.9 18.35,2.9 17.96,3.29L9,12.25L11.75,15L20.71,6.04C21.1,5.65 21.1,5 20.71,4.63M7,14A3,3 0 0,0 4,17C4,18.31 2.84,19 2,19C2.92,20.22 4.5,21 6,21A4,4 0 0,0 10,17A3,3 0 0,0 7,14Z"/>
        </svg>
        Draw Sound
      </button>
    </div>

    <div v-if="mode === 'analyze'">
      <FileUpload @file-uploaded="handleFileUpload" :current-file="currentFile" />

      <LoadingSpinner v-if="isLoading" message="Analyzing audio file..." />

      <SpectrogramViewer
        v-if="audioUrl && !isLoading"
        :audio-url="audioUrl"
        :file-name="currentFile?.name"
        @remove-file="removeFile"
        @audio-generated="handleGeneratedAudio"
      />
    </div>

    <div v-if="mode === 'create'" class="create-mode">
      <div class="create-header">
        <h2>Draw Your Sound</h2>
        <p>Create audio by drawing frequency patterns on the spectrogram canvas</p>
      </div>
      
      <SpectrogramDrawer 
        :width="800"
        :height="256"
        :sample-rate="44100"
        :duration="5"
        @audio-generated="handleGeneratedAudio"
      />
      
      <SpectrogramViewer
        v-if="audioUrl && !isLoading && currentFile"
        :audio-url="audioUrl"
        :file-name="currentFile?.name"
        @remove-file="removeFile"
        @audio-generated="handleGeneratedAudio"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from "vue";

// Reactive state
const mode = ref('analyze');
const currentFile = ref(null);
const audioUrl = ref(null);
const isLoading = ref(false);

// Mode switching methods
const setModeAnalyze = () => {
  mode.value = 'analyze';
};

const setModeCreate = () => {
  mode.value = 'create';
};

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

const handleGeneratedAudio = (audioBlob) => {
  // Create a new file from the generated audio
  const generatedFile = new File([audioBlob], `synthesized-audio-${Date.now()}.wav`, {
    type: 'audio/wav',
    lastModified: Date.now()
  });
  
  // Set up the generated audio for analysis
  handleFileUpload(generatedFile);
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

.mode-selector {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 3rem;
  
  @include mobile {
    flex-direction: column;
    align-items: center;
  }
}

.mode-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  border: 2px solid $border;
  background: $bg-secondary;
  color: $text-secondary;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: 1.1rem;

  &:hover {
    border-color: $accent;
    color: $text-primary;
    transform: translateY(-2px);
  }

  &.active {
    background: $accent;
    border-color: $accent;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba($accent, 0.3);
  }

  svg {
    width: 20px;
    height: 20px;
  }
}

.create-mode {
  animation: fadeInUp 0.8s ease-out;
}

.create-header {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem;
  background: $bg-secondary;
  border-radius: 20px;
  border: 1px solid $border;

  h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    background: linear-gradient(45deg, $accent, $accent-hover);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  p {
    font-size: 1.2rem;
    color: $text-secondary;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }
}
</style>
