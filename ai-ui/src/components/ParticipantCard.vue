<template>
  <div 
    :class="['participant-card', { 'is-speaking': isCurrentSpeaker }]" 
    :style="position"
  >
    <!-- 思考中提示 -->
    <div class="thinking-indicator" v-if="message?.isThinking">
      <span class="thinking-text">思考中...</span>
      <div class="thinking-dots">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    </div>
    
    <!-- 对话框 -->
    <div class="speech-bubble" v-if="message?.isSpeaking">
      <div class="speech-content">{{ message.content }}</div>
    </div>
    
    <!-- 头像 -->
    <div class="avatar-container">
      <img :src="participant.avatar" :alt="participant.name" class="avatar" />
      <div class="name">{{ participant.name }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { Participant, Message } from '../types/Discussion';

export default defineComponent({
  props: {
    participant: {
      type: Object as PropType<Participant>,
      required: true
    },
    isCurrentSpeaker: {
      type: Boolean,
      default: false
    },
    message: {
      type: Object as PropType<Message>,
      default: null
    },
    position: {
      type: Object,
      required: true
    }
  }
});
</script>

<style scoped>
.participant-card {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.participant-card.is-speaking {
  transform: scale(1.1);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.7);
  z-index: 9999; /* 添加 z-index 为最高层级 */
}

.avatar-container {
  position: relative;
  width: 200px;
  height: 200px;
  margin-bottom: 10px;
}

.avatar {
  width: 50%;
  height: 50%;
  border-radius: 50%;
  margin-left: 23%;
  object-fit: cover;
  border: 3px solid white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.name {
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-top: 5px;
  white-space: nowrap;
}

.thinking-indicator {
  position: absolute;
  top: -40px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 14px;
  display: flex;
  align-items: center;
  z-index: 999;
}

.thinking-text {
  margin-right: 10px;
}

.thinking-dots {
  display: flex;
}

.dot {
  width: 6px;
  height: 6px;
  background-color: white;
  border-radius: 50%;
  margin: 0 2px;
  animation: dotPulse 1.5s infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.3s;
}

.dot:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes dotPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
}

.speech-bubble {
  position: absolute;
  top: -80px;
  background-color: white;
  border-radius: 10px;
  padding: 10px 15px;
  max-width: 200px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  opacity: 0;
  transform: translateY(-10px);
  animation: fadeIn 0.5s forwards;
  z-index: 999;
}

.speech-content {
  font-size: 14px;
  line-height: 1.4;
  color: #333;
}

@keyframes fadeIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
