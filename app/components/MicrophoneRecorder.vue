<template>
  <div class="microphone-recorder">
    <div class="recorder-controls">
      <button
        v-if="!isRecording && !hasRecording"
        class="record-button"
        @click="startRecording"
        :disabled="!isSupported"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
        {{ isSupported ? 'Start Recording' : 'Microphone not supported' }}
      </button>

      <div v-if="isRecording" class="recording-indicator">
        <button class="stop-button" @click="stopRecording">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12"/>
          </svg>
          Stop Recording
        </button>
        <div class="recording-time">{{ formatTime(recordingTime) }}</div>
        <div class="recording-pulse"></div>
      </div>

      <div v-if="hasRecording && !isRecording" class="recording-actions">
        <button class="play-button" @click="playRecording" :disabled="isPlaying">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
          {{ isPlaying ? 'Playing...' : 'Play' }}
        </button>
        <button class="use-button" @click="useRecording">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          Use Recording
        </button>
        <button class="discard-button" @click="discardRecording">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
          Discard
        </button>
      </div>
    </div>

    <div v-if="isRecording" class="audio-visualizer">
      <canvas ref="visualizerCanvas" width="300" height="60"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const emit = defineEmits(['recording-ready']);

const isSupported = ref(false);
const isRecording = ref(false);
const hasRecording = ref(false);
const isPlaying = ref(false);
const recordingTime = ref(0);
const visualizerCanvas = ref(null);

let mediaRecorder = null;
let audioChunks = [];
let recordingInterval = null;
let audioContext = null;
let analyser = null;
let dataArray = null;
let animationId = null;
let recordedBlob = null;
let playbackAudio = null;

onMounted(() => {
  checkMicrophoneSupport();
});

onUnmounted(() => {
  cleanup();
});

const checkMicrophoneSupport = () => {
  isSupported.value = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } 
    });

    // Setup MediaRecorder
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });
    
    audioChunks = [];
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      recordedBlob = new Blob(audioChunks, { type: 'audio/webm' });
      hasRecording.value = true;
      stream.getTracks().forEach(track => track.stop());
      stopVisualizer();
    };

    // Setup audio visualizer
    setupVisualizer(stream);

    // Start recording
    mediaRecorder.start();
    isRecording.value = true;
    recordingTime.value = 0;

    // Start timer
    recordingInterval = setInterval(() => {
      recordingTime.value++;
    }, 1000);

  } catch (error) {
    console.error('Error accessing microphone:', error);
    alert('Could not access microphone. Please check permissions.');
  }
};

const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  isRecording.value = false;
  
  if (recordingInterval) {
    clearInterval(recordingInterval);
    recordingInterval = null;
  }
};

const setupVisualizer = (stream) => {
  if (!visualizerCanvas.value) return;

  audioContext = new AudioContext();
  analyser = audioContext.createAnalyser();
  const source = audioContext.createMediaStreamSource(stream);
  
  source.connect(analyser);
  analyser.fftSize = 256;
  
  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
  
  drawVisualizer();
};

const drawVisualizer = () => {
  if (!isRecording.value || !visualizerCanvas.value) return;

  const canvas = visualizerCanvas.value;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  analyser.getByteFrequencyData(dataArray);

  ctx.fillStyle = 'rgb(20, 20, 20)';
  ctx.fillRect(0, 0, width, height);

  const barWidth = (width / dataArray.length) * 2.5;
  let barHeight;
  let x = 0;

  for (let i = 0; i < dataArray.length; i++) {
    barHeight = (dataArray[i] / 255) * height;

    const r = barHeight + 25 * (i / dataArray.length);
    const g = 250 * (i / dataArray.length);
    const b = 50;

    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(x, height - barHeight, barWidth, barHeight);

    x += barWidth + 1;
  }

  animationId = requestAnimationFrame(drawVisualizer);
};

const stopVisualizer = () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
};

const playRecording = () => {
  if (!recordedBlob) return;

  playbackAudio = new Audio(URL.createObjectURL(recordedBlob));
  isPlaying.value = true;
  
  playbackAudio.onended = () => {
    isPlaying.value = false;
    URL.revokeObjectURL(playbackAudio.src);
    playbackAudio = null;
  };

  playbackAudio.play();
};

const useRecording = () => {
  if (!recordedBlob) return;

  // Convert blob to File object
  const file = new File([recordedBlob], `recording-${Date.now()}.webm`, {
    type: 'audio/webm',
    lastModified: Date.now()
  });

  emit('recording-ready', file);
  discardRecording();
};

const discardRecording = () => {
  if (playbackAudio) {
    playbackAudio.pause();
    URL.revokeObjectURL(playbackAudio.src);
    playbackAudio = null;
  }
  
  recordedBlob = null;
  hasRecording.value = false;
  isPlaying.value = false;
  recordingTime.value = 0;
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const cleanup = () => {
  stopRecording();
  discardRecording();
  stopVisualizer();
};
</script>

<style lang="scss" scoped>
.microphone-recorder {
  background: $bg-secondary;
  border-radius: 15px;
  padding: 2rem;
  border: 1px solid $border;
}

.recorder-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.record-button {
  @include button-primary;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  font-size: 1.1rem;

  &:disabled {
    background: $text-secondary;
    cursor: not-allowed;
    opacity: 0.6;
  }

  svg {
    width: 24px;
    height: 24px;
  }
}

.recording-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.stop-button {
  @include button-danger;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  font-size: 1.1rem;

  svg {
    width: 24px;
    height: 24px;
  }
}

.recording-time {
  font-size: 1.5rem;
  font-weight: bold;
  color: $accent;
  font-family: monospace;
}

.recording-pulse {
  width: 20px;
  height: 20px;
  background: $error;
  border-radius: 50%;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.recording-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;

  @include mobile {
    flex-direction: column;
    align-items: center;
  }
}

.play-button {
  @include button-secondary;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    width: 20px;
    height: 20px;
  }
}

.use-button {
  @include button-primary;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    width: 20px;
    height: 20px;
  }
}

.discard-button {
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

.audio-visualizer {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;

  canvas {
    border-radius: 8px;
    background: $bg-tertiary;
    border: 1px solid $border;
  }
}
</style>