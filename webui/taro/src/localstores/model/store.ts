import { defineStore } from 'pinia'
import { constants } from 'src/constant'
import axios from 'taro-axios'
import { _Model } from './types'

export const useModelStore = defineStore('model', {
  state: () => ({
    models: [] as _Model[]
  }),
  actions: {
    getModels(done?: (error: boolean, rows?: unknown[]) => void) {
      axios.get(constants.GET_MODELS_API).then((resp) => {
        if (done) done(false, resp.data)
        this.appendModels(resp.data)
      }).catch((e) => {
        console.log(`Failed get models: ${JSON.stringify(e)}`)
        if (done) done(true)
      })
    },
    appendModels(models: _Model[]) {
      models.forEach((model) => {
        const index = this.models.findIndex((el) => el.model === model.name)
        this.models.splice(index >= 0 ? index : 0, index >= 0 ? 1 : 0, model)
      })
    }
  },
  getters: {}
})

const model = useModelStore()

export class Model {
  static getModels = () => model.getModels()

  static models = () => model.models
}
