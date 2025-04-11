import axios from 'axios';

const CHAT_API_BASE_URL = 'http://172.16.30.61:8091';
const AUDIO_API_BASE_URL = 'http://172.16.30.61:8000';

export default {
  async getAIResponse(aiName: string, messages: any[]): Promise<any> {
    try {
      const response = await axios.post(`${CHAT_API_BASE_URL}/api/get-response`, {
        ai: aiName,
        messages: messages
      });
      return response.data;
    } catch (error) {
      console.error('Error getting AI response:', error);
      return { content: '抱歉，获取回复时出错。' };
    }
  },
  async getKokoroAIAudio(content: string, speaker: string, speed: number): Promise<any> {
    try {
      const response = await axios.post(`${AUDIO_API_BASE_URL}/generate`, {
        text: content,
        speaker_id: speaker,
        speed: speed
      });
      return response.data;
    } catch (error) {
      console.error('Error getting AI response:', error);
      return { content: '抱歉，获取回复时出错。' };
    }
  }
};