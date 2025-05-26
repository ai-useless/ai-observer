import Taro from '@tarojs/taro'

export class AudioPlayer {
  context: Taro.InnerAudioContext
  playing = false
  duration = 0
  durationTicker = -1

  constructor(url: string) {
    this.context = Taro.createInnerAudioContext()
    this.context.src = url
    this.playing = true
    this.duration = this.context.duration
  }

  static play = (url: string, loop?: boolean, onEnded?: () => void): Promise<AudioPlayer | undefined> => {
    const player = new AudioPlayer(url)

    return new Promise((resolve, reject) => {
      player.context.onError((e) => {
        player.playing = false
        if (player.durationTicker >= 0) {
          window.clearInterval(player.durationTicker)
          player.durationTicker = -1
        }
        reject(`Failed play audio: ${JSON.stringify(e)}`)
      })
      player.context.onCanplay(() => {
        player.context.play()

        player.durationTicker = window.setInterval(() => {
          if (player.context.duration) {
            window.clearInterval(player.durationTicker)
            player.durationTicker = -1
            player.duration = player.context.duration
            resolve(player)
            return
          }
        }, 100)
      })
      player.context.onEnded(() => {
        if (player.durationTicker >= 0) {
          window.clearInterval(player.durationTicker)
          player.durationTicker = -1
        }
        if (onEnded) {
          onEnded()
        }
        if (loop) {
          player.context.seek(0)
          player.context.stop()
          player.context.play()
        } else {
          player.playing = false
          player.stop()
        }
      })
    })
  }

  stop = () => {
    if (!this.playing) return
    this.playing = false
    this.context.stop()
    this.context.destroy()
  }
}
