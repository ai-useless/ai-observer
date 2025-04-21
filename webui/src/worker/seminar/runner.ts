import axios from 'axios'
import { constants } from 'src/constant'
import { dbBridge } from 'src/bridge'
import { Intent, Prompt } from './prompt'
import { dbModel } from 'src/model'

export enum SeminarEventType {
  CHAT_REQUEST = 'ChatRequest',
  CHAT_RESPONSE = 'ChatResponse',

  ERROR = 'Error'
}

export interface BasePrompts {
  archetype?: string
  historyMessages?: string[]
  generateAudio?: boolean
}

export interface OutlinePrompts extends BasePrompts {
  rounds: number
}

export interface StartTopicPrompts extends BasePrompts {
  guests: string[]
  topicMaterial: string
}

export interface StartSubTopicPrompts extends BasePrompts {
  topicMaterial: string
}

export interface ConcludeSubTopicPrompts extends BasePrompts {
  topicMaterial: string
  historyMessages: string[]
}

export interface ConcludeTopicPrompts extends BasePrompts {
  topicMaterial: string
  historyMessages: string[]
}

export interface DiscussPrompts extends BasePrompts {
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
  subTopic: string
  participatorId: number
  intent: Intent
  round: number
  subRound: number
  prompts: Prompts
}

export type ChatResponsePayload = {
  seminarId: number
  participatorId: number
  subTopic: string
  intent: Intent
  round: number
  subRound: number
  payload: {
    json: Record<string, unknown>
    text: string
    audio: string
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
    audio: string
  ) => {
    await dbBridge._Message.create(
      seminarId,
      participatorId,
      prompt,
      content,
      audio
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
    subTopic: string,
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
          100,
          _prompts.guests,
          _prompts.archetype as string
        )
      }
      case Intent.START_FIRST_SUBTOPIC: {
        const _prompts = prompts as StartSubTopicPrompts
        return Prompt.prompt(
          intent,
          topic,
          simulator.personality,
          _prompts.topicMaterial,
          subTopic,
          100,
          _prompts.archetype as string
        )
      }
      case Intent.START_SUBTOPIC: {
        const _prompts = prompts as StartSubTopicPrompts
        return Prompt.prompt(
          intent,
          topic,
          simulator.personality,
          _prompts.topicMaterial,
          subTopic,
          100,
          _prompts.archetype as string
        )
      }
      case Intent.CONCLUDE_SUBTOPIC: {
        const _prompts = prompts as ConcludeSubTopicPrompts
        return Prompt.prompt(
          intent,
          topic,
          simulator.personality,
          _prompts.topicMaterial,
          subTopic,
          100,
          _prompts.historyMessages,
          _prompts.archetype as string
        )
      }
      case Intent.CONCLUDE: {
        const _prompts = prompts as ConcludeTopicPrompts
        return Prompt.prompt(
          intent,
          simulator.personality,
          _prompts.topicMaterial,
          100,
          _prompts.historyMessages,
          _prompts.archetype as string
        )
      }
      case Intent.DISCUSS: {
        const _prompts = prompts as DiscussPrompts
        return Prompt.prompt(
          intent,
          topic,
          subTopic,
          simulator.personality,
          _prompts.hostMessage,
          100,
          _prompts.historyMessages,
          _prompts.archetype as string
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
    subTopic: string,
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
      subTopic,
      participatorId,
      intent,
      prompts
    )

    const textResp = await axios.post(
      /* model.endpoint || */ constants.FALLBACK_API,
      {
        ai: model.name,
        messages: [...(prompts.historyMessages || []), prompt].map((el) => {
          return {
            role: 'user',
            content: el
          }
        })
      }
    )

    const generateAudio = await dbBridge._Setting.get(
      dbModel.SettingKey.GENERATE_AUDIO
    )
    if (!prompts.generateAudio || !generateAudio) {
      return {
        text: (textResp.data as Record<string, string>).content,
        audio: ''
      }
    }

    try {
      const speechContent = (textResp.data as Record<string, string>).content
      const speakerVoice = await SeminarRunner.speakerVoice(participatorId)
      const audioResp = await axios.post(
        /* model.endpoint || */ constants.TEXT2SPEECH_API,
        {
          text: speechContent,
          speakerVoice,
          speed: 1.1
        }
      )
      return {
        text: (textResp.data as Record<string, string>).content,
        audio: (audioResp.data as Record<string, string>).data
      }
    } catch {
      return {
        text: (textResp.data as Record<string, string>).content,
        audio: ''
      }
    }
  }

  static postProcess = async (
    topic: string,
    subTopic: string,
    participatorId: number,
    intent: Intent,
    response: string
  ) => {
    if (intent !== Intent.OUTLINE) return

    const _response = await SeminarRunner.requestParticipatorChat(
      topic,
      subTopic,
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
    const {
      seminarId,
      participatorId,
      intent,
      prompts,
      subTopic,
      round,
      subRound
    } = payload

    const seminar = await dbBridge._Seminar.seminar(undefined, seminarId)
    if (!seminar) return

    try {
      const response = await SeminarRunner.requestParticipatorChat(
        seminar?.topic,
        subTopic,
        participatorId,
        intent,
        prompts
      )
      if (!response) return

      const json = await SeminarRunner.postProcess(
        seminar?.topic,
        subTopic,
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
        response.audio
      )

      self.postMessage({
        type: SeminarEventType.CHAT_RESPONSE,
        payload: {
          seminarId,
          subTopic,
          intent,
          participatorId,
          round,
          subRound,
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
