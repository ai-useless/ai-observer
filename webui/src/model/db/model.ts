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
}

export interface Seminar {
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
  speakerVoice: string
}

export interface Message {
  id?: number
  seminarId: number
  participatorId: number
  timestamp: number
  prompt: string
  content: string
  audio: string
  duration: number
}
