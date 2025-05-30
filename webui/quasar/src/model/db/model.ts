import { _Model } from 'src/localstores/model/types'
import { _Simulator } from 'src/localstores/simulator/types'

export type Model = _Model

export enum Role {
  HOST = 'Host',
  GUEST = 'Guest',
  AUDIENCE = 'Audience'
}

export type Simulator = _Simulator

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

export interface Xiangsheng {
  id?: number
  uid: string
  topic: string
  intent: string
}

export enum SettingKey {
  GENERATE_AUDIO = 'GenerateAudio',
  NIANJING_STYPE = '吟唱'
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
