import axios from 'axios'
import { constants } from 'src/constant'
import { dbBridge } from 'src/bridge'
import { Intent, Prompt } from './prompt'

export enum SeminarEventType {
  CHAT_REQUEST = 'ChatRequest',
  CHAT_RESPONSE = 'ChatResponse',

  Error = 'Error'
}

export interface BasePrompts {
  historyMessages?: string[]
}

export interface OutlinePrompts extends BasePrompts {
  rounds: number
}

export interface DiscussPrompts extends BasePrompts {
  subTopic: string
  hostMessage: string
}

export interface ChatRequestPayload {
  seminarId: number
  participatorId: number
  intent: Intent
  prompts: OutlinePrompts | DiscussPrompts
}

export type ChatResponsePayload = {
  seminarId: number
  participatorId: number
  payload: string
}

export interface SeminarEvent {
  type: SeminarEventType
  payload:
    | ChatRequestPayload
    | ChatResponsePayload
}

export class SeminarRunner {
  static bulkStoreResponse = async (
    seminarId: number,
    participatorId: number,
    prompt: string,
    response: string
  ) => {
    await dbBridge._Message.create(
      seminarId,
      participatorId,
      prompt,
      response
    )
  }

  static prompt = async (topic: string, participatorId: number, intent: Intent, prompts: OutlinePrompts | DiscussPrompts) => {
    switch (intent) {
      case Intent.OUTLINE:
      {
        const _prompts = prompts as OutlinePrompts
        return Prompt.prompt(intent, topic, _prompts.rounds)
      }
      case Intent.DISCUSS:
      {
        const _prompts = prompts as DiscussPrompts
        const participator = await dbBridge._Participator.participator(participatorId)
        if (!participator) return
        const simulator = await dbBridge._Simulator.simulator(participator?.simulatorId)
        if (!simulator) return
        return Prompt.prompt(intent, topic, _prompts.subTopic, simulator.personality, _prompts.hostMessage, 100)
      }
    }
  }

  static requestParticipatorChat = async (topic: string, participatorId: number, intent: Intent, prompts: OutlinePrompts | DiscussPrompts) => {
    const participator = await dbBridge._Participator.participator(participatorId)
    if (!participator) return

    const model = await dbBridge._Model.model(participator.modelId)
    if (!model) return

    const prompt = await SeminarRunner.prompt(topic, participatorId, intent, prompts)

    const resp = await axios.post(/* model.endpoint || */ constants.FALLBACK_API, {
      ai: 'AI1',
      messages: [prompt, ...(prompts.historyMessages || [])].map((el) => {
        return {
          role: 'user',
          content: el
        }
      })
    })
    return (resp.data as Record<string, string>).content
  }

  static handleChatRequest = async (payload: ChatRequestPayload) => {
    const { seminarId, participatorId, intent, prompts } = payload

    const seminar = await dbBridge._Seminar.seminar(undefined, seminarId)
    if (!seminar) return

    try {
      const response = await SeminarRunner.requestParticipatorChat(seminar?.topic, participatorId, intent, prompts)
      if (!response) return

      await SeminarRunner.bulkStoreResponse(seminarId, participatorId, prompts.historyMessages?.[prompts.historyMessages.length - 1] || seminar.topic, response)

      self.postMessage({
        type: SeminarEventType.CHAT_RESPONSE,
        payload: {
          seminarId,
          participatorId,
          payload: response
        }
      })
    } catch (e) {
      self.postMessage({
        type: SeminarEventType.Error,
        payload: e
      })
    }
  }
}
