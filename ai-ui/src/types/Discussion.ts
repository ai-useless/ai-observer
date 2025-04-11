export interface Participant {
  id: string;
  name: string;
  tag: string;
  speeker: string;
  avatar: string;
  personality: string;
  isHost: boolean;
}

export interface DiscussionRound {
  topic: string;
  subtopics: string[];
  currentSubtopicIndex: number;
  participantsOrder: string[];
}

export interface Message {
  participantId: string;
  content: string;
  isThinking: boolean;
  isSpeaking: boolean;
}

export interface SendMessage {
  role: string;
  content: string;
}
