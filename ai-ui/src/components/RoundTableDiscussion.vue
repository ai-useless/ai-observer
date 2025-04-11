<template>
  <div class="discussion-container">
    <!-- 主题输入区域 -->
    <div class="topic-input-container">
      <h2>圆桌会谈主题设置</h2>
      <div class="input-group">
        <input 
          v-model="discussionTopic" 
          type="text" 
          placeholder="请输入讨论主题..." 
          @keyup.enter="startDiscussion"
        />
        <button @click="startDiscussion">开始讨论</button>
        <button @click="reflashPage" class="btn-danger">重新开始</button>
      </div>
      <audio ref="audioElement" :src="audioSrc"></audio>
    </div>

    <!-- 圆桌讨论区域 -->
    <div class="round-table-container" v-if="discussionStarted">
      <!-- 圆桌 -->
      <div class="round-table">
        <div class="table-center"></div>
      </div>

      <!-- 主持人 -->
      <ParticipantCard 
        :participant="host"
        :isCurrentSpeaker="currentSpeakerId === host.id"
        :message="messages.find(m => m.participantId === host.id)"
        :position="getParticipantPosition(host.id)"
      />

      <!-- 左侧嘉宾 -->
      <ParticipantCard 
        v-for="participant in leftParticipants"
        :key="participant.id"
        :participant="participant"
        :isCurrentSpeaker="currentSpeakerId === participant.id"
        :message="messages.find(m => m.participantId === participant.id)"
        :position="getParticipantPosition(participant.id)"
      />

      <!-- 右侧嘉宾 -->
      <ParticipantCard 
        v-for="participant in rightParticipants"
        :key="participant.id"
        :participant="participant"
        :isCurrentSpeaker="currentSpeakerId === participant.id"
        :message="messages.find(m => m.participantId === participant.id)"
        :position="getParticipantPosition(participant.id)"
      />
    </div>

    <!-- 讨论进度 -->
    <div class="discussion-progress" v-if="discussionStarted">
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: `${(currentRoundIndex / totalRounds) * 100}%` }"
        ></div>
      </div>
      <div class="round-info">
        第 {{ currentRoundIndex + 1 }} 轮 / 共 {{ totalRounds }} 轮
      </div>
    </div>

    <!-- 讨论记录 -->
    <div class="discussion-records" v-if="discussionStarted">
      <h3>讨论记录</h3>
      <div class="record-item" v-for="(message, index) in discussionHistory" :key="index">
        <strong>{{ getParticipantName(message.participantId) }}:</strong> {{ message.content }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { Participant, DiscussionRound, Message, SendMessage } from '../types/Discussion';
import { AIService } from '../utils/aiService';
import ParticipantCard from './ParticipantCard.vue';
import api from '../api/api';

export default defineComponent({
  components: {
    ParticipantCard
  },
  setup() {
    const recordMessages = ref<SendMessage[]>([]);
    const timeMessages = ref<SendMessage[]>([]);
    const subThemes = ref<string>('');
    // 音频资源
    const audioSrc = ref('');
    const audioElement = ref<HTMLAudioElement | null>(null);

    // 参与者数据
    const participants = ref<Participant[]>([
      {
        id: 'host',
        name: '主持人',
        tag: 'AI0',
        speeker: 'zm_031',
        avatar: new URL('@/assets/host.png', import.meta.url).href,
        personality: '请你模仿有20年经验的辩论节目的，专业、公正、善于引导讨论的主持人胡一虎',
        isHost: true
      },
      {
        id: 'guest1',
        name: 'AI学者',
        tag: 'AI1',
        speeker: 'zm_010',
        avatar: new URL('@/assets/guest1.png', import.meta.url).href,
        personality: '请你模仿徐静波的人设性格和说法方式',
        isHost: false
      },
      {
        id: 'guest2',
        name: 'AI企业家',
        tag: 'AI2',
        speeker: 'zm_012',
        avatar: new URL('@/assets/guest2.png', import.meta.url).href,
        personality: '请你模仿张召忠的人设性格和说法方式',
        isHost: false
      },
      {
        id: 'guest3',
        name: 'AI艺术家',
        tag: 'AI3',
        speeker: 'zm_041',
        avatar: new URL('@/assets/guest3.png', import.meta.url).href,
        personality: '你是时代周刊主编的人设性格和说法方式',
        isHost: false
      },
      {
        id: 'guest4',
        name: 'AI工程师',
        tag: 'AI4',
        speeker: 'zm_011',
        avatar: new URL('@/assets/guest4.png', import.meta.url).href,
        personality: '请你模仿胡锡进的人设性格和说法方式',
        isHost: false
      },
      {
        id: 'guest5',
        name: 'AI心理学家',
        tag: 'AI5',
        speeker: 'zf_027',
        avatar: new URL('@/assets/guest5.png', import.meta.url).href,
        personality: '请你模仿鲁豫的人设性格和说法方式',
        isHost: false
      },
      {
        id: 'guest6',
        name: 'AI历史学家',
        tag: 'AI6',
        speeker: 'zf_044',
        avatar: new URL('@/assets/guest6.png', import.meta.url).href,
        personality: '请你模仿林志玲的人设性格和说法方式',
        isHost: false
      }
    ]);

    // 讨论主题
    const discussionTopic = ref<string>('');
    // 显示图像
    const discussionStarted = ref<boolean>(false);

    // 主持人开场时间(秒)
    const hostStartTime = 20
    // 主持人串场时间(秒)
    const hostSpeekTime = 20
    // 嘉宾发言时间(秒)
    const guestSpeekTime = 30
    // 打字机语速
    const speekerSpeed = 180

    // AI拆解主题
    const generateSubTheme = (theme: string): string => {
      return `请你就“${theme}”这个主题，拆解出${totalRounds.value}个递进层次的小主题，要求只输出主题和主题相关素材（格式如下：本期主题：xxxxx,(1).xxxxx，素材：xxxx；(2).xxxxxxx，素材：xxxxxxx）`
    }

    // 引导主持人开场
    const generateHostStart = (index: number, user: number): string => {
      return `你是有20年经验的辩论节目主持人，需达成：1) 每段发言≤${hostStartTime}秒,小于100字 2) 只输出发言内容，不允许有表情，标签，换行符和提示 3) 开头先对本期主题做一个简单描述，进行开场说明"当前讨论的主题和内容为：${subThemes.value}`
    }

    // 引导主持人说出本阶段子主题
    const generateHostMsg = (subTopic: string): string => {
      const question = `你是有20年经验的辩论节目的，专业、公正、善于引导讨论的主持人, 今天讨论的主题为："${discussionTopic.value}",本轮主要讨论的是${subTopic}这个小主题，请就这个小主题拓展和开场，然后让嘉宾来讨论这个话题，要求：1) 直接输出发言内容，不允许有表情，标签，换行符和提示 2) 发言时间≤${hostSpeekTime}秒，小于100字 3) 结尾要抛出问题让嘉宾来讨论,以“下面有请嘉宾发言”结束`
      return question
    }

    // 引导嘉宾发言
    const generateResQuestion = (personality: string):string => {
      const question = `${personality},本期节目主持人对你说的话为："${hostMessage.value}"，请用你的人设直接说出你的发言，要求：1) 只把发言内容输出出来，不允许有表情，标签，换行符和提示 2)发言时间≤${guestSpeekTime}秒，小于100字 3) 发言内容符合自己的人设和主观`
      console.log(personality, '=====', question)
      return question
    }

    const hostInviteNextGuest = (round: number):string => {
      return `第${round}轮讨论到此结束，感谢各位嘉宾的精彩发言。`
    }

    // 主持人
    const host = computed(() => participants.value.find(p => p.isHost)!);

    // 左侧嘉宾（3人）
    const leftParticipants = computed(() => 
      participants.value.filter(p => !p.isHost && ['guest1', 'guest2', 'guest3'].includes(p.id))
    );

    // 右侧嘉宾（3人）
    const rightParticipants = computed(() => 
      participants.value.filter(p => !p.isHost && ['guest4', 'guest5', 'guest6'].includes(p.id))
    );

    // 讨论轮次
    const currentRoundIndex = ref<number>(0);
    const totalRounds = ref<number>(1);
    const discussionRounds = ref<DiscussionRound[]>([]);

    // 当前发言者
    const currentSpeakerId = ref<string>('');
    const currentSpeakerIndex = ref<number>(0);

    // 消息状态
    const messages = ref<Message[]>(participants.value.map(p => ({
      participantId: p.id,
      content: '',
      isThinking: false,
      isSpeaking: false
    })));

    const hostMessage = ref<string>('');

    // 讨论历史记录
    const discussionHistory = ref<Message[]>([]);

    // 刷新页面重新开始
    const reflashPage = () => {
      window.location.reload();
    }

    // 获取参与者位置
    const getParticipantPosition = (participantId: string) => {
      const index = participants.value.findIndex(p => p.id === participantId);
      if (index === -1) return { top: '40%', left: '46%' };

      // 主持人在顶部
      if (participants.value[index].isHost) {
        return { top: '-18%', left: '46%' };
      }

      // 左侧嘉宾
      if (['guest1', 'guest2', 'guest3'].includes(participantId)) {
        const angle = 120 + (index - 1) * 40; // 从120度开始，每个嘉宾间隔40度
        return calculatePosition(angle);
      }

      // 右侧嘉宾
      if (['guest4', 'guest5', 'guest6'].includes(participantId)) {
        const angle = 60 - (index - 4) * 40; // 从60度开始，每个嘉宾间隔40度
        return calculatePosition(angle);
      }

      return { top: '50%', left: '50%' };
    };

    // 根据角度计算位置
    const calculatePosition = (angle: number) => {
      const radius = 300; // 圆桌半径
      const x = radius * Math.cos(angle * Math.PI / 180);
      const y = radius * Math.sin(angle * Math.PI / 180);
      
      return {
        top: `calc(40% + ${y}px)`,
        left: `calc(46% + ${x}px)`
      };
    };

    // 获取参与者名称
    const getParticipantName = (participantId: string) => {
      return participants.value.find(p => p.id === participantId)?.name || '';
    };

    
    const dynamicTagCleaner = (html: string, tagName: string) => {
      return html.replace(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'gis'), '');
    }

    const removeThinkTag = (content: string): string => {
      let showContent = content.replace(/<div\s+class=['"]think['"][^>]*>.*?<\/div>/gis, '');
      showContent = dynamicTagCleaner(showContent, 'reasoning')
      return showContent
    }

    const splitTopic = (content: string): string[] => {
      console.log(content)
      // 使用正则表达式匹配所有以 (1)., (2)., (3). 开头的内容
      const matches = content.match(/\(\d+\)\..*?(?=\(\d+\)\.|$)/gs);

      if (matches) {
        // 去掉开头的 (1)., (2)., (3). 并整理成数组
        const result = matches.map(item => item.trim().replace(/^\(\d+\)\.\s*/, ''));
        console.log(result);
        return result
      } else {
        console.log('没有匹配到内容');
      }
      return []
    }

    // 打乱数组顺序
    const shuffleArray = (array: string[]) => {
      const newArray = [...array];
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
      }
      return newArray;
    };

    // 自动播放音频
    const startSpeek = ref<boolean>(false)

    const togglePlay = async (base64Data: string) => {
      try {
        const cleanBase64 = base64Data.replace(/^data:audio\/\w+;base64,/, '');
    
        // 转换为 Blob
        const byteCharacters = atob(cleanBase64);
        const byteArrays = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArrays[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([byteArrays], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(blob);
        
        // 创建 Audio 实例
        const audio = new Audio(audioUrl);
        
        // 使用 Promise 确保播放完成
        const playPromise = audio.play();
        
        // 等待播放开始
        if (playPromise !== undefined) {
          await playPromise;
        }
        
        // 音频开始播放后执行后续代码
        console.log('音频开始播放，执行后续代码');
      } catch (error) {
        console.error('音频加载失败:', error);
      }
    };

    // 让某位参与者发言
    const speak = async (participantId: string, topic: string) => {
      const participant = participants.value.find(p => p.id === participantId)!;
      const messageIndex = messages.value.findIndex(m => m.participantId === participantId);
      
      // 设置思考状态
      messages.value[messageIndex].isThinking = true;
      messages.value[messageIndex].isSpeaking = false;
      messages.value[messageIndex].content = '';

      let response = ''
      if (participantId === 'host') {
        let hostMsg = generateHostMsg(topic)
        if (!startSpeek.value) {
          hostMsg = generateHostStart(1, 5)
          startSpeek.value = true
        }
        console.log('引导主持人提问：', hostMsg)
        timeMessages.value = []
        timeMessages.value.push({
          role: 'user',
          content: hostMsg
        });
        // 获取AI响应
        const hostResponse = await api.getAIResponse('AI0', timeMessages.value);
        response = removeThinkTag(hostResponse.content)
      
        hostMessage.value = response
      } else {
        const respondenter = participant.tag
        const respondenterMessage = generateResQuestion(participant.personality)
        // 构建问题，引导回答
        timeMessages.value = []
        timeMessages.value.push({
          role: 'user',
          content: respondenterMessage
        });
        const respondenterResponse = await api.getAIResponse(respondenter, timeMessages.value);
        response = removeThinkTag(respondenterResponse.content)
      }

      // 生成语音
      recordMessages.value.push({
        role: 'assistant',
        content: response
      })
      console.log('开始生成语音')
      const audioResponse = await api.getKokoroAIAudio(response, participant.speeker, 1.1);
      audioSrc.value = audioResponse.data
      await togglePlay(audioResponse.data)

      // 开始发言
      messages.value[messageIndex].isThinking = false;
      messages.value[messageIndex].isSpeaking = true;
      
      currentSpeakerId.value = participantId;
      currentSpeakerIndex.value = messageIndex;
      
      // 打字机效果输出
      await typeWriterEffect(response);

      // 保存到讨论历史
      discussionHistory.value.push({
        participantId,
        content: response,
        isThinking: false,
        isSpeaking: false
      });
      
      // 3秒后重置
      setTimeout(() => {
        messages.value[messageIndex].isSpeaking = false;
        messages.value[messageIndex].content = '';
        currentSpeakerId.value = '';
      }, 3000);
    };

    // 不使用AI生成内容，直接将内容生成语音读出
    const speakNoGenerage = async (participantId: string, content: string) => {
      const participant = participants.value.find(p => p.id === participantId)!;
      const messageIndex = messages.value.findIndex(m => m.participantId === participantId);
      
      // 设置思考状态
      messages.value[messageIndex].isThinking = true;
      messages.value[messageIndex].isSpeaking = false;
      messages.value[messageIndex].content = '';

      let response = content

      // 生成语音
      console.log('开始生成语音')
      const audioResponse = await api.getKokoroAIAudio(response, participant.speeker, 1.1);
      audioSrc.value = audioResponse.data
      await togglePlay(audioResponse.data)

      // 开始发言
      messages.value[messageIndex].isThinking = false;
      messages.value[messageIndex].isSpeaking = true;
      
      currentSpeakerId.value = participantId;
      currentSpeakerIndex.value = messageIndex;
      
      // 打字机效果输出
      await typeWriterEffect(response);
      
      // 保存到讨论历史
      discussionHistory.value.push({
        participantId,
        content: response,
        isThinking: false,
        isSpeaking: false
      });
      
      // 3秒后重置
      setTimeout(() => {
        messages.value[messageIndex].isSpeaking = false;
        messages.value[messageIndex].content = '';
        currentSpeakerId.value = '';
      }, 3000);
    };

    // 智能分段算法
    const smartSegmentation = (text: string, maxSegmentLength: number): string[] => {
      const segments: string[] = [];
      let currentSegment = '';

      // 按句子分隔文本
      const sentences = text.split(/(?<=[.!?])\s+/); // 在句子结束符后分隔

      for (let sentence of sentences) {
        // 如果当前句子加上当前段落的长度超过限制
        if (currentSegment.length + sentence.length + 1 > maxSegmentLength) {
          // 如果当前段落不为空，保存当前段落
          if (currentSegment.length > 0) {
            segments.push(currentSegment);
            currentSegment = '';
          }

          // 检查句子本身是否超过长度限制
          if (sentence.length > maxSegmentLength) {
            // 在词语边界分段（避免在单词中间截断）
            while (sentence.length > maxSegmentLength) {
              // 找到最接近 maxSegmentLength 的空格或标点符号
              const splitPoint = Math.min(
                sentence.lastIndexOf(' ', maxSegmentLength),
                sentence.lastIndexOf('.', maxSegmentLength),
                sentence.lastIndexOf(',', maxSegmentLength),
                sentence.lastIndexOf(';', maxSegmentLength)
              );

              // 如果没有找到合适的分隔点，则强制截断
              const splitIndex = splitPoint !== -1 ? splitPoint + 1 : maxSegmentLength;
              const segmentPart = sentence.substring(0, splitIndex);
              segments.push(segmentPart);

              // 剩余部分继续处理
              sentence = sentence.substring(splitIndex).trim();
            }
          }
        }

        // 将句子添加到当前段落
        if (currentSegment.length > 0) {
          currentSegment += ' ' + sentence;
        } else {
          currentSegment = sentence;
        }

        // 如果当前段落已经达到长度限制，保存并重置
        if (currentSegment.length >= maxSegmentLength) {
          segments.push(currentSegment);
          currentSegment = '';
        }
      }

      // 添加最后一段（如果有）
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
      }

      return segments;
    };

    // 打字机效果
    const typeWriterEffect = async (text: string) => {
      // 将文本按段落分隔（可以根据需要调整分隔符）
      // const paragraphs = text.split('\n\n');
      const paragraphs = smartSegmentation(text, 50);
      console.log('分段内容： ', paragraphs)
      // 逐段输出
      for (let i = 0; i < paragraphs.length; i++) {
        // 清空上一段内容（如果是第一段则不需要清空）
        if (i > 0) {
          messages.value[currentSpeakerIndex.value].content = '';
        }

        // 当前段落的文本
        const paragraph = paragraphs[i];
        
        // 打字机效果输出当前段落
        await new Promise(resolve => {
          let j = 0;
          const interval = setInterval(() => {
            if (j < paragraph.length) {
              messages.value[currentSpeakerIndex.value].content += paragraph.charAt(j);
              j++;
            } else {
              clearInterval(interval);
              resolve(true);
            }
          }, speekerSpeed); // 打字速度
        });
      }
    };

    // 主持人总结
    const hostSummary = async () => {
      const allMessages = [...messages.value];
      const summary = await AIService.generateSummary(allMessages, recordMessages.value);
      
      const hostMessageIndex = messages.value.findIndex(m => m.participantId === 'host');
      messages.value[hostMessageIndex].isSpeaking = true;
      currentSpeakerId.value = 'host';
      
      // 打字机效果输出总结
      await typeWriterEffect(summary);
      
      // 保存到讨论历史
      discussionHistory.value.push({
        participantId: 'host',
        content: summary,
        isThinking: false,
        isSpeaking: false
      });
      
      // 重置状态
      setTimeout(() => {
        messages.value.forEach(m => {
          m.isThinking = false;
          m.isSpeaking = false;
          m.content = '';
        });
        currentSpeakerId.value = '';
        discussionStarted.value = false;
        discussionTopic.value = '';
      }, 10000000); // 总结显示10秒
    };

    const themeMessages = ref<SendMessage[]>([]);

    // 开始讨论
    const startDiscussion = async () => {
      if (!discussionTopic.value) {
        alert('请输入讨论主题');
        return;
      }

      discussionStarted.value = true;
      // 按轮次拆解主题
      const sendQuestion = generateSubTheme(discussionTopic.value)
      themeMessages.value.push({
        role: 'user',
        content: sendQuestion
      });
      const ai1Response = await api.getAIResponse('AI0', themeMessages.value);
      subThemes.value = removeThinkTag(ai1Response.content)
      
      // 初始化讨论轮次
      discussionRounds.value = Array.from({ length: totalRounds.value }, (_, i) => ({
        topic: discussionTopic.value,
        subtopics: splitTopic(subThemes.value),
        currentSubtopicIndex: 0,
        participantsOrder: shuffleArray(participants.value.filter(p => !p.isHost).map(p => p.id))
      }));
      
      // 开始第一轮讨论
      await startRound(0);
    };

    // 开始本轮讨论
    const startRound = async (roundIndex: number) => {
      console.log('roundIndex: ', roundIndex)
      console.log('discussionRounds.value.length: ', discussionRounds.value.length)
      if (roundIndex >= discussionRounds.value.length) {
        // 所有轮次结束，主持人总结
        await hostSummary();
        return;
      }

      currentRoundIndex.value = roundIndex;
      const currentRound = discussionRounds.value[roundIndex];

      // 主持人介绍本轮主题
      await speak('host', discussionTopic.value);
      
      // 遍历子话题
      for (let i = 0; i < currentRound.subtopics.length; i++) {
        currentRound.currentSubtopicIndex = i;
        const subtopic = currentRound.subtopics[i];
        
        // 主持人介绍子话题
        await speak('host', subtopic);
        
        // 按顺序让每位嘉宾发言
        for (let j = 0; j < currentRound.participantsOrder.length; j++) {
          const participantId = currentRound.participantsOrder[j];
          await speak(participantId, subtopic);
        }
      }
      
      // 轮次结束，主持人总结
      await speakNoGenerage('host', hostInviteNextGuest(roundIndex + 1));
      
      // 开始下一轮
      setTimeout(() => startRound(roundIndex + 1), 1500);
    };

    return {
      participants,
      host,
      leftParticipants,
      rightParticipants,
      discussionTopic,
      discussionStarted,
      currentRoundIndex,
      totalRounds,
      currentSpeakerId,
      messages,
      discussionHistory,
      getParticipantPosition,
      getParticipantName,
      startDiscussion,
      audioSrc,
      audioElement,
      reflashPage
    };
  }
});
</script>

<style scoped>
.btn-danger {
  padding: 10px 20px;
  background-color: #ff1244;
  color: white;
  border: none;
  border-radius: 5px 5px 5px 5px;
  cursor: pointer;
}
.btn-danger:hover {
  background-color: #ff4444;
}
</style>