import { defineStore } from 'pinia'
import { constants } from 'src/constant'
import axios, { AxiosResponse } from 'axios'
import { _Model } from './types'
import { dbBridge } from 'src/bridge'

export const useModelStore = defineStore('model', {
  state: () => ({
    models: [] as _Model[],
    blacklist: [] as string[]
  }),
  actions: {
    getModels(done?: (error: boolean, rows?: _Model[]) => void) {
      axios
        .get(constants.GET_MODELS_API)
        .then(async (resp: AxiosResponse<_Model[]>) => {
          if (done) done(false, resp.data)
          await this.appendModels(resp.data)
        })
        .catch((e) => {
          console.log(`Failed get models: ${JSON.stringify(e)}`)
          if (done) done(true)
        })
    },
    async appendModels(models: _Model[]) {
      models.forEach((model) => {
        model.disabled = this.blacklist.includes(model.name)
        const index = this.models.findIndex((el) => el.name === model.name)
        this.models.splice(index >= 0 ? index : 0, index >= 0 ? 1 : 0, model)
      })
      await dbBridge._Model.initialize(
        this.models.map((el) => {
          return { ...el }
        })
      )
    }
  },
  getters: {}
})

const model = useModelStore()

export class Model {
  static getModels = () => model.getModels()

  static models = () => model.models
}
