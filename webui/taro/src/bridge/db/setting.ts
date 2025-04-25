import { dbModel } from '../../model'

export class _Setting {
  private static setting = new Map<dbModel.SettingKey, unknown>([
    [dbModel.SettingKey.GENERATE_AUDIO, true]
  ])

  static create = (key: dbModel.SettingKey, value: unknown) => {
    _Setting.setting.set(key, value)
  }

  static get = (key: dbModel.SettingKey) => {
    return _Setting.setting.get(key)
  }
}
