export interface Model {
  id?: number
  name: string
  endpoint: string
  apiKey?: string
  vendor: string
  logo: string
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
}

export interface Seminar {
  id?: number
  uid: string
  topic: string
}

export interface Participator {
  id?: number
  seminarId: number
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
}
