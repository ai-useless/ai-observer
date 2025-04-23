import { dbModel } from '../../model'

export class _Setting {
  static #setting = new Map<dbModel.SettingKey, unknown>()

  static create = (key: dbModel.SettingKey, value: unknown) => {
    _Setting.#setting.set(key, value)
  }

  static get = (key: dbModel.SettingKey) => {
    return _Setting.#setting.get(key)
  }
}
