import axios from 'taro-axios'
import { constants } from '../../constant'
import { dbBridge } from '../../bridge'
import { Intent, Prompt } from './prompt'
import { delay, purify } from 'src/utils'

export enum XiangshengEventType {
  CHAT_REQUEST = 'ChatRequest',
  CHAT_RESPONSE = 'ChatResponse',

  ERROR = 'Error'
}

export interface HistoryMessage {
  participatorId: number
  message: string
}

export interface ChatRequestPayload {
  topic: string
  historyMessages?: HistoryMessage[]
  xiangshengUid: string
  participatorId: number
  modelId: number
  role: string
  partner: string
  mySelf: string
}

export interface ChatResponsePayload {
  xiangshengUid: string
  participatorId: number
  text: string
  audio: string
}

export interface XiangshengEvent {
  type: XiangshengEventType
  payload: ChatRequestPayload | ChatResponsePayload
}

export type ErrorResponsePayload = {
  error: string
  type: XiangshengEventType
  payload: ChatRequestPayload
}

export class XiangshengRunner {
  static saveMessage = async (
    topic: string,
    message: string,
    modelId: number
  ) => {
    dbBridge.XiangshengMessage.create(topic, modelId, message)
  }

  static speakerVoice = async (simulatorId: number) => {
    const simulator = dbBridge._Simulator.simulator(simulatorId)
    if (!simulator) return

    return simulator.audio_id
  }

  static prompt = (
    topic: string,
    simulatorId: number,
    historyMessages?: HistoryMessage[],
    role?: string,
    partner?: string,
    mySelf?: string
  ) => {
    const simulator = dbBridge._Simulator.simulator(simulatorId)
    if (!simulator) return

    return Prompt.prompt(
      Intent.CHAT,
      topic,
      (historyMessages || []).map((el) => el.message),
      role as string,
      partner as string,
      mySelf as string
    )
  }

  static requestChat = async (
    topic: string,
    participatorId: number,
    historyMessages?: HistoryMessage[],
    modelId?: number,
    role?: string,
    partner?: string,
    mySelf?: string
  ) => {
    const model = dbBridge._Model.model(modelId as number)
    if (!model) return
    const participator = dbBridge._Participator.participator(participatorId)
    if (!participator) return

    const _prompt = XiangshengRunner.prompt(
      topic,
      participator.simulatorId,
      historyMessages,
      role,
      partner,
      mySelf
    )

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

    if (!(textResp.data as Record<string, string>).content) {
      return {
        text: (textResp.data as Record<string, string>).content,
        audio: ''
      }
    }

    try {
      const speechContent = purify.purifyBracket(
        purify.purifyText((textResp.data as Record<string, string>).content)
      )
      const voice = await XiangshengRunner.speakerVoice(
        participator.simulatorId
      )
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

  static handleChatRequest = async (
    payload: ChatRequestPayload
  ): Promise<ChatResponsePayload | undefined> => {
    const {
      topic,
      historyMessages,
      xiangshengUid,
      participatorId,
      modelId,
      role,
      partner,
      mySelf
    } = payload

    const response = await XiangshengRunner.requestChat(
      topic,
      participatorId,
      historyMessages,
      modelId,
      role,
      partner,
      mySelf
    )
    if (!response || !response.text) return

    await XiangshengRunner.saveMessage(topic, response.text, modelId)

    return {
      ...response,
      xiangshengUid,
      participatorId
    }
  }
}
