/* eslint-disable camelcase */
// 发送给后端接口的msg
export interface SendMessage {
  role: string;
  content: string;
}

// 后端响应msg
export interface AIMessage {
  content: string;
}

// 存储和前端展示msg old
export interface Messages {
  session_id: string;
  sort_index: number;
  participant_id: string;
  content: string;
  isThinking: boolean;
  isSpeaking: boolean;
}

export interface MsgData {
  date_time: string;
  participant_id: string;
  content: string;
  isThinking: boolean;
  isSpeaking: boolean;
}

// 存储和前端展示msg
export interface SessionMsg {
  session_id: string;
  data: MsgData[]
}

// load
// 将indexdb的内容直接读取出来，不存在localstore，需要将session_id相同的内容，按照sort_index的顺序取出来，然后在前端界面生成数组

// fetch
// 需要带上本次的session_id, 调用post请求内容，将返回内容组装为indexdb的内容，存储到indexdb, 然后再将内容
