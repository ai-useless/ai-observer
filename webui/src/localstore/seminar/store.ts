import { defineStore } from 'pinia'

export const useSeminarStore = defineStore('seminar', {
  state: () => ({
    topic: ''
  }),
  actions: {},
  getters: {}
})

const seminar = useSeminarStore()

export class Seminar {
  static topic = () => {
    return seminar.topic
  }

  static setTopic = (v: string) => {
    seminar.topic = v
  }
}
