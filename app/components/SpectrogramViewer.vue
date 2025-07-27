<template>
  <section class="spectrogram-section">
    <div class="spectrogram-header">
      <h2>Frequency Analysis</h2>
      <div class="controls">
        <button
          class="control-button"
          :class="{ active: viewMode === 'waveform' }"
          @click="switchToWaveform"
        >
          Waveform
        </button>
        <button
          class="control-button"
          :class="{ active: viewMode === 'spectrogram' }"
          @click="switchToSpectrogram"
        >
          Spectrogram
        </button>
        <button
          class="control-button"
          :class="{ active: viewMode === 'draw' }"
          @click="viewMode = 'draw'"
        >
          Draw Sound
        </button>
        <button class="control-button" @click="toggleZoom">
          {{ isZoomed ? "Zoom Out" : "Zoom In" }}
        </button>
        <button class="control-button" @click="$emit('remove-file')">
          Remove File
        </button>
      </div>
    </div>

    <div class="visualization-container" v-show="viewMode !== 'draw'">
      <div ref="waveformRef" id="waveform"></div>
    </div>

    <div v-if="viewMode === 'draw'" class="drawing-container">
      <SpectrogramDrawer 
        :width="800"
        :height="256"
        :sample-rate="44100"
        :duration="duration || 5"
        @audio-generated="handleGeneratedAudio"
      />
    </div>

    <AudioControl
      :is-playing="isPlaying"
      :current-time="currentTime"
      :duration="duration"
      :playback-speed="playbackSpeed"
      @toggle-play="togglePlay"
      @seek="seek"
      @speed-change="changeSpeed"
    />
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";

const props = defineProps({
  audioUrl: String,
  fileName: String,
});

const emit = defineEmits(["remove-file", "audio-generated"]);

const waveformRef = ref(null);
const viewMode = ref("waveform");
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const isZoomed = ref(false);
const playbackSpeed = ref(1);

let wavesurfer = null;
let spectrogramPlugin = null;

onMounted(() => {
  initWaveSurfer();
});

onUnmounted(() => {
  if (wavesurfer) {
    wavesurfer.destroy();
  }
});

const initWaveSurfer = async () => {
  try {
    // Dynamic import to avoid SSR issues
    const WaveSurfer = (await import('wavesurfer.js')).default;
    
    // Initialize WaveSurfer
    wavesurfer = WaveSurfer.create({
      container: waveformRef.value,
      waveColor: "#6366f1",
      progressColor: "#8b5cf6",
      cursorColor: "#ec4899",
      barWidth: 2,
      barRadius: 3,
      responsive: true,
      height: 150,
      normalize: true,
    });

    // Load audio
    if (props.audioUrl) {
      wavesurfer.load(props.audioUrl);
    }

    // Event listeners
    wavesurfer.on("ready", () => {
      duration.value = wavesurfer.getDuration();
      // Set initial playback rate
      wavesurfer.setPlaybackRate(playbackSpeed.value);
    });

    wavesurfer.on("audioprocess", () => {
      currentTime.value = wavesurfer.getCurrentTime();
    });

    wavesurfer.on("play", () => {
      isPlaying.value = true;
    });

    wavesurfer.on("pause", () => {
      isPlaying.value = false;
    });

    wavesurfer.on("finish", () => {
      isPlaying.value = false;
      currentTime.value = 0;
    });
  } catch (error) {
    console.error("Error initializing WaveSurfer:", error);
  }
};

const initSpectrogram = async () => {
  try {
    if (!spectrogramPlugin && wavesurfer) {
      const SpectrogramPlugin = (await import('wavesurfer.js/dist/plugins/spectrogram.js')).default;
      
      spectrogramPlugin = wavesurfer.registerPlugin(SpectrogramPlugin.create({
        labels: true,
        height: 256,
        splitChannels: false,
        colorMap: createColorMap(),
      }));
    }
  } catch (error) {
    console.error("Error initializing spectrogram:", error);
  }
};

const switchToWaveform = () => {
  viewMode.value = "waveform";
  if (spectrogramPlugin) {
    spectrogramPlugin.destroy();
    spectrogramPlugin = null;
  }
};

const switchToSpectrogram = async () => {
  viewMode.value = "spectrogram";
  await initSpectrogram();
};

const togglePlay = () => {
  if (wavesurfer) {
    wavesurfer.playPause();
  }
};

const seek = (progress) => {
  if (wavesurfer) {
    wavesurfer.seekTo(progress);
  }
};

const changeSpeed = (speed) => {
  playbackSpeed.value = speed;
  if (wavesurfer) {
    wavesurfer.setPlaybackRate(speed);
  }
};

const toggleZoom = () => {
  if (wavesurfer) {
    isZoomed.value = !isZoomed.value;
    wavesurfer.zoom(isZoomed.value ? 100 : 0);
  }
};

const handleGeneratedAudio = (audioBlob) => {
  emit("audio-generated", audioBlob);
};

const createColorMap = () => {
  const colors = [];
  for (let i = 0; i < 256; i++) {
    const value = i / 255;
    let r, g, b;
    
    if (value < 0.25) {
      // Dark blue to blue
      r = 0;
      g = 0;
      b = Math.floor(255 * (value * 4));
    } else if (value < 0.5) {
      // Blue to cyan
      r = 0;
      g = Math.floor(255 * ((value - 0.25) * 4));
      b = 255;
    } else if (value < 0.75) {
      // Cyan to yellow
      r = Math.floor(255 * ((value - 0.5) * 4));
      g = 255;
      b = Math.floor(255 * (1 - (value - 0.5) * 4));
    } else {
      // Yellow to red
      r = 255;
      g = Math.floor(255 * (1 - (value - 0.75) * 4));
      b = 0;
    }
    
    colors.push([r, g, b, 1]);
  }
  return colors;
};


watch(
  () => props.audioUrl,
  (newUrl) => {
    if (newUrl && wavesurfer) {
      wavesurfer.load(newUrl);
    }
  }
);
</script>

<style lang="scss" scoped>
.spectrogram-section {
  background: $bg-secondary;
  border-radius: 20px;
  padding: 3rem;
  border: 1px solid $border;
  animation: fadeInUp 0.8s ease-out;

  @include mobile {
    padding: 2rem;
  }
}

.spectrogram-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;

  h2 {
    font-size: 2rem;
  }
}

.controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;

  @include mobile {
    width: 100%;
    justify-content: center;
  }
}

.control-button {
  @include button-secondary;

  &.active {
    background: $accent;
    border-color: $accent;
    color: white;
  }
}

.visualization-container {
  position: relative;
  background: $bg-tertiary;
  border-radius: 10px;
  padding: 2rem;
  margin-bottom: 2rem;
  min-height: 300px;

  #waveform {
    width: 100%;
    min-height: 150px;
  }
}

.drawing-container {
  margin-bottom: 2rem;
}
</style>
