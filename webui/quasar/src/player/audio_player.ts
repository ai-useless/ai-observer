export class AudioPlayer {
  context: HTMLAudioElement
  playing = false
  duration = 0
  durationTicker = -1

  constructor(url: string) {
    this.context = new Audio(url)
    this.context.src = url
  }

  static play = (
    url: string,
    loop?: boolean,
    onEnded?: () => void
  ): Promise<AudioPlayer | undefined> => {
    const player = new AudioPlayer(url)

    player.context.src = url
    player.playing = true
    player.duration = player.context.duration

    return new Promise((resolve, reject) => {
      player.context.onerror = (e) => {
        player.playing = false
        if (player.durationTicker >= 0) {
          window.clearInterval(player.durationTicker)
          player.durationTicker = -1
        }
        reject(`Failed play audio: ${JSON.stringify(e)}`)
      }
      player.context.oncanplay = async () => {
        try {
          await player.context.play()
        } catch (e) {
          reject(e)
          return
        }

        player.durationTicker = window.setInterval(() => {
          if (player.context.duration) {
            window.clearInterval(player.durationTicker)
            player.durationTicker = -1
            player.duration = player.context.duration
            resolve(player)
          }
        }, 100)
      }
      player.context.onended = () => {
        onEnded?.()
        player.playing = false
        if (player.durationTicker >= 0) {
          window.clearInterval(player.durationTicker)
          player.durationTicker = -1
        }
        if (loop) {
          player.stop()
          void player.context.play()
        }
      }
    })
  }

  stop = () => {
    this.context.currentTime = 0
    this.context.pause()
  }
}
