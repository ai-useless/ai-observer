<template>
  <div class="home">
    <RoundTableDiscussion/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import RoundTableDiscussion from '@/components/RoundTableDiscussion.vue'; // @ is an alias to /src

export default defineComponent({
  name: 'AIView',
  components: {
    RoundTableDiscussion,
  },
});
</script>
<style>
/* 主题输入区域 */
.topic-input-container {
  width: 100%;
  max-width: 600px;
  text-align: center;
  margin-bottom: 30px;
}

.topic-input-container h2 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.input-group {
  display: flex;
  gap: 10px;
}

.input-group input {
  flex: 1;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
}

.input-group button {
  padding: 12px 25px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.input-group button:hover {
  background-color: #3aa774;
}

/* 圆桌讨论区域 */
.round-table-container {
  position: relative;
  width: 100%;
  height: 500px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.round-table {
  position: relative;
  width: 300px;
  height: 300px;
  background-color: #f0e6d2;
  border-radius: 50%;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.table-center {
  position: absolute;
  width: 80px;
  height: 80px;
  background-color: #e6d7b8;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 讨论进度 */
.discussion-progress {
  width: 100%;
  max-width: 600px;
  margin: 20px 0;
  text-align: center;
}

.progress-bar {
  height: 10px;
  background-color: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background-color: #42b983;
  transition: width 0.3s ease;
}

.round-info {
  font-size: 14px;
  color: #666;
}

/* 讨论记录 */
.discussion-records {
  width: 100%;
  max-width: 600px;
  background-color: white;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
  overflow-y: auto;
  max-height: 200px;
}

.discussion-records h3 {
  margin-bottom: 10px;
  color: #2c3e50;
  font-size: 18px;
}

.record-item {
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.record-item:last-child {
  border-bottom: none;
}
</style>