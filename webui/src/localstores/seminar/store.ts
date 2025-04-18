import { defineStore } from 'pinia'

export const useSeminarStore = defineStore('seminar', {
  state: () => ({
    uid: undefined as unknown as string,
    participatorsInThinking: new Map<number, boolean>()
  }),
  actions: {},
  getters: {}
})

const seminar = useSeminarStore()

export class Seminar {
  static seminar = () => {
    return seminar.uid
  }

  static setSeminar = (v: string) => {
    seminar.uid = v
  }

  static startThink = (participatorId: number) => {
    seminar.participatorsInThinking.set(participatorId, true)
  }

  static stopThink = (participatorId: number) => {
    seminar.participatorsInThinking.delete(participatorId)
  }

  static thinking = (participatorId: number) => {
    return seminar.participatorsInThinking.has(participatorId)
  }
}
