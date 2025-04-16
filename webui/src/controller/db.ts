import Dexie, { Table } from 'dexie'
import { dbModel } from 'src/model'

export const dbSeminar = new Dexie('SeminarDatabase') as Dexie & {
  participators: Table<dbModel.Participator, 'id'>,
  models: Table<dbModel.Model, 'id'>,
  simulators: Table<dbModel.Simulator, 'id'>,
  seminars: Table<dbModel.Seminar, 'id'>
}

dbSeminar.version(1).stores({
  participators: '++id, sessionId, role, simulatorId, modelId',
  models: '++id, name, endpoint, apiKey, vendor, logo',
  simulators: '++id, name, avatar',
  seminars: '++id, uid, topic'
})
