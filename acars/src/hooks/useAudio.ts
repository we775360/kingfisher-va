import { useState, useEffect, useCallback } from 'react'
import { useFlightStore, FlightPhase } from '../stores/flightStore'
import { useSettingsStore } from '../stores/settingsStore'

type AnnouncementFile = 'boarding' | 'pushback' | 'safety_demo' | 'takeoff' | 'climb_10000ft'
  | 'cruise' | 'descent' | 'approach' | 'landing' | 'taxi_in'

const PHASE_TO_ANNOUNCEMENT: Record<FlightPhase, AnnouncementFile | null> = {
  'PRE-FLIGHT': null,
  'BOARDING': 'boarding',
  'PUSHBACK': 'pushback',
  'TAXI': null,
  'TAKEOFF': 'takeoff',
  'INITIAL CLIMB': 'climb_10000ft',
  'CLIMB': 'climb_10000ft',
  'CRUISE': 'cruise',
  'DESCENT': 'descent',
  'APPROACH': 'approach',
  'FINAL': 'approach',
  'LANDED': 'landing',
  'TAXI-IN': 'taxi_in',
  'ARRIVED': null,
}

export function useAudio() {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentAnnouncement, setCurrentAnnouncement] = useState<string | null>(null)
  const phase = useFlightStore((s) => s.phase)
  const { autoAnnouncements, volume } = useSettingsStore()
  const lastPlayedRef = new Map<FlightPhase, boolean>()

  useEffect(() => {
    if (!audioContext) return
    if (!autoAnnouncements) return

    const file = PHASE_TO_ANNOUNCEMENT[phase]
    if (!file) return

    if (lastPlayedRef.get(phase)) return
    lastPlayedRef.set(phase, true)

    const play = async () => {
      try {
        setIsPlaying(true)
        setCurrentAnnouncement(file)
        const response = await fetch(`/audio/announcements/${file}.mp3`)
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        const source = audioContext.createBufferSource()
        const gainNode = audioContext.createGain()
        gainNode.gain.value = volume
        source.buffer = audioBuffer
        source.connect(gainNode)
        gainNode.connect(audioContext.destination)
        source.start(0)
        await new Promise((resolve) => { source.onended = resolve })
      } catch (err) {
        console.error('Audio playback error:', err)
      } finally {
        setIsPlaying(false)
        setCurrentAnnouncement(null)
      }
    }

    play()
  }, [phase, autoAnnouncements, audioContext])

  const initAudio = useCallback(() => {
    if (!audioContext) {
      const ctx = new AudioContext()
      setAudioContext(ctx)
    }
  }, [audioContext])

  const playAnnouncement = useCallback(async (file: string) => {
    if (!audioContext) return
    try {
      setIsPlaying(true)
      setCurrentAnnouncement(file)
      const response = await fetch(`/audio/announcements/${file}.mp3`)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      const source = audioContext.createBufferSource()
      const gainNode = audioContext.createGain()
      gainNode.gain.value = volume
      source.buffer = audioBuffer
      source.connect(gainNode)
      gainNode.connect(audioContext.destination)
      source.start(0)
      await new Promise((resolve) => { source.onended = resolve })
    } catch (err) {
      console.error('Audio playback error:', err)
    } finally {
      setIsPlaying(false)
      setCurrentAnnouncement(null)
    }
  }, [audioContext, volume])

  return { isPlaying, currentAnnouncement, initAudio, playAnnouncement }
}
