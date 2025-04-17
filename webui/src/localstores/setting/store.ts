import { defineStore } from 'pinia'

export const useSettingStore = defineStore('setting', {
  state: () => ({
    inScratch: true
  }),
  actions: {},
  getters: {}
})

const setting = useSettingStore()

export class Setting {
  static inScratch = () => {
    return setting.inScratch
  }

  static setInScratch = (v: boolean) => {
    setting.inScratch = v
  }
}
