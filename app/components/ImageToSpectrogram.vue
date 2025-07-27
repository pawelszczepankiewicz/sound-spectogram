<template>
  <div class="image-to-spectrogram">
    <div class="upload-section">
      <div class="upload-header">
        <h3>Upload Image to Convert to Sound</h3>
        <p>Upload any image and hear it as a spectrogram-based audio</p>
      </div>

      <div
        class="image-upload-area"
        :class="{ dragging: isDragging, 'has-image': uploadedImage }"
        @click="triggerFileInput"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <div v-if="!uploadedImage" class="upload-prompt">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19M13.5,16L10,11.5L7,15H17L13.5,16Z"/>
          </svg>
          <h4>Drop image here or click to browse</h4>
          <p>Supports JPG, PNG, GIF, WebP</p>
        </div>
        
        <div v-if="uploadedImage" class="image-preview">
          <img :src="uploadedImage" alt="Uploaded image" />
          <div class="image-info">
            <span class="file-name">{{ imageFileName }}</span>
            <span class="file-size">{{ imageFileSize }}</span>
          </div>
        </div>

        <input
          ref="fileInput"
          type="file"
          class="file-input"
          accept="image/*"
          @change="handleFileSelect"
        />
      </div>

      <div v-if="uploadedImage" class="conversion-controls">
        <div class="parameter-controls">
          <div class="control-group">
            <label>Duration (seconds)</label>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              v-model="duration"
              class="parameter-slider"
            />
            <span class="value">{{ duration }}s</span>
          </div>

          <div class="control-group">
            <label>Frequency Range</label>
            <select v-model="frequencyRange" class="parameter-select">
              <option value="full">Full Range (20Hz - 20kHz)</option>
              <option value="mid">Mid Range (200Hz - 8kHz)</option>
              <option value="low">Low Range (20Hz - 2kHz)</option>
              <option value="high">High Range (2kHz - 20kHz)</option>
            </select>
          </div>

          <div class="control-group">
            <label>Brightness Mapping</label>
            <select v-model="brightnessMapping" class="parameter-select">
              <option value="linear">Linear</option>
              <option value="logarithmic">Logarithmic</option>
              <option value="exponential">Exponential</option>
            </select>
          </div>
        </div>

        <div class="action-buttons">
          <button class="convert-button" @click="convertImageToAudio" :disabled="isConverting">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z"/>
            </svg>
            {{ isConverting ? 'Converting...' : 'Convert to Audio' }}
          </button>
          
          <button class="clear-button" @click="clearImage">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19M8,9H16V19H8V9M15.5,4L14.5,3H9.5L8.5,4H5V6H19V4H15.5Z"/>
            </svg>
            Clear
          </button>
        </div>
      </div>
    </div>

    <div v-if="convertedAudio" class="converted-audio">
      <h4>Generated Audio from Image</h4>
      <audio :src="convertedAudio" controls></audio>
      <button class="download-button" @click="downloadAudio">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
        </svg>
        Download Audio
      </button>
    </div>

    <div v-if="spectrogramCanvas" class="spectrogram-visualization">
      <h4>Generated Spectrogram</h4>
      <canvas ref="spectrogramDisplay" class="spectrogram-display"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const emit = defineEmits(['audio-generated']);

const fileInput = ref(null);
const spectrogramDisplay = ref(null);
const isDragging = ref(false);
const uploadedImage = ref(null);
const imageFileName = ref('');
const imageFileSize = ref('');
const convertedAudio = ref(null);
const spectrogramCanvas = ref(false);
const isConverting = ref(false);

// Conversion parameters
const duration = ref(3);
const frequencyRange = ref('mid');
const brightnessMapping = ref('linear');

let imageData = null;
let audioContext = null;

onMounted(() => {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
});

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
    processImageFile(files[0]);
  }
};

const handleFileSelect = (e) => {
  const files = e.target.files;
  if (files?.length > 0) {
    processImageFile(files[0]);
  }
};

const processImageFile = (file) => {
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file');
    return;
  }

  imageFileName.value = file.name;
  imageFileSize.value = formatFileSize(file.size);

  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedImage.value = e.target.result;
    loadImageData(e.target.result);
  };
  reader.readAsDataURL(file);
};

const loadImageData = (imageSrc) => {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Resize image to optimal spectrogram dimensions
    const maxWidth = 800;
    const maxHeight = 256;
    
    const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
    canvas.width = Math.floor(img.width * scale);
    canvas.height = Math.floor(img.height * scale);
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  };
  img.src = imageSrc;
};

const convertImageToAudio = async () => {
  if (!imageData || !audioContext) return;
  
  isConverting.value = true;
  
  try {
    // Convert image to spectrogram matrix
    const spectrogramMatrix = imageToSpectrogramMatrix(imageData);
    
    // Create spectrogram visualization
    createSpectrogramVisualization(spectrogramMatrix);
    
    // Convert spectrogram to audio
    const audioBuffer = await spectrogramToAudio(spectrogramMatrix);
    
    // Create audio blob and URL
    const audioBlob = await audioBufferToBlob(audioBuffer);
    convertedAudio.value = URL.createObjectURL(audioBlob);
    
    // Emit for external use
    emit('audio-generated', audioBlob);
    
  } catch (error) {
    console.error('Error converting image to audio:', error);
    alert('Failed to convert image to audio. Please try again.');
  } finally {
    isConverting.value = false;
  }
};

const imageToSpectrogramMatrix = (imgData) => {
  const { width, height, data } = imgData;
  const matrix = [];
  
  // Process image row by row (frequency bands)
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 4;
      const r = data[pixelIndex];
      const g = data[pixelIndex + 1];
      const b = data[pixelIndex + 2];
      const alpha = data[pixelIndex + 3];
      
      // Convert to grayscale and normalize
      let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      brightness *= alpha / 255; // Account for transparency
      
      // Apply brightness mapping
      switch (brightnessMapping.value) {
        case 'logarithmic':
          brightness = brightness > 0 ? Math.log(brightness * 9 + 1) / Math.log(10) : 0;
          break;
        case 'exponential':
          brightness = Math.pow(brightness, 2);
          break;
        // linear is default, no transformation needed
      }
      
      row.push(brightness);
    }
    matrix.push(row);
  }
  
  return matrix;
};

const createSpectrogramVisualization = (matrix) => {
  if (!spectrogramDisplay.value) return;
  
  const canvas = spectrogramDisplay.value;
  const ctx = canvas.getContext('2d');
  
  canvas.width = matrix[0].length;
  canvas.height = matrix.length;
  
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      const intensity = matrix[y][x];
      const pixelIndex = (y * canvas.width + x) * 4;
      
      // Create colored spectrogram visualization
      const r = Math.floor(255 * intensity);
      const g = Math.floor(128 * intensity);
      const b = Math.floor(64 * intensity);
      
      imageData.data[pixelIndex] = r;
      imageData.data[pixelIndex + 1] = g;
      imageData.data[pixelIndex + 2] = b;
      imageData.data[pixelIndex + 3] = 255;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  spectrogramCanvas.value = true;
};

const spectrogramToAudio = async (spectrogramMatrix) => {
  const height = spectrogramMatrix.length;
  const width = spectrogramMatrix[0].length;
  const sampleRate = 44100;
  const durationSec = parseFloat(duration.value);
  
  // Calculate frequency range
  const freqRanges = {
    full: { min: 20, max: 20000 },
    mid: { min: 200, max: 8000 },
    low: { min: 20, max: 2000 },
    high: { min: 2000, max: 20000 }
  };
  
  const { min: minFreq, max: maxFreq } = freqRanges[frequencyRange.value];
  
  // Create audio buffer
  const audioBuffer = audioContext.createBuffer(1, durationSec * sampleRate, sampleRate);
  const channelData = audioBuffer.getChannelData(0);
  
  // Generate audio using additive synthesis
  for (let timeIndex = 0; timeIndex < width; timeIndex++) {
    const timeStart = Math.floor((timeIndex / width) * channelData.length);
    const timeEnd = Math.floor(((timeIndex + 1) / width) * channelData.length);
    
    for (let sampleIndex = timeStart; sampleIndex < timeEnd && sampleIndex < channelData.length; sampleIndex++) {
      let sample = 0;
      
      // Add frequency components from each row of the spectrogram
      for (let freqIndex = 0; freqIndex < height; freqIndex++) {
        const amplitude = spectrogramMatrix[height - 1 - freqIndex][timeIndex]; // Flip Y axis
        
        if (amplitude > 0.01) { // Skip very quiet components
          // Map frequency index to actual frequency
          const frequency = minFreq + (freqIndex / (height - 1)) * (maxFreq - minFreq);
          
          // Generate sine wave component
          const phase = 2 * Math.PI * frequency * sampleIndex / sampleRate;
          sample += amplitude * Math.sin(phase) * 0.1; // Scale down to prevent clipping
        }
      }
      
      channelData[sampleIndex] += sample;
    }
  }
  
  // Apply gentle envelope to avoid clicks
  const fadeLength = Math.floor(sampleRate * 0.01); // 10ms fade
  for (let i = 0; i < fadeLength; i++) {
    const fadeFactor = i / fadeLength;
    channelData[i] *= fadeFactor;
    channelData[channelData.length - 1 - i] *= fadeFactor;
  }
  
  return audioBuffer;
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
  if (!convertedAudio.value) return;
  
  const a = document.createElement('a');
  a.href = convertedAudio.value;
  a.download = `image-audio-${Date.now()}.wav`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const clearImage = () => {
  uploadedImage.value = null;
  imageFileName.value = '';
  imageFileSize.value = '';
  convertedAudio.value = null;
  spectrogramCanvas.value = false;
  imageData = null;
  
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>

<style lang="scss" scoped>
.image-to-spectrogram {
  background: $bg-secondary;
  border-radius: 15px;
  padding: 2rem;
  border: 1px solid $border;
}

.upload-section {
  margin-bottom: 2rem;
}

.upload-header {
  text-align: center;
  margin-bottom: 2rem;

  h3 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    color: $text-primary;
  }

  p {
    color: $text-secondary;
    font-size: 1rem;
  }
}

.image-upload-area {
  border: 2px dashed $border;
  border-radius: 15px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: $bg-tertiary;
  position: relative;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    border-color: $accent;
    background: rgba($accent, 0.05);
  }

  &.dragging {
    border-color: $accent;
    background: rgba($accent, 0.1);
    transform: scale(1.02);
  }

  &.has-image {
    padding: 1rem;
  }
}

.upload-prompt {
  svg {
    width: 60px;
    height: 60px;
    color: $text-secondary;
    margin-bottom: 1rem;
    opacity: 0.7;
  }

  h4 {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
    color: $text-primary;
  }

  p {
    color: $text-secondary;
    font-size: 0.9rem;
  }
}

.image-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;

  img {
    max-width: 100%;
    max-height: 200px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.image-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;

  .file-name {
    font-weight: 600;
    color: $text-primary;
  }

  .file-size {
    font-size: 0.85rem;
    color: $text-secondary;
  }
}

.file-input {
  display: none;
}

.conversion-controls {
  margin-top: 2rem;
  padding: 2rem;
  background: $bg-primary;
  border-radius: 12px;
  border: 1px solid $border;
}

.parameter-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  @include mobile {
    grid-template-columns: 1fr;
  }
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-weight: 600;
    color: $text-primary;
    font-size: 0.9rem;
  }

  .value {
    font-size: 0.85rem;
    color: $accent;
    font-weight: 600;
    text-align: center;
    min-width: 40px;
  }
}

.parameter-slider {
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

.parameter-select {
  padding: 0.5rem;
  border: 1px solid $border;
  border-radius: 8px;
  background: $bg-tertiary;
  color: $text-primary;
  font-size: 0.9rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: $accent;
  }
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;

  @include mobile {
    flex-direction: column;
  }
}

.convert-button {
  @include button-primary;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  font-size: 1.1rem;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    width: 20px;
    height: 20px;
  }
}

.clear-button {
  @include button-secondary;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: $error;
  border-color: $error;

  &:hover {
    background: $error;
    color: white;
  }

  svg {
    width: 20px;
    height: 20px;
  }
}

.converted-audio {
  margin-top: 2rem;
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

.spectrogram-visualization {
  margin-top: 2rem;
  padding: 1.5rem;
  background: $bg-tertiary;
  border-radius: 10px;
  border: 1px solid $border;

  h4 {
    margin: 0 0 1rem 0;
    color: $text-primary;
  }
}

.spectrogram-display {
  width: 100%;
  height: auto;
  border-radius: 8px;
  background: #000;
  border: 1px solid $border;
}
</style>