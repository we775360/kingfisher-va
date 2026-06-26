import { EventEmitter } from 'node:events'

export interface PositionEvent {
  flightNumber: string
  depIcao: string
  arrIcao: string
  lat: number
  lng: number
  alt: number
  heading: number
  groundSpeed: number
  phase: string
  pilot: { firstName: string; lastName: string; pilotId: string; rank: string }
  timestamp: number
}

class PositionBus extends EventEmitter {
  private lastPosition: PositionEvent | null = null

  emitPosition(data: PositionEvent) {
    this.lastPosition = data
    this.emit('position', data)
  }

  getLastPosition() {
    return this.lastPosition
  }
}

export const positionBus = new PositionBus()
