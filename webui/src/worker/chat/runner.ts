import { constants } from 'src/constant'
import axios from 'axios'
import { AIMessage, MsgData, SendMessage, SessionMsg } from 'src/localstore/chat/types'
import { dbBridge } from 'src/bridge'
import { getCurrentFormattedDate } from 'src/utils/timestamp'
import { ChatSession } from 'src/bridge/db'

export enum ChatEventType {
  FETCH_POINTS = 'FetchPoints',
  FETCHED_POINTS = 'FetchedPoints',

  LOAD_POINTS = 'LoadPoints',
  LOADED_POINTS = 'LoadedPoints',

  Error = 'Error'
}

// export interface BasePayload {
//   token0: string
//   token1: string
// }

export interface FetchPointsPayload {
  session_id: string
  participant_id: string
  ai: string
  messages: SendMessage[]
}

export type FetchedPointsPayload = {
  session_id: string
  msgs: SessionMsg[]
}

export interface LoadPointsPayload {
  limit: number
  offset: number
}

export interface LoadedPointsPayload {
  session_id: string
  offset: number
  limit: number
  msgs: SessionMsg[]
}

export interface ChatEvent {
  type: ChatEventType
  payload:
    | FetchPointsPayload
    | LoadPointsPayload
    | FetchedPointsPayload
    | LoadedPointsPayload
}

export class ChatRunner {
  // 存储到indexdb
  static storePoints = async (
    sessionId: string,
    msg: MsgData
  ) => {
    await dbBridge.ChatSession.bulkPut(
      sessionId,
      [msg]
    )
  }

  // 存储到indexdb
  static bulkStorePoints = (
    sessionId: string,
    msg: MsgData
  ) => {
    void ChatRunner.storePoints(sessionId, msg)
  }

  // 调用接口获取数据（单条）
  static handleFetchPoints = async (payload: FetchPointsPayload) => {
    const { session_id, participant_id, ai, messages } = payload

    const url = constants.formalizeSchema(
      `${constants.AI_CHAT_HTTP_URL}`
    )

    try {
      // 用户内容存储到indexdb
      const userMsg = messages[messages.length-1].content
      const userMsgData = {
        date_time: getCurrentFormattedDate(),
        participant_id: participant_id,
        content: userMsg,
        isThinking:false,
        isSpeaking:false
      } as MsgData
      await dbBridge.ChatSession.bulkPut(session_id, [userMsgData])

      // 调用接口获取响应数据
      const res = await axios.post(url, {
        ai: ai,
        messages: messages
      });
      // const timestamp = new Date().getTime();
      const dateTime = getCurrentFormattedDate()
      const resp = res.data as AIMessage
      const msgData = {
        date_time: dateTime,
        participant_id: participant_id,
        content: resp.content,
        isThinking:false,
        isSpeaking:false
      } as MsgData
      const chatSession = {
        session_id: session_id,
        data: [msgData]
      } as ChatSession

      // 存储到indexdb
      // ChatRunner.bulkStorePoints(session_id, msg)
      await dbBridge.ChatSession.bulkPut(session_id, [msgData])

      self.postMessage({
        type: ChatEventType.FETCHED_POINTS,
        payload: {
          session_id: session_id,
          msgs: [chatSession]
        }
      })
    } catch (e) {
      const chatSession = {
        session_id: session_id,
        data: [e]
      } as ChatSession
      self.postMessage({
        type: ChatEventType.Error,
        payload: {
          session_id: session_id,
          msgs: [chatSession]
        }
      })
    }
  }

  // 直接获取indexdb的多条数据
  static handleLoadPoints = async (payload: LoadPointsPayload) => {
    const { offset, limit } = payload
    try {
      const msgs = await dbBridge.ChatSession.getChatSessions(
        offset,
        limit
      )

      self.postMessage({
        type: ChatEventType.LOADED_POINTS,
        payload: {
          offset,
          limit,
          msgs
        }
      })
    } catch (e) {
      self.postMessage({
        type: ChatEventType.Error,
        payload: e
      })
    }
  }
}
