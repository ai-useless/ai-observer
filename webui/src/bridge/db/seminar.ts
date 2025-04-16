import { uid } from 'quasar'
import { dbSeminar } from 'src/controller'

export class _Seminar {
  static create = async (topic: string) => {
    const _uid = uid()
    await dbSeminar.seminars.add({
      uid: _uid,
      topic: topic
    })
    return _uid
  }

  static get = async (_uid: string) => {
    return await dbSeminar.seminars.where('uid').equals(_uid).first()
  }
}
