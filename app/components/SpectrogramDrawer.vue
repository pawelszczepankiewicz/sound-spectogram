<template>
  <div class="spectrogram-drawer">
    <div class="drawing-controls">
      <div class="tool-section">
        <label class="tool-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.71,4.63L19.37,3.29C19,2.9 18.35,2.9 17.96,3.29L9,12.25L11.75,15L20.71,6.04C21.1,5.65 21.1,5 20.71,4.63M7,14A3,3 0 0,0 4,17C4,18.31 2.84,19 2,19C2.92,20.22 4.5,21 6,21A4,4 0 0,0 10,17A3,3 0 0,0 7,14Z"/>
          </svg>
          Draw Mode
        </label>
        <div class="tool-buttons">
          <button 
            class="tool-button"
            :class="{ active: drawingMode === 'draw' }"
            @click="drawingMode = 'draw'"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.71,4.63L19.37,3.29C19,2.9 18.35,2.9 17.96,3.29L9,12.25L11.75,15L20.71,6.04C21.1,5.65 21.1,5 20.71,4.63M7,14A3,3 0 0,0 4,17C4,18.31 2.84,19 2,19C2.92,20.22 4.5,21 6,21A4,4 0 0,0 10,17A3,3 0 0,0 7,14Z"/>
            </svg>
            Draw
          </button>
          <button 
            class="tool-button"
            :class="{ active: drawingMode === 'erase' }"
            @click="drawingMode = 'erase'"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.24,3.56L21.19,8.5C21.97,9.29 21.97,10.55 21.19,11.34L12,20.53C10.44,22.09 7.91,22.09 6.34,20.53L2.81,17C2.03,16.21 2.03,14.95 2.81,14.16L13.41,3.56C14.2,2.78 15.46,2.78 16.24,3.56M4.22,15.58L7.76,19.11C8.54,19.9 9.8,19.9 10.59,19.11L14.12,15.58L9.17,10.63L4.22,15.58Z"/>
            </svg>
            Erase
          </button>
        </div>
      </div>

      <div class="brush-section">
        <label class="brush-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Brush Size
        </label>
        <div class="brush-controls">
          <input
            type="range"
            class="brush-slider"
            min="1"
            max="20"
            v-model="brushSize"
          />
          <span class="brush-value">{{ brushSize }}px</span>
        </div>
      </div>

      <div class="intensity-section">
        <label class="intensity-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2A7,7 0 0,0 5,9C5,11.38 6.19,13.47 8,14.74V17A1,1 0 0,0 9,18H15A1,1 0 0,0 16,17V14.74C17.81,13.47 19,11.38 19,9A7,7 0 0,0 12,2M9,21V20H15V21A1,1 0 0,1 14,22H10A1,1 0 0,1 9,21M12,6.75L10,10H14L12,6.75Z"/>
          </svg>
          Intensity
        </label>
        <div class="intensity-controls">
          <input
            type="range"
            class="intensity-slider"
            min="0"
            max="1"
            step="0.1"
            v-model="drawIntensity"
          />
          <span class="intensity-value">{{ (drawIntensity * 100).toFixed(0) }}%</span>
        </div>
      </div>

      <div class="action-section">
        <button class="action-button clear-button" @click="clearDrawing">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19M8,9H16V19H8V9M15.5,4L14.5,3H9.5L8.5,4H5V6H19V4H15.5Z"/>
          </svg>
          Clear
        </button>
        <button class="action-button synthesize-button" @click="synthesizeAudio" :disabled="!hasDrawing">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z"/>
          </svg>
          Generate Sound
        </button>
      </div>
    </div>

    <div class="canvas-container" ref="canvasContainer">
      <canvas
        ref="drawingCanvas"
        class="drawing-canvas"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
        @touchstart="startDrawing"
        @touchmove="draw"
        @touchend="stopDrawing"
      ></canvas>
    </div>

    <div v-if="synthesizedAudio" class="synthesized-audio">
      <h4>Generated Audio</h4>
      <audio :src="synthesizedAudio" controls></audio>
      <button class="download-button" @click="downloadAudio">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
        </svg>
        Download
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  width: {
    type: Number,
    default: 800
  },
  height: {
    type: Number,
    default: 256
  },
  sampleRate: {
    type: Number,
    default: 44100
  },
  duration: {
    type: Number,
    default: 5
  }
});

const emit = defineEmits(['audio-generated']);

const canvasContainer = ref(null);
const drawingCanvas = ref(null);
const drawingMode = ref('draw');
const brushSize = ref(5);
const drawIntensity = ref(0.8);
const isDrawing = ref(false);
const hasDrawing = ref(false);
const synthesizedAudio = ref(null);

let ctx = null;
let spectrogramData = null;
let audioContext = null;

onMounted(() => {
  initCanvas();
  initAudioContext();
});

onUnmounted(() => {
  if (audioContext) {
    audioContext.close();
  }
});

const initCanvas = () => {
  const canvas = drawingCanvas.value;
  if (!canvas) return;

  canvas.width = props.width;
  canvas.height = props.height;
  ctx = canvas.getContext('2d');
  
  // Initialize with black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Initialize spectrogram data matrix
  spectrogramData = Array(props.height).fill(null).map(() => 
    Array(props.width).fill(0)
  );
};

const initAudioContext = () => {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
};

const getMousePos = (e) => {
  const canvas = drawingCanvas.value;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  let clientX, clientY;
  if (e.touches && e.touches[0]) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
};

const startDrawing = (e) => {
  e.preventDefault();
  isDrawing.value = true;
  draw(e);
};

const draw = (e) => {
  if (!isDrawing.value || !ctx) return;
  
  e.preventDefault();
  const pos = getMousePos(e);
  
  ctx.globalCompositeOperation = drawingMode.value === 'erase' ? 'destination-out' : 'source-over';
  
  if (drawingMode.value === 'draw') {
    // Create intensity-based color
    const intensity = drawIntensity.value;
    const r = Math.floor(255 * intensity);
    const g = Math.floor(128 * intensity);
    const b = Math.floor(64 * intensity);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  }
  
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, brushSize.value, 0, 2 * Math.PI);
  ctx.fill();
  
  // Update spectrogram data
  updateSpectrogramData(pos.x, pos.y);
  hasDrawing.value = true;
};

const stopDrawing = () => {
  isDrawing.value = false;
};

const updateSpectrogramData = (x, y) => {
  const radius = brushSize.value;
  const intensity = drawingMode.value === 'erase' ? 0 : drawIntensity.value;
  
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= radius) {
        const dataX = Math.floor(x + dx);
        const dataY = Math.floor(y + dy);
        
        if (dataX >= 0 && dataX < props.width && dataY >= 0 && dataY < props.height) {
          const falloff = 1 - (distance / radius);
          const value = intensity * falloff;
          
          if (drawingMode.value === 'erase') {
            spectrogramData[dataY][dataX] = 0;
          } else {
            spectrogramData[dataY][dataX] = Math.max(spectrogramData[dataY][dataX], value);
          }
        }
      }
    }
  }
};

const clearDrawing = () => {
  if (!ctx) return;
  
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, props.width, props.height);
  
  // Reset spectrogram data
  spectrogramData = Array(props.height).fill(null).map(() => 
    Array(props.width).fill(0)
  );
  
  hasDrawing.value = false;
  synthesizedAudio.value = null;
};

const synthesizeAudio = async () => {
  if (!spectrogramData || !audioContext) return;
  
  try {
    const audioBuffer = await spectrogramToAudio(spectrogramData);
    const audioBlob = await audioBufferToBlob(audioBuffer);
    synthesizedAudio.value = URL.createObjectURL(audioBlob);
    
    emit('audio-generated', audioBlob);
  } catch (error) {
    console.error('Error synthesizing audio:', error);
    alert('Failed to generate audio. Please try again.');
  }
};

const spectrogramToAudio = async (spectrogramMatrix) => {
  const fftSize = (props.height - 1) * 2; // Reconstruct full FFT size
  const hopSize = Math.floor(fftSize / 4);
  const numFrames = props.width;
  const sampleRate = props.sampleRate;
  const outputLength = numFrames * hopSize;
  
  // Create audio buffer
  const audioBuffer = audioContext.createBuffer(1, outputLength, sampleRate);
  const channelData = audioBuffer.getChannelData(0);
  
  // Convert spectrogram to audio using inverse STFT
  for (let frame = 0; frame < numFrames; frame++) {
    // Create complex spectrum from magnitude spectrogram
    const spectrum = new Float32Array(fftSize);
    
    // Fill positive frequencies (flip Y axis since canvas Y=0 is top)
    for (let freq = 0; freq < props.height; freq++) {
      const magnitude = spectrogramMatrix[props.height - 1 - freq][frame];
      spectrum[freq] = magnitude;
    }
    
    // Mirror for negative frequencies (conjugate symmetry)
    for (let freq = 1; freq < props.height - 1; freq++) {
      spectrum[fftSize - freq] = spectrum[freq];
    }
    
    // Apply inverse FFT using a simple implementation
    const timeFrame = inverseFFT(spectrum);
    
    // Overlap-add into output buffer
    const frameStart = frame * hopSize;
    for (let i = 0; i < timeFrame.length && frameStart + i < outputLength; i++) {
      channelData[frameStart + i] += timeFrame[i] * 0.1; // Scale down to prevent clipping
    }
  }
  
  return audioBuffer;
};

const inverseFFT = (spectrum) => {
  const N = spectrum.length;
  const output = new Float32Array(N);
  
  // Simple inverse DFT implementation
  for (let n = 0; n < N; n++) {
    let real = 0;
    for (let k = 0; k < N; k++) {
      const angle = 2 * Math.PI * k * n / N;
      real += spectrum[k] * Math.cos(angle);
    }
    output[n] = real / N;
  }
  
  return output;
};

const audioBufferToBlob = async (audioBuffer) => {
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);
  const channelData = audioBuffer.getChannelData(0);
  
  // Write WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * 2, true);
  
  // Write audio data
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, sample * 0x7FFF, true);
    offset += 2;
  }
  
  return new Blob([buffer], { type: 'audio/wav' });
};

const downloadAudio = () => {
  if (!synthesizedAudio.value) return;
  
  const a = document.createElement('a');
  a.href = synthesizedAudio.value;
  a.download = `synthesized-audio-${Date.now()}.wav`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// Watch for canvas resize
watch(() => [props.width, props.height], () => {
  initCanvas();
}, { immediate: false });
</script>

<style lang="scss" scoped>
.spectrogram-drawer {
  background: $bg-secondary;
  border-radius: 15px;
  padding: 2rem;
  border: 1px solid $border;
}

.drawing-controls {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  align-items: center;

  @include mobile {
    flex-direction: column;
    gap: 1rem;
  }
}

.tool-section,
.brush-section,
.intensity-section,
.action-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tool-label,
.brush-label,
.intensity-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: $text-secondary;
  font-weight: 500;

  svg {
    opacity: 0.7;
  }
}

.tool-buttons {
  display: flex;
  gap: 0.5rem;
}

.tool-button {
  @include button-secondary;
  padding: 0.5rem;
  min-width: 60px;

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

.brush-controls,
.intensity-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brush-slider,
.intensity-slider {
  width: 80px;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: $border;
  border-radius: 2px;
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    background: $accent;
    border-radius: 50%;
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: $accent;
    border-radius: 50%;
    border: none;
    cursor: pointer;
  }
}

.brush-value,
.intensity-value {
  font-size: 0.85rem;
  color: $accent;
  font-weight: 600;
  min-width: 35px;
}

.action-section {
  flex-direction: row;
  gap: 1rem;
}

.action-button {
  @include button-secondary;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;

  svg {
    width: 20px;
    height: 20px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.clear-button {
  color: $error;
  border-color: $error;

  &:hover:not(:disabled) {
    background: $error;
    color: white;
  }
}

.synthesize-button {
  background: $accent;
  border-color: $accent;
  color: white;

  &:hover:not(:disabled) {
    background: $accent-hover;
  }
}

.canvas-container {
  position: relative;
  border: 2px solid $border;
  border-radius: 10px;
  overflow: hidden;
  background: $bg-tertiary;
}

.drawing-canvas {
  display: block;
  width: 100%;
  height: auto;
  cursor: crosshair;

  &:active {
    cursor: grabbing;
  }
}

.synthesized-audio {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: $bg-tertiary;
  border-radius: 10px;
  border: 1px solid $border;

  h4 {
    margin: 0 0 1rem 0;
    color: $text-primary;
  }

  audio {
    width: 100%;
    margin-bottom: 1rem;
  }
}

.download-button {
  @include button-primary;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    width: 20px;
    height: 20px;
  }
}
</style>