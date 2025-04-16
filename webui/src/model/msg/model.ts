// 角色信息
export interface Participant {
  id: string;
  name: string;
  tag: string;
  speeker: string;
  avatar: string;
  personality: string;
  isHost: boolean;
}

// 讨论轮次控制
export interface DiscussionRound {
  topic: string;
  subtopics: string[];
  currentSubtopicIndex: number;
  participantsOrder: string[];
}

// 前端展示内容的msg
export interface Message {
  participantId: string;
  content: string;
  isThinking: boolean;
  isSpeaking: boolean;
}

// 发送给后端接口的msg
export interface SendMessage {
  role: string;
  content: string;
}
