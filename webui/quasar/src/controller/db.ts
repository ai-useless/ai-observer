import Dexie, { Table } from 'dexie'
import { sha256 } from 'hash-wasm'
import { dbModel } from 'src/model'

export const dbSeminar = new Dexie('SeminarDatabase') as Dexie & {
  participators: Table<dbModel.Participator, 'id'>
  models: Table<dbModel.Model, 'id'>
  simulators: Table<dbModel.Simulator, 'id'>
  seminars: Table<dbModel.Seminar, 'id'>
  messages: Table<dbModel.Message, 'id'>
  settings: Table<dbModel.Setting, 'id'>
}

dbSeminar.version(1).stores({
  participators: '++id, seminarUid, role, simulatorId, modelId',
  models:
    '&id, &name, vendor, author, author_logo_url, model_logo_url, host_model, vendor_logo_url, disabled',
  simulators:
    '&id, &simulator, audio_id, audio_url, simulator_avatar_url, origin_personality, timestamp, title, archetype, mine',
  seminars: '++id, uid, topic',
  messages:
    '++id, seminarId, participatorId, timestamp, prompt, content, audioCid',
  settings: '++id, key, value'
})

const audioDatabase = (cid: string) => {
  return new Dexie(`Audio-${cid}`) as Dexie & {
    audios: Table<dbModel.Audio, 'id'>
  }
}

export const saveAudio = async (audio: string) => {
  const cid = await sha256(audio)
  const database = audioDatabase(cid)
  database.version(1).stores({
    audios: '++id, cid, audio'
  })
  await database.audios.add({
    cid,
    audio
  })
  return cid
}

export const readAudio = async (cid: string) => {
  return (await audioDatabase(cid).audios.where('cid').equals(cid).first())
    ?.audio
}

const textDatabase = (cid: string) => {
  return new Dexie(`Text-${cid}`) as Dexie & {
    texts: Table<dbModel.Text, 'id'>
  }
}

export const saveText = async (text: string) => {
  const cid = await sha256(text)
  const database = textDatabase(cid)

  database.version(1).stores({
    texts: '++id, cid, text'
  })
  if ((await database.texts.count()) > 0) return cid

  await database.texts.add({
    cid,
    text
  })
  return cid
}

export const readText = async (cid: string) => {
  return (await textDatabase(cid).texts.where('cid').equals(cid).first())?.text
}
