import { Message, SendMessage } from '../types/Discussion';
import api from '../api/api';

export class AIService {
  static async generateSummary(messages: Message[], sendMessages: SendMessage[]): Promise<string> {
    const summary = `今天的讨论围绕"${messages[0]?.content || "未定义主题"}"展开，各位嘉宾发表了观点, 请你作为一个专业的主持人，对以上观点进行一个总结陈词，并在结尾给出开放式的结束语，要求：要求：1) 只把发言内容输出出来,不能有表情和其他提示性文字 2)发言时间≤120秒，小于300字 3) 发言内容符合自己的人设`
    sendMessages.push({
      role: 'user',
      content: summary
    });
    const hostResponse = await api.getAIResponse('AI0', sendMessages);
    return new Promise(() => {
      return hostResponse.content
    })
  }
}