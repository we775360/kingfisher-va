export type AnnouncementFile =
  | 'boarding' | 'pushback' | 'safety_demo' | 'takeoff' | 'climb_10000ft'
  | 'cruise' | 'descent' | 'approach' | 'landing' | 'taxi_in'

export const ANNOUNCEMENT_FILES: AnnouncementFile[] = [
  'boarding', 'pushback', 'safety_demo', 'takeoff', 'climb_10000ft',
  'cruise', 'descent', 'approach', 'landing', 'taxi_in',
]

export class AudioManager {
  private context: AudioContext | null = null
  private masterGain: GainNode | null = null
  private currentSource: AudioBufferSourceNode | null = null
  private _volume = 0.7
  private _isPlaying = false
  private _currentFile: string | null = null

  get volume() { return this._volume }
  get isPlaying() { return this._isPlaying }
  get currentFile() { return this._currentFile }

  async init(): Promise<boolean> {
    try {
      this.context = new AudioContext()
      this.masterGain = this.context.createGain()
      this.masterGain.gain.value = this._volume
      this.masterGain.connect(this.context.destination)
      return true
    } catch {
      console.error('Failed to init AudioContext')
      return false
    }
  }

  setVolume(vol: number) {
    this._volume = Math.max(0, Math.min(1, vol))
    if (this.masterGain) {
      this.masterGain.gain.value = this._volume
    }
  }

  async playAnnouncement(file: AnnouncementFile): Promise<void> {
    if (!this.context || !this.masterGain) {
      const ok = await this.init()
      if (!ok) return
    }

    this.stop()

    try {
      this._isPlaying = true
      this._currentFile = file

      const response = await fetch(`/audio/announcements/${file}.mp3`)
      if (!response.ok) throw new Error(`Failed to load ${file}.mp3`)

      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.context!.decodeAudioData(arrayBuffer)

      const source = this.context!.createBufferSource()
      source.buffer = audioBuffer
      source.connect(this.masterGain!)
      source.start(0)

      this.currentSource = source

      await new Promise<void>((resolve) => {
        source.onended = () => {
          this._isPlaying = false
          this._currentFile = null
          this.currentSource = null
          resolve()
        }
      })
    } catch (err) {
      console.error('Playback error:', err)
      this._isPlaying = false
      this._currentFile = null
    }
  }

  playAmbient(file: string): Promise<void> {
    return this.playAnnouncement(file as AnnouncementFile)
  }

  stop() {
    if (this.currentSource) {
      try { this.currentSource.stop() } catch { }
      this.currentSource = null
    }
    this._isPlaying = false
    this._currentFile = null
  }

  destroy() {
    this.stop()
    if (this.context) {
      this.context.close()
      this.context = null
    }
  }
}

let instance: AudioManager | null = null

export function getAudioManager(): AudioManager {
  if (!instance) {
    instance = new AudioManager()
  }
  return instance
}
