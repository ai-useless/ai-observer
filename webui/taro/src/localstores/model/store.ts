import { defineStore } from 'pinia'
import { constants } from 'src/constant'
import axios from 'taro-axios'
import { _Model } from './types'

export const useModelStore = defineStore('model', {
  state: () => ({
    models: [] as _Model[],
    blacklist: []
  }),
  actions: {
    getModels(done?: (error: boolean, rows?: unknown[]) => void) {
      axios
        .get(constants.GET_MODELS_API)
        .then((resp) => {
          this.appendModels(resp.data)
          if (done) done(false, resp.data)
        })
        .catch((e) => {
          console.log(`Failed get models: ${JSON.stringify(e)}`)
          if (done) done(true)
        })
    },
    appendModels(models: _Model[]) {
      models.forEach((model) => {
        if (this.blacklist.includes(model.name)) return
        const index = this.models.findIndex((el) => el.name === model.name)
        this.models.splice(index >= 0 ? index : 0, index >= 0 ? 1 : 0, model)
      })
    }
  },
  getters: {}
})

const model = useModelStore()

export class Model {
  static getModels = (done?: (error: boolean, rows?: unknown[]) => void) =>
    model.getModels(done)

  static models = () => model.models
}
