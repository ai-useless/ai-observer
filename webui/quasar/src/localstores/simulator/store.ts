import { defineStore } from 'pinia'
import { constants } from 'src/constant'
import axios, { AxiosResponse } from 'axios'
import { _Simulator } from './types'
import { dbBridge } from 'src/bridge'

export const useSimulatorStore = defineStore('simulator', {
  state: () => ({
    allSimulatorsCount: 0,
    mySimulatorsCount: 0,
    simulators: [] as _Simulator[]
  }),
  actions: {
    countSimulators(
      code?: string,
      done?: (error: boolean, count?: number) => void
    ) {
      const url = `${constants.COUNT_SIMULATORS_API}${code ? '?code=' + code : ''}`
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
      done?: (error: boolean, rows?: _Simulator[]) => void
    ) {
      const url = `${constants.GET_SIMULATORS_API}${code ? '?code=' + code : ''}`
      axios
        .get(url)
        .then(async (resp: AxiosResponse<_Simulator[]>) => {
          if (done) done(false, resp.data)
          await this.appendSimulators(resp.data, code !== undefined)
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

  static countSimulators = (code?: string) => simulator.countSimulators(code)
  static getSimulators = (code?: string) => simulator.getSimulators(code)

  static mySimulators = () => simulator.simulators.filter((el) => el.mine)
  static allSimulators = () => simulator.simulators
}
