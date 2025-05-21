import { defineStore } from 'pinia'

export const useSettingStore = defineStore('setting', {
  state: () => ({
    tabIndex: -1,
    currentMenu: ''
  }),
  actions: {},
  getters: {}
})

const setting = useSettingStore()

export class Setting {
  static tabIndex = () => setting.tabIndex

  static setTabIndex = (v: number) => (setting.tabIndex = v)

  static currentMenu = () => setting.currentMenu

  static setCurrentMenu = (v: string) => (setting.currentMenu = v)
}
