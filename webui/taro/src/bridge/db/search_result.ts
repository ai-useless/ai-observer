import { search } from 'src/localstores'

export class SearchResult {
  static create = (topic: string, prompt: string, modelId: number, message: string) => {
    search.Search.appendSearchResult({
      topic,
      prompt,
      modelId,
      message
    })
  }
}
