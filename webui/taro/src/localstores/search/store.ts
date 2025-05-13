import { defineStore } from 'pinia'
import { SearchResult } from './types'

export const useSearchStore = defineStore('search', {
  state: () => ({
    topic: undefined as unknown as string,
    messages: [] as SearchResult[]
  }),
  actions: {},
  getters: {}
})

const search = useSearchStore()

export class Search {
  static topic = () => search.topic

  static setTopic = (v: string) => (search.topic = v)

  static searchResults = () => search.messages

  static appendSearchResult = (v: SearchResult) => search.messages.push(v)
}
