<template>
  <div class="audio-controls">
    <button class="play-button" @click="$emit('toggle-play')">
      <svg v-if="!isPlaying" viewBox="0 0 24 24">
        <path d="M5 3l14 9-14 9V3z" />
      </svg>
      <svg v-else viewBox="0 0 24 24">
        <rect x="6" y="4" width="4" height="16" />
        <rect x="14" y="4" width="4" height="16" />
      </svg>
    </button>

    <div class="progress-bar" @click="handleSeek">
      <div class="progress" :style="{ width: progressPercent + '%' }"></div>
    </div>

    <div class="speed-control">
      <label class="speed-label">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13,2.03V2.05L13,4.05C17.39,4.59 20.5,8.58 19.96,12.97C19.5,16.61 16.64,19.5 13,19.93V21.93C18.5,21.38 22.5,16.5 21.95,11C21.5,6.25 17.73,2.5 13,2.03M11,2.07C9.76,2.18 8.55,2.63 7.5,3.4L8.5,5.19C9.25,4.69 10.1,4.35 11,4.22V2.07M4.07,13C4.18,14.24 4.63,15.45 5.4,16.5L7.19,15.5C6.69,14.75 6.35,13.9 6.22,13H4.07M5.19,8.5L3.4,7.5C2.63,8.55 2.18,9.76 2.07,11H4.22C4.35,10.1 4.69,9.25 5.19,8.5M7.5,20.6C8.55,21.37 9.76,21.82 11,21.93V19.78C10.1,19.65 9.25,19.31 8.5,18.81L7.5,20.6Z"/>
        </svg>
        Speed
      </label>
      <div class="speed-slider-container">
        <input
          type="range"
          class="speed-slider"
          min="0.1"
          max="1"
          step="0.1"
          :value="playbackSpeed"
          @input="handleSpeedChange"
        />
        <span class="speed-value">{{ playbackSpeed.toFixed(1) }}x</span>
      </div>
    </div>

    <div class="time-display">
      {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  isPlaying: Boolean,
  currentTime: Number,
  duration: Number,
  playbackSpeed: {
    type: Number,
    default: 1
  }
});

const emit = defineEmits(["toggle-play", "seek", "speed-change"]);

const progressPercent = computed(() => {
  if (!props.duration) return 0;
  return (props.currentTime / props.duration) * 100;
});

const formatTime = (time) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const handleSeek = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const progress = (e.clientX - rect.left) / rect.width;
  emit("seek", progress);
};

const handleSpeedChange = (e) => {
  const speed = parseFloat(e.target.value);
  emit("speed-change", speed);
};
</script>

<style lang="scss" scoped>
.audio-controls {
  background: $bg-tertiary;
  border-radius: 10px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;

  @include mobile {
    flex-direction: column;
    gap: 1.5rem;
  }
}

.play-button {
  width: 50px;
  height: 50px;
  background: $accent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 5px 15px rgba($accent, 0.4);
  }

  svg {
    width: 24px;
    height: 24px;
    fill: white;
  }
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: $border;
  border-radius: 3px;
  position: relative;
  cursor: pointer;
  overflow: hidden;

  &:hover .progress::after {
    opacity: 1;
  }
}

.progress {
  height: 100%;
  background: $accent;
  border-radius: 3px;
  transition: width 0.1s linear;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    right: -3px;
    top: 50%;
    transform: translateY(-50%);
    width: 12px;
    height: 12px;
    background: white;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    opacity: 0;
    transition: opacity 0.2s;
  }
}

.speed-control {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 120px;

  @include mobile {
    width: 100%;
    align-items: center;
  }
}

.speed-label {
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

.speed-slider-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.speed-slider {
  flex: 1;
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
    transition: all 0.2s ease;

    &:hover {
      transform: scale(1.2);
      box-shadow: 0 2px 8px rgba($accent, 0.4);
    }
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: $accent;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      transform: scale(1.2);
      box-shadow: 0 2px 8px rgba($accent, 0.4);
    }
  }

  &:focus {
    &::-webkit-slider-thumb {
      box-shadow: 0 0 0 3px rgba($accent, 0.3);
    }

    &::-moz-range-thumb {
      box-shadow: 0 0 0 3px rgba($accent, 0.3);
    }
  }
}

.speed-value {
  font-size: 0.85rem;
  color: $accent;
  font-weight: 600;
  min-width: 30px;
  text-align: center;
}

.time-display {
  color: $text-secondary;
  font-size: 0.9rem;
  min-width: 100px;
  text-align: right;

  @include mobile {
    text-align: center;
  }
}
</style>
