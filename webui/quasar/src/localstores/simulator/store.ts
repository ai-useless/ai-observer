import { defineStore } from 'pinia'
import { constants } from 'src/constant'
import axios, { AxiosResponse } from 'axios'
import { _Simulator } from './types'
import { dbBridge } from 'src/bridge'
import { Cookies } from 'quasar'

export const useSimulatorStore = defineStore('simulator', {
  state: () => ({
    allSimulatorsCount: 0,
    mySimulatorsCount: 0,
    simulators: [] as _Simulator[]
  }),
  actions: {
    countSimulators(
      code?: string,
      done?: (error: boolean, count?: number) => void,
      mine?: boolean
    ) {
      const token = mine ? Cookies.get('X-Token') : undefined
      const url = `${constants.COUNT_SIMULATORS_API}${code?.length || token?.length ? '?' : ''}${code?.length ? 'code=' + code : ''}${code?.length && token?.length ? '&' : ''}${token?.length ? 'token=' + token : ''}`
      axios
        .get(url)
        .then((resp: AxiosResponse<number>) => {
          if (done) done(false, resp.data)
          if (code) this.mySimulatorsCount = resp.data
          else this.allSimulatorsCount = resp.data
        })
        .catch((e) => {
          console.log(`Failed count simulators: ${JSON.stringify(e)}`)
          if (done) done(true)
        })
    },
    getSimulators(
      code?: string,
      done?: (error: boolean, rows?: _Simulator[]) => void,
      mine?: boolean
    ) {
      const token = mine ? Cookies.get('X-Token') : undefined
      const url = `${constants.GET_USER}${code?.length || token?.length ? '?' : ''}${code?.length ? 'code=' + code : ''}${code?.length && token?.length ? '&' : ''}${token?.length ? 'token=' + token : ''}`
      axios
        .get(url)
        .then(async (resp: AxiosResponse<_Simulator[]>) => {
          if (done) done(false, resp.data)
          await this.appendSimulators(resp.data, !!mine)
        })
        .catch((e) => {
          console.log(`Failed get simulators: ${JSON.stringify(e)}`)
          if (done) done(true)
        })
    },
    async appendSimulators(simulators: _Simulator[], mine: boolean) {
      simulators.forEach((simulator) => {
        const index = this.simulators.findIndex(
          (el) => el.simulator === simulator.simulator
        )

        simulator.mine = mine
        simulator.language = dbBridge._Language.randomPick()

        this.simulators.splice(
          index >= 0 ? index : 0,
          index >= 0 ? 1 : 0,
          simulator
        )
      })
      await dbBridge._Simulator.initialize(
        this.simulators.map((el) => {
          return { ...el }
        })
      )
    },
    createSimulator(simulator: Record<string, unknown>, done?: (error: boolean) => void) {
      const token = Cookies.get('X-Token')

      axios.post(constants.COOK_SIMULATOR_API, {
        ...simulator,
        token
      }).then(() => {
        this.getSimulators()
        done?.(false)
      }).catch(() => {
        done?.(true)
      })
    }
  },
  getters: {}
})

const simulator = useSimulatorStore()

export class Simulator {
  static allSimulatorsCount = () => simulator.allSimulatorsCount
  static setAllSimulatorsCount = (v: number) =>
    (simulator.allSimulatorsCount = v)

  static mySimulatorsCount = () => simulator.mySimulatorsCount
  static setAvatar = (v: number) => (simulator.mySimulatorsCount = v)

  static countSimulators = (code?: string, mine?: boolean) => simulator.countSimulators(code, undefined, mine)
  static getSimulators = (
    code?: string,
    done?: (error: boolean, rows?: _Simulator[]) => void,
    mine?: boolean
  ) => simulator.getSimulators(code, done, mine)

  static mySimulators = () => simulator.simulators.filter((el) => el.mine)
  static allSimulators = () => simulator.simulators

  static simulator = (id: number) =>
    simulator.simulators.find((el) => el.id === id)

  static createSimulator = (_simulator: Record<string, unknown>, done?: (error: boolean) => void) => (simulator.createSimulator(_simulator, done))
}
