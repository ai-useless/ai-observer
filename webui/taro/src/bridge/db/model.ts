import { dbModel } from '../../model'
import { chutesLogo } from '../../assets'

export class _Model {
  static #models = [
    {
      name: 'deepseek-ai/DeepSeek-V3-0324',
      endpoint: 'https://llm.chutes.ai/v1/chat/completions',
      apiKey:
        '***REMOVED***',
      vendor: 'Chutes',
      author: 'High-Flyer',
      authorLogo:
        'https://upload.wikimedia.org/wikipedia/commons/b/bd/High-Flyer.png',
      modelLogo: 'https://cdn.rayonlabs.ai/chutes/logos/deepseek.webp',
      vendorLogo: chutesLogo,
      hostModel: true
    },
    {
      name: 'chutesai/Mistral-Small-3.1-24B-Instruct-2503',
      endpoint: 'https://llm.chutes.ai/v1/chat/completions',
      apiKey:
        '***REMOVED***',
      vendor: 'Chutes',
      author: 'High-Flyer',
      authorLogo:
        'https://upload.wikimedia.org/wikipedia/commons/b/bd/High-Flyer.png',
      modelLogo: 'https://cdn.rayonlabs.ai/chutes/logos/mistral.webp',
      vendorLogo: chutesLogo,
      hostModel: false
    },
    {
      name: 'deepseek-ai/DeepSeek-R1',
      endpoint: 'https://llm.chutes.ai/v1/chat/completions',
      apiKey:
        '***REMOVED***',
      vendor: 'Chutes',
      author: 'High-Flyer',
      authorLogo:
        'https://upload.wikimedia.org/wikipedia/commons/b/bd/High-Flyer.png',
      modelLogo: 'https://cdn.rayonlabs.ai/chutes/logos/qwen.webp',
      vendorLogo: chutesLogo,
      hostModel: true
    },
    {
      name: 'chutesai/Llama-4-Maverick-17B-128E-Instruct-FP8',
      endpoint: 'https://llm.chutes.ai/v1/chat/completions',
      apiKey:
        '***REMOVED***',
      vendor: 'Chutes',
      author: 'Meta',
      authorLogo:
        'https://upload.wikimedia.org/wikipedia/commons/b/bd/High-Flyer.png',
      modelLogo: 'https://cdn.rayonlabs.ai/chutes/logos/qwen.webp',
      vendorLogo: chutesLogo,
      hostModel: true
    }
  ] as dbModel.Model[]

  static initialize = () => {
    _Model.#models.forEach((model, index) => {
      model.id = index
    })
  }

  static create = (
    name: string,
    endpoint: string,
    apiKey: string | undefined,
    vendor: string,
    author: string,
    authorLogo: string,
    modelLogo: string,
    vendorLogo: string,
    hostModel: boolean
  ) => {
    return _Model.#models.push({
      id: _Model.#models.length,
      name,
      endpoint,
      apiKey,
      vendor,
      author,
      authorLogo,
      modelLogo,
      vendorLogo,
      hostModel
    })
  }

  static randomPeek = (hostModel?: boolean) => {
    const count = _Model.#models.length
    const index = Math.floor(Math.random() * count)
    return (
      _Model.#models
        .filter((op) => hostModel === undefined || op.hostModel === hostModel)
    )[index]
  }

  static model = (id: number) => {
    return _Model.#models[id]
  }
}
