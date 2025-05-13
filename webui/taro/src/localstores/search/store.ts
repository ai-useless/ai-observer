import { defineStore } from 'pinia'

export const useSearchStore = defineStore('search', {
  state: () => ({
    topic: undefined as unknown as string
  }),
  actions: {},
  getters: {}
})

const search = useSearchStore()

export class Search {
  static topic = () => search.topic

  static setTopic = (v: string) => (search.topic = v)
}
