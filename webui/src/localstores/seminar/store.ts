import { defineStore } from 'pinia'

export const useSeminarStore = defineStore('seminar', {
  state: () => ({
    uid: undefined as unknown as string
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
}
