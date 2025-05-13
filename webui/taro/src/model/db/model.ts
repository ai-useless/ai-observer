export interface Model {
  id?: number
  name: string
  endpoint: string
  apiKey?: string
  vendor: string
  author: string
  authorLogo: string
  modelLogo: string
  vendorLogo: string
  hostModel: boolean
}

export enum Role {
  HOST = 'Host',
  GUEST = 'Guest',
  AUDIENCE = 'Audience'
}

export interface Simulator {
  id?: number
  name: string
  avatar: string
  personality: string
  host: boolean
  speakerVoice: string
  archetype: string
  title: string
}

export interface Seminar {
  id?: number
  uid: string
  topic: string
}

export interface Xiangsheng {
  id?: number
  uid: string
  topic: string
}

export interface Participator {
  id?: number
  seminarUid: string
  role: Role
  simulatorId: number
  modelId: number
}

export interface Message {
  id?: number
  seminarId: number
  participatorId: number
  timestamp: number
  prompt: string
  content: string
  audioCid: string
}

export enum SettingKey {
  GENERATE_AUDIO = 'GenerateAudio'
}

export interface Setting {
  id?: number
  key: SettingKey
  value: unknown
}

export interface Audio {
  id?: number
  cid: string
  audio: string
}

export interface Text {
  id?: number
  cid: string
  text: string
}
