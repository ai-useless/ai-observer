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

export interface Session {
  id?: number
  uid: string
  topic: string
}

export interface Participator {
  id?: number
  sessionId: number
  role: Role
  simulatorId: number
  modelId: string
}
