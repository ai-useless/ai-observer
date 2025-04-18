import Dexie, { Table } from 'dexie'
import { dbModel } from 'src/model'

export const dbSeminar = new Dexie('SeminarDatabase') as Dexie & {
  participators: Table<dbModel.Participator, 'id'>
  models: Table<dbModel.Model, 'id'>
  simulators: Table<dbModel.Simulator, 'id'>
  seminars: Table<dbModel.Seminar, 'id'>
  messages: Table<dbModel.Message, 'id'>
}

dbSeminar.version(1).stores({
  participators: '++id, seminarUid, role, simulatorId, modelId',
  models:
    '++id, &name, endpoint, apiKey, vendor, author, authorLogo, modelLogo, hostModel',
  simulators: '++id, &name, avatar, host, speakerVoice',
  seminars: '++id, uid, topic',
  messages:
    '++id, seminarId, participatorId, timestamp, prompt, content, audio, duration'
})
