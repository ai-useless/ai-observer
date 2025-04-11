<template>
  <div class="chat-container">
    <h1>AI Battle</h1>
    <div class="chat-messages" ref="chatMessages">
      <div v-for="(message, index) in messages" :key="index" class="message-container">
        <div v-if="message.sender === 'system'" class="system-message">
          <span class="system-message-span">{{ message.content }}</span>
        </div>
        <div v-else-if="message.sender !== 'user'" class="ai-message-wrapper">
          <div class="sender-info">
            <img :class="['avatar', getAvatar(message.sender)]" :src="getAvatarSrc(message.sender)">
            <div class="sender-name">{{ message.sender }}</div>
          </div>
          <div class="message-bubble" :class="getBubble(message.sender)">
            <div v-html="message.content"></div>
          </div>
        </div>
        <div v-else class="user-message-wrapper">
          <div class="message-bubble user-bubble">
            <div v-html="message.content"></div>
          </div>
          <div class="sender-info">
            <img class="avatar user-avatar" :src="getAvatarSrc(message.sender)">
          </div>
        </div>
      </div>
      <div v-if="currentMessage" class="message-container">
        <div v-if="currentMessage.sender === 'system'" class="system-message">
          {{ currentMessage.content }}
        </div>
        <div v-else-if="currentMessage.sender !== 'user'" class="ai-message-wrapper">
          <div class="sender-info">
            <img :class="['avatar', getAvatar(currentMessage.sender)]" :src="getAvatarSrc(currentMessage.sender)">
            <div class="sender-name">{{ currentMessage.sender }}</div>
          </div>
          <div class="message-bubble" :class="getBubble(currentMessage.sender)">
            <div v-html="currentMessage.content"></div>
          </div>
        </div>
        <div v-else class="user-message-wrapper">
          <div class="message-bubble user-bubble">
            <div v-html="currentMessage.content"></div>
          </div>
          <div class="sender-info">
            <img class="avatar user-avatar" :src="getAvatarSrc(currentMessage.sender)">
          </div>
        </div>
      </div>
      <div v-if="thinking" class="message-container">
        <div class="ai-message-wrapper">
          <div class="sender-info">
            <img :class="['avatar', getAvatar(thinkingSender)]" :src="getAvatarSrc(thinkingSender)">
            <div class="sender-name">{{ thinkingSender }}</div>
          </div>
          <div class="thinking-bubble">
            正在思考{{ thinkingDots }}
          </div>
        </div>
      </div>
    </div>
    <div class="input-area">
      <input v-model="newMessage" @keyup.enter="sendMessage" placeholder="请输入消息...">
      <button @click="sendMessage" class="btn-primary">发送</button>
      <button @click="stopBattle" class="btn-danger">本轮停止</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, nextTick, onMounted, onUnmounted } from 'vue';
import api from '../api/api';

interface Message {
  sender: string;
  content: string;
}

interface SendMessage {
  role: string;
  content: string;
}

export default defineComponent({
  name: 'AI-Battle',
  setup() {
    const chatMessages = ref<HTMLElement | null>(null);
    // 展示在前端的回复
    const messages = ref<Message[]>([]);
    // 发送给AI的回复
    // 用户设定的主题
    const totalQuestion = ref<string>('');
    const subThemes = ref<string>('');
    const subTopics = ref<string[]>([]);
    // 发送给每个AI的问题(全上下文)
    const sendMessages = ref<SendMessage[]>([]);
    const timeMessages = ref<SendMessage[]>([]);

    const themeMessages = ref<SendMessage[]>([]);

    // 继续滚动
    const continueScroll = ref<boolean>(true)
    
    const newMessage = ref<string>('');
    const debateRound = ref<number>(0);
    // 最大battle次数
    const maxRounds = ref<number>(8);
    const allowBattle = ref<boolean>(true);
    let questioner = Math.random() > 0.5 ? 'AI1' : 'AI2';
    const avatars: { [key: string]: string } = {
      user: new URL('@/assets/User.png', import.meta.url).href,
      AI0: new URL('@/assets/host.png', import.meta.url).href,
      AI1: new URL('@/assets/guest1.png', import.meta.url).href,
      AI2: new URL('@/assets/guest2.png', import.meta.url).href,
      AI3: new URL('@/assets/guest3.png', import.meta.url).href,
      AI4: new URL('@/assets/guest4.png', import.meta.url).href,
      AI5: new URL('@/assets/guest5.png', import.meta.url).href,
      AI6: new URL('@/assets/guest6.png', import.meta.url).href
    };
    const currentMessage = ref<Message | null>(null);
    const thinking = ref<boolean>(false);
    const thinkingSender = ref<string>('');
    const thinkingDots = ref<string>('');
    let thinkingInterval: any = null;
    const hostMessage = ref<string>('');
    // 参与人数
    const userCount = 6
    // 讨论轮次
    const themeRounds = 3
    // 发言顺序
    const speakRounds = ref<number[][]>();

    const sendPrePrompt = '(使用纯文字或表情输出，不能用Markdown的格式符号)'

    // 拆解主题
    const generateSubTheme = (theme: string): string => {
      return `请你就“${theme}”这个主题，拆解出${themeRounds}个递进层次的小主题，要求只输出主题和主题相关素材（格式如下：本期主题：xxxxx,(1).xxxxx，素材：xxxx；(2).xxxxxxx，素材：xxxxxxx）`
    }

    // 引导主持人开场
    const generateHostStart = (index: number, user: number): string => {
      return `你是有20年经验的辩论节目主持人，需达成：1) 每段发言≤40秒 2) 只输出发言内容，不要带有其他符号和提示 3) 开头先对本期主题做一个简单描述，进行开场说明"当前讨论的主题和内容为：${subThemes.value}`
    }

    const generateQuestion = (response: string): string => {
      // return `${sendPrePrompt}关于“${totalQuestion.value}”这个问题，另一个人给出的回答是“${response}”，(如果发现这个人的回答内容里已经屈服或者觉得他已经没有继续下去的想法了，就在回复的时候加上<finallyend>标签，否则不用加<finallyend>标签，继续提问就行)，请你用人的语气直接对这个人观点进行口语化提问，并直接说出要提问的问题`
      return `${sendPrePrompt}关于“${totalQuestion.value}”这个问题，另一个人给出的回答是“${response}”，(如果发现这个人的回答内容里已经屈服或者觉得他已经没有继续下去的想法了，就在回复的时候加上<finallyend>标签，否则不用加<finallyend>标签，继续提问就行)，请你用人的语气直接对这个人观点进行口语化提问，并直接说出要提问的问题`
      // return `${sendPrePrompt}关于“${totalQuestion.value}”这个问题，另一个人给出的回答是“${response}”，请你用人的语气直接对这个人观点进行口语化提问，并直接说出要提问的问题`
    };

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

    const sendMessage = async () => {
      if (newMessage.value.trim()) {
         // 设置回答顺序
        speakRounds.value = generateRounds(themeRounds, userCount)
        console.log(speakRounds.value)

        allowBattle.value = true
        totalQuestion.value = newMessage.value
        // 添加用户消息
        messages.value.push({
          sender: 'user',
          content: newMessage.value
        });

        // 构建子题目
        const sendQuestion = generateSubTheme(newMessage.value)
        themeMessages.value.push({
          role: 'user',
          content: sendQuestion
        });
        newMessage.value = '';
        scrollToBottom();

        // 获取AI1的回复
        showThinking('AI0');
        const ai1Response = await api.getAIResponse('AI0', themeMessages.value);
        hideThinking();
        // 将子题目设置为用户提问
        subThemes.value = removeThinkTag(ai1Response.content)
        console.log('拆解主题')
        subTopics.value = splitTopic(subThemes.value)
        messages.value.push({
          sender: 'user',
          content: subThemes.value
        });

        // 开始讨论
        // 主持人开场，引导主持人开场
        const hostStart = generateHostStart(1, 5)
        themeMessages.value.push({
          role: 'user',
          content: hostStart
        });
        const hostStartResponse = await api.getAIResponse('AI0', themeMessages.value);
        await displayTypewriter(hostStartResponse, 'AI0');
        // 开始讨论
        setTimeout(startRound, 1000);
      }
    };

    const getAvatar = (user: string): string => {
      let avatar = ''
      switch(user) {
        case 'AI0':
          avatar = 'ai0-avatar'
          break
        case 'AI1':
          avatar = 'ai1-avatar'
          break
        case 'AI2':
          avatar = 'ai2-avatar'
          break
        case 'AI3':
          avatar = 'ai3-avatar'
          break
        case 'AI4':
          avatar = 'ai4-avatar'
          break
        case 'AI5':
          avatar = 'ai5-avatar'
          break
        case 'AI6':
          avatar = 'ai6-avatar'
          break
      }
      return avatar
    }

    const getBubble = (user: string): string => {
      let bubble = ''
      switch(user) {
        case 'AI0':
          bubble = 'ai0-bubble'
          break
        case 'AI1':
          bubble = 'ai1-bubble'
          break
        case 'AI2':
          bubble = 'ai2-bubble'
          break
        case 'AI3':
          bubble = 'ai3-bubble'
          break
        case 'AI4':
          bubble = 'ai4-bubble'
          break
        case 'AI5':
          bubble = 'ai5-bubble'
          break
        case 'AI6':
          bubble = 'ai6-bubble'
          break
      }
      return bubble
    }

    const generateResQuestion = (user: string): string => {
      let persona = ''
      switch(user) {
        case 'AI0':
          persona = '你是有20年经验的辩论节目的，专业、公正、善于引导讨论的主持人'
          break
        case 'AI1':
          persona = '你是一个理性、注重数据和事实的学者'
          break
        case 'AI2':
          persona = '你是一个务实、关注商业价值的企业家'
          break
        case 'AI3':
          persona = '你是一个感性、富有创造力的艺术家'
          break
        case 'AI4':
          persona = '你是一个技术导向、逻辑性强的工程师'
          break
        case 'AI5':
          persona = '你是一个关注人性和心理因素的心理学家'
          break
        case 'AI6':
          persona = '你是一个历史视角、注重背景的历史学家'
          break
      }
      const question = `${persona},本期节目主持人对你说的话为："${hostMessage.value}"，请用你的人设直接说出你的发言，要求：1) 只把发言内容输出出来 2)发言时间≤60秒，小于200字 3) 发言内容符合自己的人设和主观`
      console.log(user,'=====',question)
      return question
    }

    const generateHostMsg = (round: number): string => {
      const subTopic = subTopics.value[round-1]
      const question = `你是有20年经验的辩论节目的，专业、公正、善于引导讨论的主持人, 今天讨论的主题为："${totalQuestion.value}",本轮主要讨论的是${subTopic}这个小主题，请就这个小主题拓展和开场，然后引出嘉宾来讨论这个话题，要求：1) 直接输出发言内容 2) 发言时间≤60秒，小于200字 3) 结尾要抛出问题让嘉宾来讨论`
      return question
    }

    const generateHostEndding = (): string => {
      const question = `你是有20年经验的辩论节目的，专业、公正、善于引导讨论的主持人, 今天讨论的主题为："${subThemes.value}",在你的引导和提问下，嘉宾们都做出了自己的发言和观点输出，请你总结上面的回答，结合主题，发表你的总结陈词内容，要求：1) 直接输出发言内容 2) 发言时间≤120秒，小于400字 3)`
      return question
    }
    

    const startRound = async () => {
      let curRound = 0
      if (speakRounds.value) {
        for (const round of speakRounds.value) { // 类型推断为 number[]
          curRound++
          const hostMsg = generateHostMsg(curRound)
          console.log('引导主持人提问：', hostMsg)
          timeMessages.value = []
          timeMessages.value.push({
            role: 'user',
            content: hostMsg
          });
          // 主持人提出问题
          console.log('>>>>>>>>>>>>>被提问人回答问题的请求内容: ', timeMessages.value[timeMessages.value.length-1])
          showThinking('AI0');
          const hostResponse = await api.getAIResponse('AI0', timeMessages.value);
          hideThinking();
          sendMessages.value.push({
            role: 'assistant',
            content: removeThinkTag(hostResponse.content)
          });
          await displayTypewriter(hostResponse, 'AI0');
          scrollToBottom();
          if (hostResponse.content == "") {
            console.log("AI未答复，暂停讨论")
            addSystemMessage('AI未答复，暂停讨论')
            return
          }
          hostMessage.value = removeThinkTag(hostResponse.content)

          // let firstHost = true
          for (const speaker of round) { // 自动推断为 number
            if (speaker === 0) {
              continue
            }
            // firstHost = false
            console.log(speaker); // 直接操作每个发言者编号
            const respondenter = `AI${speaker}`
            const respondenterMessage = generateResQuestion(respondenter)
            // 构建问题，引导回答
            timeMessages.value = []
            timeMessages.value.push({
              role: 'user',
              content: respondenterMessage
            });
            // 被提问人回答问题
            console.log('>>>>>>>>>>>>>被提问人回答问题的请求内容: ', timeMessages.value[timeMessages.value.length-1])
            showThinking(respondenter);
            const respondenterResponse = await api.getAIResponse(respondenter, timeMessages.value);
            hideThinking();

            sendMessages.value.push({
              role: 'assistant',
              content: removeThinkTag(respondenterResponse.content)
            });
            console.log("---------------66666--sendMessages.value: ", sendMessages.value)
            await displayTypewriter(respondenterResponse, respondenter);
            scrollToBottom();
            if (respondenterResponse.content == "") {
              console.log("AI未答复，暂停讨论")
              addSystemMessage('AI未答复，暂停讨论')
              return
            }
            console.log('>>>>>>>>>>>>>被提问人回答的内容: ', respondenterResponse.content)
          }
        }
        // 主持人总结陈词
        const hostMsgEndding = generateHostEndding()
          sendMessages.value.push({
            role: 'user',
            content: hostMsgEndding
          });
          // 主持人提出问题
          console.log('>>>>>>>>>>>>>被提问人回答问题的请求内容: ', sendMessages.value[sendMessages.value.length-1])
          showThinking('AI0');
          const hostResponse = await api.getAIResponse('AI0', sendMessages.value);
          hideThinking();
          sendMessages.value.push({
            role: 'assistant',
            content: removeThinkTag(hostResponse.content)
          });
          await displayTypewriter(hostResponse, 'AI0');
          scrollToBottom();
          if (hostResponse.content == "") {
            console.log("AI未答复，暂停讨论")
            addSystemMessage('AI未答复，暂停讨论')
            return
          }
          hostMessage.value = removeThinkTag(hostResponse.content)
      }
    }

    const nextRound = async () => {
      if (debateRound.value >= maxRounds.value || !allowBattle.value) {
				console.log('system', '讨论已达到最大轮次，结束讨论。');
        addSystemMessage('讨论已达到最大轮次，结束讨论')
				return;
			}
      console.log('-----当前轮次: ', debateRound.value)
      console.log('-----当前轮次: ', debateRound.value)
      console.log('-----当前轮次: ', debateRound.value)

			debateRound.value++;
      const respondenter = questioner === "AI1" ? "AI2" : "AI1"

      addSystemMessage(`${questioner} 向 ${respondenter} 提出问题`)
      // 引导AI提出问题
      let question = generateQuestion(sendMessages.value[sendMessages.value.length - 1].content);
      if (debateRound.value === 1) {
        question = generateQuestion(questioner === 'AI1' ? sendMessages.value[sendMessages.value.length - 1].content : sendMessages.value[sendMessages.value.length - 2].content);
      }
      console.log("---------------11111--sendMessages.value: ", sendMessages.value)
			let questionMsgs = ref<SendMessage[]>([])
      for (let i = 0; i < sendMessages.value.length; i++) {
        questionMsgs.value.push(sendMessages.value[i]);  
      }
      // questionMsgs.value = sendMessages.value
      questionMsgs.value.push({
        role: 'user',
        content: question
      });

      console.log('============引导AI提出问题: ', question)
      console.log('============引导AI提出问题的请求内容: ', questionMsgs.value[questionMsgs.value.length-1])
      console.log("---------------22222--sendMessages.value: ", sendMessages.value)
      // 提问者思考出问题
      showThinking(questioner);
      const questionerResponse = await api.getAIResponse(questioner, questionMsgs.value);
      hideThinking();

      console.log('AI提问：', questionerResponse.content)
      console.log("---------------33333--sendMessages.value: ", sendMessages.value)
      if (questionerResponse.content.includes('<finallyend>')) {
        addSystemMessage(`讨论结束`)
        return
      }

      sendMessages.value.push({
        role: 'user',
        content: `${sendPrePrompt}${questionerResponse.content}`
      });
      console.log("---------------44444--sendMessages.value: ", sendMessages.value)
      await displayTypewriter(questionerResponse, questioner);
      scrollToBottom();
      if (questionerResponse.content == "") {
        console.log("AI未答复，暂停讨论")
        addSystemMessage('AI未答复，暂停讨论')
        return
      }
      console.log('============AI提出的问题 ', questionerResponse.content)

      // 被提问人回答问题
      console.log('>>>>>>>>>>>>>被提问人回答问题的请求内容: ', sendMessages.value[sendMessages.value.length-1])
      showThinking(respondenter);
      const respondenterResponse = await api.getAIResponse(respondenter, sendMessages.value);
      hideThinking();

      sendMessages.value.push({
        role: 'assistant',
        content: respondenterResponse.content
      });
      console.log("---------------66666--sendMessages.value: ", sendMessages.value)
      await displayTypewriter(respondenterResponse, respondenter);
      scrollToBottom();
      if (respondenterResponse.content == "") {
        console.log("AI未答复，暂停讨论")
        addSystemMessage('AI未答复，暂停讨论')
        return
      }
      console.log('>>>>>>>>>>>>>被提问人回答的内容: ', respondenterResponse.content)

      // 继续下一轮
      setTimeout(nextRound, 1000);
    };

    const stopBattle = async () => {
      allowBattle.value = false
    }

    const displayTypewriter = (message: Message, sender: string) => {
      return new Promise<void>((resolve) => {
        let content = '';
        const fullContent = removeThinkTag(message.content);
        const speed = 50; // 打字速度（毫秒）

        currentMessage.value = {
          sender: sender,
          content: ''
        };

        const interval = setInterval(() => {
          if (content.length < fullContent.length) {
            content += fullContent.charAt(content.length);
            currentMessage.value!.content = content;
            scrollToBottom();
          } else {
            clearInterval(interval);
            messages.value.push({
              sender: sender,
              content: content
            });
            currentMessage.value = null;
            resolve();
          }
        }, speed);
      });
    };

    const scrollToBottom = () => {
      if (chatMessages.value && continueScroll.value) {
        nextTick(() => {
          if (chatMessages.value) {
            chatMessages.value.scrollTop = chatMessages.value.scrollHeight;
          }
        });
      }
    };

    const getAvatarSrc = (sender: string): string => {
      return avatars[sender] || avatars.user;
    };

    const addSystemMessage = (content: string) => {
      messages.value.push({
        sender: 'system',
        content: content
      });
      scrollToBottom()
    };

    const showThinking = (sender: string) => {
      thinkingSender.value = sender;
      thinking.value = true;
      thinkingDots.value = '';
      let dotCount = 0;

      thinkingInterval = setInterval(() => {
        dotCount = (dotCount + 1) % 4;
        thinkingDots.value = '.'.repeat(dotCount);
        scrollToBottom()
      }, 500);
    };

    const hideThinking = () => {
      thinking.value = false;
      clearInterval(thinkingInterval);
    };

    const dynamicTagCleaner = (html: string, tagName: string) => {
      return html.replace(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'gis'), '');
    }

    const removeThinkTag = (content: string): string => {
      let showContent = content.replace(/<div\s+class=['"]think['"][^>]*>.*?<\/div>/gis, '');
      showContent = dynamicTagCleaner(showContent, 'reasoning')
      return showContent
    }

    // 检测函数
    const checkScrollBottom = (element: HTMLDivElement): boolean => {
      const { scrollTop, clientHeight, scrollHeight } = element;
      return Math.abs(scrollHeight - clientHeight - scrollTop) < 1; // 允许1px误差
    };

    // 滚动事件处理器（需节流优化）
    const handleScroll = (e: Event) => {
      const target = e.currentTarget as HTMLDivElement;
      if (checkScrollBottom(target)) {
        console.log('已滚动到底部');
        continueScroll.value = true
      } else {
        continueScroll.value = false
      }
    };

    // 组件挂载时绑定监听
    onMounted(() => {
      chatMessages.value?.addEventListener('scroll', handleScroll, { passive: false }); // [6](@ref)
    });

    // 卸载时移除监听
    onUnmounted(() => {
      chatMessages.value?.removeEventListener('scroll', handleScroll);
    });

    type RoundMode = 1 | 2 | 3;

    const generateRounds = (rounds: number, people: number): number[][] => {
        if (people < 1 || rounds < 1) return [];
        
        const result: number[][] = [];
        
        // 基础数组生成（包含1到人数的数组）
        const baseArray = Array.from({length: people}, (_, i) => i + 1);
        
        // Fisher-Yates洗牌算法[6](@ref)
        const shuffle = (arr: number[]): number[] => {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        };

        // 模式一：全随机排列+前插0
        const mode1 = (): number[] => {
            const shuffled = shuffle([...baseArray]);
            return shuffled.flatMap(num => [0, num]);
        };

        // 模式二：纯随机排列
        const mode2 = (): number[] => shuffle([...baseArray]);

        // 模式三：随机选择2-4人+随机插0
        const mode3 = (): number[] => {
            const count = Math.min(people, Math.floor(Math.random() * 3) + 2);
            const selected = shuffle([...baseArray]).slice(0, count);
            return selected.flatMap(num => 
                Math.random() > 0.5 ? [0, num] : [num]
            );
        };

        // 生成轮次
        for (let i = 0; i < rounds; i++) {
            if (i === 0) {
                result.push(mode1());
            } else {
                const randomMode = (Math.floor(Math.random() * 3) + 1) as RoundMode;
                switch(randomMode) {
                    case 1: result.push(mode1()); break;
                    case 2: result.push(mode2()); break;
                    case 3: result.push(mode3()); break;
                }
            }
        }
        
        return result;
    }

    return {
      chatMessages,
      messages,
      newMessage,
      sendMessage,
      stopBattle,
      scrollToBottom,
      getAvatarSrc,
      getAvatar,
      getBubble,
      currentMessage,
      thinking,
      thinkingSender,
      thinkingDots
    };
  }
});
</script>

<style scoped>
.chat-container {
  max-width: 800px;
  margin: 0 auto;
  background-color: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
}
.chat-messages {
  height: 1000px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 20px;
}
.message-container {
  margin-bottom: 20px;
}
.ai-message-wrapper {
  display: flex;
  align-items: flex-start;
}
.user-message-wrapper {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
}
.sender-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 10px;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-bottom: 5px;
}
.user-avatar {
  background-color: #e6f7ff;
}
.ai1-avatar {
  background-color: #f6ffed;
}
.ai2-avatar {
  background-color: #fff7e6;
}
.sender-name {
  font-weight: bold;
  font-size: 12px;
}
.message-bubble {
  max-width: 70%;
  padding: 10px;
  border-radius: 5px;
  word-break: break-word;
}
.user-bubble {
  background-color: #f0f0f0;
  border-left: 3px solid #666;
}
.ai0-bubble {
  background-color: #edf7ff;
  border-left: 3px solid #1890ff;
}
.ai1-bubble {
  background-color: #f6ffed;
  border-left: 3px solid #52c41a;
}
.ai2-bubble {
  background-color: #eaf3ff;
  border-left: 3px solid #2A5699;
}
.ai3-bubble {
  background-color: #f1ffed;
  border-left: 3px solid #44B549;
}
.ai4-bubble {
  background-color: #ffd7d7;
  border-left: 3px solid #FF6B6B;
}
.ai5-bubble {
  background-color: #fffbe3;
  border-left: 3px solid #FFF3B0;
}
.ai6-bubble {
  background-color: #ffeee6;
  border-left: 3px solid #F3D7CA;
}
.ai7-bubble {
  background-color: #f6ffed;
  border-left: 3px solid #51c26a;
}
.system-message {
  text-align: center;
  color: #666;
  /* background-color: #f5f5f5; */
  padding: 5px 0px 5px 0px;
  border-radius: 5px;
  margin: 10px 0;
  width: 100%;
}
.system-message-span {
  text-align: center;
  color: #666;
  background-color: #f5f5f5;
  padding: 5px 10px 5px 10px;
  border-radius: 5px;
  width: 100%;
}
.thinking-bubble {
  max-width: 70%;
  padding: 10px;
  border-radius: 5px;
  background-color: #f5f5f5;
  color: #666;
  word-break: break-word;
}
.think {
  background-color: #f5f5f5;
  border: 1px dashed #d9d9d9;
  padding: 10px;
  margin: 10px 0;
  font-style: italic;
  color: #666;
}
.input-area {
  display: flex;
}
.input-area input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px 0 0 5px;
}
/* .input-area button {
  padding: 10px 20px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 0 5px 5px 0;
  cursor: pointer;
}
.input-area button:hover {
  background-color: #40a9ff;
} */
.btn-primary {
  padding: 10px 20px;
  background-color: #1890ff;
  color: white;
  border: none;
  /* border-radius: 0 5px 5px 0; */
  cursor: pointer;
}
.btn-primary:hover {
  background-color: #40a9ff;
}
.btn-danger {
  padding: 10px 20px;
  background-color: #ff1244;
  color: white;
  border: none;
  border-radius: 0 5px 5px 0;
  cursor: pointer;
}
.btn-danger:hover {
  background-color: #ff4444;
}
</style>