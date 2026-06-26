import { useState, useEffect, useCallback, useRef } from 'react'
import { useFlightStore, FlightData } from '../stores/flightStore'

export function useSimulator() {
  const [simConnected, setSimConnected] = useState(false)
  const [simType, setSimType] = useState('')
  const setFlightData = useFlightStore((s) => s.setFlightData)
  const updatePhaseFromData = useFlightStore((s) => s.updatePhaseFromData)
  const setPhase = useFlightStore((s) => s.setPhase)
  const setFlightDataRef = useRef(setFlightData)
  const updatePhaseRef = useRef(updatePhaseFromData)
  const setPhaseRef = useRef(setPhase)

  useEffect(() => {
    setFlightDataRef.current = setFlightData
    updatePhaseRef.current = updatePhaseFromData
    setPhaseRef.current = setPhase
  }, [setFlightData, updatePhaseFromData, setPhase])

  useEffect(() => {
    const cleanup: (() => void)[] = []

    if (window.electronAPI?.onSimStatus) {
      const unsub = window.electronAPI.onSimStatus((status) => {
        setSimConnected(status.connected)
        setSimType(status.type)
      })
      cleanup.push(unsub)
    }

    if (window.electronAPI?.onFlightData) {
      const unsub = window.electronAPI.onFlightData((data: FlightData) => {
        setFlightDataRef.current(data)
        const newPhase = updatePhaseRef.current(data)
        if (newPhase !== useFlightStore.getState().phase) {
          setPhaseRef.current(newPhase)
        }
      })
      cleanup.push(unsub)
    }

    return () => cleanup.forEach((fn) => fn())
  }, [])

  const connect = useCallback(async (simTypeStr?: string) => {
    if (window.electronAPI?.sim?.connect) {
      return window.electronAPI.sim.connect(simTypeStr)
    }
    return false
  }, [])

  const disconnect = useCallback(async () => {
    if (window.electronAPI?.sim?.disconnect) {
      await window.electronAPI.sim.disconnect()
    }
  }, [])

  return { simConnected, simType, connect, disconnect }
}
