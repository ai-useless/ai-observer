import axios from 'axios'
import { constants } from 'src/constant'
import { dbBridge } from 'src/bridge'
import { Intent, Prompt } from './prompt'

export enum SeminarEventType {
  CHAT_REQUEST = 'ChatRequest',
  CHAT_RESPONSE = 'ChatResponse',

  ERROR = 'Error'
}

export interface BasePrompts {
  historyMessages?: string[]
  generateAudio?: boolean
}

export interface OutlinePrompts extends BasePrompts {
  rounds: number
}

export interface StartTopicPrompts extends BasePrompts {
  topicMaterial: string
}

export interface StartSubTopicPrompts extends BasePrompts {
  topicMaterial: string
  subTopic: string
}

export interface ConcludeSubTopicPrompts extends BasePrompts {
  subTopic: string
  historyMessages: string[]
}

export interface ConcludeTopicPrompts extends BasePrompts {
  topicMaterial: string
  historyMessages: string[]
}

export interface DiscussPrompts extends BasePrompts {
  subTopic: string
  hostMessage: string
  historyMessages: string[]
}

export interface OutlineSubTopicsPrompts extends BasePrompts {
  topicMaterial: string
}

export type Prompts =
  | OutlinePrompts
  | DiscussPrompts
  | StartTopicPrompts
  | StartSubTopicPrompts
  | ConcludeSubTopicPrompts
  | ConcludeTopicPrompts

export interface ChatRequestPayload {
  seminarId: number
  participatorId: number
  intent: Intent
  prompts: Prompts
}

export type ChatResponsePayload = {
  seminarId: number
  participatorId: number
  payload: {
    json: Record<string, unknown>
    text: string
    audio: string
    duration: number
  }
}

export interface SeminarEvent {
  type: SeminarEventType
  payload: ChatRequestPayload | ChatResponsePayload
}

export type ErrorResponsePayload = {
  error: string
  type: SeminarEventType
  payload: ChatRequestPayload
}

export class SeminarRunner {
  static saveMessage = async (
    seminarId: number,
    participatorId: number,
    prompt: string,
    content: string,
    audio: string,
    duration: number
  ) => {
    await dbBridge._Message.create(
      seminarId,
      participatorId,
      prompt,
      content,
      audio,
      duration
    )
  }

  static speakerVoice = async (participatorId: number) => {
    const participator =
      await dbBridge._Participator.participator(participatorId)
    if (!participator) return
    const simulator = await dbBridge._Simulator.simulator(
      participator?.simulatorId
    )
    if (!simulator) return

    return simulator.speakerVoice
  }

  static prompt = async (
    topic: string,
    participatorId: number,
    intent: Intent,
    prompts: Prompts
  ) => {
    const participator =
      await dbBridge._Participator.participator(participatorId)
    if (!participator) return
    const simulator = await dbBridge._Simulator.simulator(
      participator?.simulatorId
    )
    if (!simulator) return

    switch (intent) {
      case Intent.OUTLINE: {
        const _prompts = prompts as OutlinePrompts
        return Prompt.prompt(intent, topic, _prompts.rounds)
      }
      case Intent.START_TOPIC: {
        const _prompts = prompts as StartTopicPrompts
        return Prompt.prompt(
          intent,
          simulator.personality,
          _prompts.topicMaterial,
          100
        )
      }
      case Intent.START_FIRST_SUBTOPIC: {
        const _prompts = prompts as StartSubTopicPrompts
        return Prompt.prompt(
          intent,
          topic,
          simulator.personality,
          _prompts.topicMaterial,
          _prompts.subTopic,
          100
        )
      }
      case Intent.START_SUBTOPIC: {
        const _prompts = prompts as StartSubTopicPrompts
        return Prompt.prompt(
          intent,
          topic,
          simulator.personality,
          _prompts.topicMaterial,
          _prompts.subTopic,
          100
        )
      }
      case Intent.CONCLUDE_SUBTOPIC: {
        const _prompts = prompts as ConcludeSubTopicPrompts
        return Prompt.prompt(
          intent,
          topic,
          simulator.personality,
          _prompts.subTopic,
          100,
          _prompts.historyMessages
        )
      }
      case Intent.CONCLUDE: {
        const _prompts = prompts as ConcludeTopicPrompts
        return Prompt.prompt(
          intent,
          topic,
          simulator.personality,
          _prompts.topicMaterial,
          100,
          _prompts.historyMessages
        )
      }
      case Intent.DISCUSS: {
        const _prompts = prompts as DiscussPrompts
        return Prompt.prompt(
          intent,
          topic,
          _prompts.subTopic,
          simulator.personality,
          _prompts.hostMessage,
          100,
          _prompts.historyMessages
        )
      }
      case Intent.OUTLINE_SUBTOPICS: {
        const _prompts = prompts as OutlineSubTopicsPrompts
        return Prompt.prompt(intent, _prompts.topicMaterial)
      }
    }
  }

  static requestParticipatorChat = async (
    topic: string,
    participatorId: number,
    intent: Intent,
    prompts: Prompts
  ) => {
    const participator =
      await dbBridge._Participator.participator(participatorId)
    if (!participator) return

    const model = await dbBridge._Model.model(participator.modelId)
    if (!model) return

    const prompt = await SeminarRunner.prompt(
      topic,
      participatorId,
      intent,
      prompts
    )

    const textResp = await axios.post(
      /* model.endpoint || */ constants.FALLBACK_API,
      {
        ai: model.name,
        messages: [prompt, ...(prompts.historyMessages || [])].map((el) => {
          return {
            role: 'user',
            content: el
          }
        })
      }
    )

    if (!prompts.generateAudio) {
      return {
        text: (textResp.data as Record<string, string>).content,
        audio: '',
        duration: 0
      }
    }

    try {
      const speechContent = (textResp.data as Record<string, string>).content
      const speakerVoice = await SeminarRunner.speakerVoice(participatorId)
      const audioResp = await axios.post(
        /* model.endpoint || */ constants.AUDIO_API,
        {
          text: speechContent,
          speakerVoice,
          speed: 1.1
        }
      )
      return {
        text: (textResp.data as Record<string, string>).content,
        audio: (audioResp.data as Record<string, string>).data,
        duration: (audioResp.data as Record<string, number>).duration
      }
    } catch {
      return {
        text: (textResp.data as Record<string, string>).content,
        audio: '',
        duration: 0
      }
    }
  }

  static postProcess = async (
    topic: string,
    participatorId: number,
    intent: Intent,
    response: string
  ) => {
    if (intent !== Intent.OUTLINE) return

    const _response = await SeminarRunner.requestParticipatorChat(
      topic,
      participatorId,
      Intent.OUTLINE_SUBTOPICS,
      {
        topicMaterial: response
      }
    )
    if (!_response) return
    return Prompt.postProcess(intent, _response.text)
  }

  static handleChatRequest = async (payload: ChatRequestPayload) => {
    const { seminarId, participatorId, intent, prompts } = payload

    const seminar = await dbBridge._Seminar.seminar(undefined, seminarId)
    if (!seminar) return

    try {
      const response = await SeminarRunner.requestParticipatorChat(
        seminar?.topic,
        participatorId,
        intent,
        prompts
      )
      if (!response) return

      const json = await SeminarRunner.postProcess(
        seminar?.topic,
        participatorId,
        intent,
        response.text
      )
      if (json) json.topic = seminar.topic

      await SeminarRunner.saveMessage(
        seminarId,
        participatorId,
        prompts.historyMessages?.[prompts.historyMessages.length - 1] ||
          seminar.topic,
        response.text,
        response.audio,
        response.duration
      )

      self.postMessage({
        type: SeminarEventType.CHAT_RESPONSE,
        payload: {
          seminarId,
          participatorId,
          payload: {
            ...response,
            json
          }
        }
      })
    } catch (e) {
      self.postMessage({
        type: SeminarEventType.ERROR,
        payload: {
          error: JSON.stringify(e),
          type: SeminarEventType.CHAT_REQUEST,
          payload
        }
      })
    }
  }
}
