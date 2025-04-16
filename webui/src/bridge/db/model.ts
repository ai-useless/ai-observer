import { dbSeminar } from 'src/controller'

export class _Model {
  static create = async (name: string, endpoint: string, apiKey: string | undefined, vendor: string, logo: string) => {
    return await dbSeminar.models.add({
      name,
      endpoint,
      apiKey,
      vendor,
      logo
    })
  }
}
