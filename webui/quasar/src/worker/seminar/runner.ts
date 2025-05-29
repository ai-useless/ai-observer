import axios from 'axios'
import { constants } from 'src/constant'
import { dbBridge } from 'src/bridge'
import { Intent, Prompt } from './prompt'
import { dbModel } from 'src/model'
import { delay, purify } from 'src/utils'

export enum SeminarEventType {
  CHAT_REQUEST = 'ChatRequest',
  CHAT_RESPONSE = 'ChatResponse',

  GENERATE_TOPICS = 'GenerateTopics',
  GENERATED_TOPICS = 'GeneratedTopics',

  ERROR = 'Error'
}

export interface HistoryMessage {
  content: string
  participatorId: number
}

export interface BasePrompts {
  archetype?: string
  historyMessages?: HistoryMessage[]
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
}

export interface ConcludeTopicPrompts extends BasePrompts {
  topicMaterial: string
}

export interface HostChallengePrompts extends BasePrompts {
  topicMaterial: string
}

export interface DiscussPrompts extends BasePrompts {
  hostMessage: string
}

export interface OutlineSubTopicsPrompts extends BasePrompts {
  topicMaterial: string
}

export interface GenerateTopicsPrompts extends BasePrompts {
  model: string
  topicType: string
  count: number
}

export type Prompts =
  | OutlinePrompts
  | DiscussPrompts
  | StartTopicPrompts
  | StartSubTopicPrompts
  | ConcludeSubTopicPrompts
  | ConcludeTopicPrompts
  | HostChallengePrompts

export interface ChatRequestPayload {
  seminarId: number
  subTopic: string
  participatorId: number
  intent: Intent
  round: number
  subRound: number
  index: number
  prompts: Prompts
}

export interface ChatResponsePayload {
  seminarId: number
  participatorId: number
  subTopic: string
  intent: Intent
  round: number
  subRound: number
  index: number
  payload: {
    json: Record<string, unknown> | undefined
    text: string
    audio: string
  }
}

export interface GenerateTopicsPayload {
  prompts: GenerateTopicsPrompts
}

export interface GeneratedTopicsPayload {
  topics: string[]
}

export interface SeminarEvent {
  type: SeminarEventType
  payload:
    | ChatRequestPayload
    | ChatResponsePayload
    | GenerateTopicsPayload
    | GeneratedTopicsPayload
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

  static simulator = async (participatorId: number) => {
    const participator =
      await dbBridge._Participator.participator(participatorId)
    if (!participator) return
    const simulator = await dbBridge._Simulator.simulator(
      participator.simulatorId
    )
    if (!simulator) return

    return simulator
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
      participator.simulatorId
    )
    if (!simulator) return

    switch (intent) {
      case Intent.OUTLINE: {
        const _prompts = prompts as OutlinePrompts
        return Prompt.prompt(
          intent,
          topic,
          _prompts.rounds,
          _prompts.archetype as string
        )
      }
      case Intent.START_TOPIC: {
        const _prompts = prompts as StartTopicPrompts
        return Prompt.prompt(
          intent,
          simulator.origin_personality,
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
          simulator.origin_personality,
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
          simulator.origin_personality,
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
          simulator.origin_personality,
          _prompts.topicMaterial,
          subTopic,
          100,
          (_prompts.historyMessages || []).map((el) => el.content),
          _prompts.archetype as string
        )
      }
      case Intent.CONCLUDE: {
        const _prompts = prompts as ConcludeTopicPrompts
        return Prompt.prompt(
          intent,
          simulator.origin_personality,
          _prompts.topicMaterial,
          100,
          (_prompts.historyMessages || []).map((el) => el.content),
          _prompts.archetype as string
        )
      }
      case Intent.DISCUSS: {
        const _prompts = prompts as DiscussPrompts
        return Prompt.prompt(
          intent,
          topic,
          subTopic,
          simulator.origin_personality,
          _prompts.hostMessage,
          100,
          (_prompts.historyMessages || []).map((el) => el.content),
          _prompts.archetype as string
        )
      }
      case Intent.OUTLINE_SUBTOPICS: {
        const _prompts = prompts as OutlineSubTopicsPrompts
        return Prompt.prompt(intent, _prompts.topicMaterial)
      }
      case Intent.HOST_CHALLENGE: {
        const _prompts = prompts as HostChallengePrompts
        return Prompt.prompt(
          intent,
          simulator.origin_personality,
          _prompts.topicMaterial,
          subTopic,
          100,
          (_prompts.historyMessages || []).map((el) => el.content),
          _prompts.archetype as string
        )
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

    const textResp = await axios.post(constants.FALLBACK_API, {
      model: model.name,
      messages: (prompts.historyMessages || []).map((el) => {
        return {
          role: el.participatorId === participatorId ? 'assistant' : 'user',
          content: purify.purifyText(el.content)
        }
      }),
      prompt: purify.purifyText(prompt || '')
    })

    const generateAudio = await dbBridge._Setting.get(
      dbModel.SettingKey.GENERATE_AUDIO
    )
    if (
      !prompts.generateAudio ||
      !generateAudio ||
      !(textResp.data as Record<string, string>).content
    ) {
      return {
        text: (textResp.data as Record<string, string>).content,
        audio: ''
      }
    }

    try {
      const speechContent = purify.purifyText(
        (textResp.data as Record<string, string>).content
      )
      const simulator = await SeminarRunner.simulator(participatorId)
      const audioResp = await axios.post(constants.TEXT2SPEECH_ASYNC_V3_API, {
        text: speechContent,
        voice: simulator?.audio_id,
        instruct: simulator?.language ? `用${simulator.language}说` : ''
      })

      let audioUrl = undefined as unknown as string

      while (true) {
        const queryResp = await axios.get(
          `${constants.QUERY_AUDIO_API}/${(audioResp.data as Record<string, string>).audio_uid}`
        )
        const resp = queryResp.data as Record<string, string>
        if (!resp.settled && !resp.error) {
          await delay.delay(10000)
          continue
        }
        audioUrl = resp.audio_url
        break
      }

      return {
        text: (textResp.data as Record<string, string>).content,
        audio: audioUrl
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
    if (intent === Intent.GENERATE_TOPICS)
      return Prompt.postProcess(intent, purify.purifyText(response))
    if (intent !== Intent.OUTLINE) return

    const _response = await SeminarRunner.requestParticipatorChat(
      topic,
      subTopic,
      participatorId,
      Intent.OUTLINE_SUBTOPICS,
      {
        topicMaterial: purify.purifyText(response)
      }
    )
    if (!_response) return
    return Prompt.postProcess(intent, purify.purifyText(_response.text))
  }

  static handleChatRequest = async (
    payload: ChatRequestPayload
  ): Promise<ChatResponsePayload | undefined> => {
    const {
      seminarId,
      participatorId,
      intent,
      prompts,
      subTopic,
      round,
      subRound,
      index
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
      console.log(intent, 'SUCCESS')
      if (!response || !response.text) return

      const json = await SeminarRunner.postProcess(
        seminar?.topic,
        subTopic,
        participatorId,
        intent,
        response.text
      )
      if (json) json.topic = seminar.topic

      let promptMessage = seminar.topic
      if (prompts.historyMessages && prompts.historyMessages.length) {
        promptMessage =
          prompts.historyMessages[prompts.historyMessages.length - 1].content
      }

      await SeminarRunner.saveMessage(
        seminarId,
        participatorId,
        promptMessage,
        response.text,
        response.audio
      )

      const payload = {
        seminarId,
        subTopic,
        intent,
        participatorId,
        round,
        subRound,
        index,
        payload: {
          ...response,
          json
        }
      }

      self.postMessage({
        type: SeminarEventType.CHAT_RESPONSE,
        payload
      })
      return payload
    } catch (e) {
      console.log(intent, 'FAIL')

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

  static handleGenerateTopics = async (
    payload: GenerateTopicsPayload
  ): Promise<GeneratedTopicsPayload | undefined> => {
    const { prompts } = payload
    const { model, topicType, count, historyMessages } = prompts
    const prompt = Prompt.prompt(
      Intent.GENERATE_TOPICS,
      topicType,
      count,
      (historyMessages || []).map((el) => el.content)
    )
    try {
      const resp = await axios.post(constants.FALLBACK_API, {
        model,
        messages: [],
        prompt: purify.purifyText(prompt || '')
      })
      const json = Prompt.postProcess(
        Intent.GENERATE_TOPICS,
        purify.purifyText((resp.data as Record<string, string>).content)
      )
      if (!json) return

      const payload = {
        topics: json.titles as string[]
      }

      self.postMessage({
        type: SeminarEventType.GENERATED_TOPICS,
        payload
      })

      return payload
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
