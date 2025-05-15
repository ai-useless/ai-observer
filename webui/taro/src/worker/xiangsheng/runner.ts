import axios from 'taro-axios'
import { constants } from '../../constant'
import { dbBridge } from '../../bridge'
import { Intent, Prompt } from './prompt'
import { delay, purify } from 'src/utils'

export enum XiangshengEventType {
  CLASSIC_TOPICS_REQUEST = 'ClassicTopicsRequest',
  CLASSIC_TOPICS_RESPONSE = 'ClassicTopicsResponse',

  TOPICS_REQUEST = 'TopicsRequest',
  TOPICS_RESPONSE = 'TopicsResponse',

  GENERATE_REQUEST = 'GenerateRequest',
  GENERATE_RESPONSE = 'GenerateResponse',

  SPEAK_REQUEST = 'SpeakRequest',
  SPEAK_RESPONSE = 'SpeakResponse',

  ERROR = 'Error'
}

export interface HistoryMessage {
  message: string
}

export interface ClassicTopicsRequestPayload {
  historyTopics: HistoryMessage[]
  modelId: number
}

export interface ClassicTopicsResponsePayload {
  topics: string[]
}

export interface TopicsRequestPayload {
  topic: string
  historySubTopics: HistoryMessage[]
  xiangshengUid: string
  modelId: number
}

export interface TopicsResponsePayload {
  topic: string
  topics: string[]
  xiangshengUid: string
}

export interface GenerateRequestPayload {
  topic: string
  subTopic: string
  subTopicIndex: number
  host: string
  guest: string
  xiangshengUid: string
  modelId: number
}

export interface GenerateResponsePayload {
  topic: string
  subTopic: string
  subTopicIndex: number
  xiangshengUid: string
  texts: string[]
}

export interface SpeakRequestPayload {
  participatorId: number
  text: string
}

export interface SpeakResponsePayload {
  audio: string
}

export interface XiangshengEvent {
  type: XiangshengEventType
  payload:
    | GenerateRequestPayload
    | GenerateResponsePayload
    | SpeakRequestPayload
    | SpeakResponsePayload
    | TopicsRequestPayload
    | TopicsResponsePayload
    | ClassicTopicsRequestPayload
    | ClassicTopicsResponsePayload
}

export type ErrorResponsePayload = {
  error: string
  type: XiangshengEventType
  payload: GenerateRequestPayload | SpeakRequestPayload | TopicsRequestPayload | ClassicTopicsRequestPayload
}

export class XiangshengRunner {
  static speakerVoice = async (simulatorId: number) => {
    const simulator = dbBridge._Simulator.simulator(simulatorId)
    if (!simulator) return

    return simulator.audio_id
  }

  static prompt = (
    intent: Intent,
    topic: string,
    host: string,
    guest: string,
    historyMessages?: HistoryMessage[]
  ) => {
    switch (intent) {
      case Intent.GENERATE:
        return Prompt.prompt(
          intent,
          topic,
          host,
          guest
        )
      case Intent.TOPICS:
        return Prompt.prompt(intent, topic, (historyMessages || []).map((el) => el.message))
      case Intent.CLASSIC_TOPICS:
        return Prompt.prompt(intent, (historyMessages || []).map((el) => el.message))
    }
  }

  static requestGenerate = async (
    intent: Intent,
    topic: string,
    host: string,
    guest: string,
    historyMessages?: HistoryMessage[],
    modelId?: number
  ) => {
    const model = dbBridge._Model.model(modelId as number)
    if (!model) return

    const _prompt = XiangshengRunner.prompt(intent, topic, host, guest, historyMessages)

    const textResp = await axios.post(constants.FALLBACK_API, {
      model: model.name,
      messages: (historyMessages || []).map((el) => {
        return {
          role: 'user',
          content: purify.purifyText(el.message)
        }
      }),
      prompt: purify.purifyText(_prompt || '')
    })

    if ((textResp.data as Record<string, string>).content) {
      return {
        texts: Prompt.postProcess(
          purify.purifyText((textResp.data as Record<string, string>).content)
        )
      }
    }
  }

  static handleGenerateRequest = async (
    payload: GenerateRequestPayload
  ): Promise<GenerateResponsePayload | undefined> => {
    const { topic, subTopic, host, guest, xiangshengUid, modelId, subTopicIndex } =
      payload

    const response = await XiangshengRunner.requestGenerate(
      Intent.GENERATE,
      subTopic,
      host,
      guest,
      [],
      modelId
    )
    if (!response || !response.texts || !response.texts.length) return

    return {
      ...response,
      topic,
      subTopic,
      subTopicIndex,
      xiangshengUid
    }
  }

  static handleTopicsRequest = async (
    payload: TopicsRequestPayload
  ): Promise<TopicsResponsePayload | undefined> => {
    const { topic, xiangshengUid, modelId, historySubTopics } =
      payload

    const response = await XiangshengRunner.requestGenerate(
      Intent.TOPICS,
      topic,
      undefined as unknown as string,
      undefined as unknown as string,
      historySubTopics,
      modelId
    )
    if (!response || !response.texts || !response.texts.length) return

    return {
      topic,
      topics: response.texts,
      xiangshengUid
    }
  }

  static handleClassicTopicsRequest = async (
    payload: ClassicTopicsRequestPayload
  ): Promise<ClassicTopicsResponsePayload | undefined> => {
    const { historyTopics, modelId } = payload

    const response = await XiangshengRunner.requestGenerate(
      Intent.CLASSIC_TOPICS,
      undefined as unknown as string,
      undefined as unknown as string,
      undefined as unknown as string,
      historyTopics,
      modelId
    )
    if (!response || !response.texts || !response.texts.length) return

    return {
      topics: response.texts
    }
  }

  static requestSpeak = async (participatorId: number, text: string) => {
    const participator = dbBridge._Participator.participator(participatorId)
    if (!participator) return
    const simulator = dbBridge._Simulator.simulator(participator.simulatorId)
    if (!simulator) return

    const speechContent = purify.purifyBracket(purify.purifyText(text))
    const voice = await XiangshengRunner.speakerVoice(participator.simulatorId)
    const audioResp = await axios.post(constants.TEXT2SPEECH_ASYNC_V2_API, {
      text: speechContent,
      voice
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
      audio: audioUrl
    }
  }

  static handleSpeakRequest = async (
    payload: SpeakRequestPayload
  ): Promise<SpeakResponsePayload | undefined> => {
    const { participatorId, text } = payload
    return await XiangshengRunner.requestSpeak(participatorId, text)
  }
}
