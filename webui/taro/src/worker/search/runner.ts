import axios from 'taro-axios'
import { constants } from '../../constant'
import { dbBridge } from '../../bridge'
import { Intent, Prompt } from './prompt'
import { dbModel } from '../../model'
import { delay, purify } from 'src/utils'

export enum SearchEventType {
  SEARCH_REQUEST = 'SearchRequest',
  SEARCH_RESPONSE = 'SearchResponse',

  ERROR = 'Error'
}

export interface SearchRequestPayload {
  topic: string
  historyMessages?: string[]
  generateAudio?: boolean
  prompt?: string
  simulatorId: number
  modelId: number
}

export interface SearchResponsePayload {
  topic: string
  prompt: string
  modelId: number
  text: string
  audio: string
}

export interface SearchEvent {
  type: SearchEventType
  payload:
    | SearchRequestPayload
    | SearchResponsePayload
}

export type ErrorResponsePayload = {
  error: string
  type: SearchEventType
  payload: SearchRequestPayload
}

export class SearchRunner {
  static saveMessage = async (
    topic: string,
    prompt: string,
    message: string,
    modelId: number
  ) => {
    dbBridge.SearchResult.create(
      topic,
      prompt,
      modelId,
      message
    )
  }

  static speakerVoice = async (simulatorId: number) => {
    const simulator = dbBridge._Simulator.simulator(simulatorId)
    if (!simulator) return

    return simulator.audio_id
  }

  static prompt = (
    topic: string,
    simulatorId: number,
    historyMessages?: string[],
    prompt?: string
  ) => {
    const simulator = dbBridge._Simulator.simulator(simulatorId)
    if (!simulator) return

    return Prompt.prompt(
      Intent.SEARCH,
      topic,
      historyMessages || [],
      prompt || ''
    )
  }

  static requestSearch = async (
    topic: string,
    simulatorId: number,
    historyMessages?: string[],
    prompt?: string,
    generateAudio?: boolean,
    modelId?: number
  ) => {
    const model = dbBridge._Model.model(modelId as number)
    if (!model) return

    const _prompt = SearchRunner.prompt(
      topic,
      simulatorId,
      historyMessages,
      prompt
    )

    const textResp = await axios.post(constants.FALLBACK_API, {
      model: model.name,
      messages: (historyMessages || []).map((el) => {
        return {
          role: 'user',
          content: purify.purifyText(el)
        }
      }),
      prompt: purify.purifyText(_prompt || '')
    })

    const _generateAudio = await dbBridge._Setting.get(
      dbModel.SettingKey.GENERATE_AUDIO
    ) as boolean
    if (
      (generateAudio !== undefined && !generateAudio) ||
      (_generateAudio !== undefined && !_generateAudio) ||
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
      const voice = await SearchRunner.speakerVoice(simulatorId)
      const audioResp = await axios.post(constants.TEXT2SPEECH_ASYNC_V2_API, {
        text: speechContent,
        voice
      })

      let audioUrl = undefined as unknown as string

      while (true) {
        const queryResp = await axios.get(`${constants.QUERY_AUDIO_API}/${(audioResp.data as Record<string, string>).audio_uid}`)
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

  static handleSearchRequest = async (
    payload: SearchRequestPayload
  ): Promise<SearchResponsePayload | undefined> => {
    const {
      topic,
      historyMessages,
      generateAudio,
      prompt,
      simulatorId,
      modelId,
    } = payload

    const response = await SearchRunner.requestSearch(
      topic,
      simulatorId,
      historyMessages,
      prompt,
      generateAudio,
      modelId
    )
    if (!response || !response.text) return

    await SearchRunner.saveMessage(
      topic,
      prompt || topic,
      response.text,
      modelId
    )

    return {
      ...response,
      topic,
      prompt: prompt || topic,
      modelId
    }
  }
}
