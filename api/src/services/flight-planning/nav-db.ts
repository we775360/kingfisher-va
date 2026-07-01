import { readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = join(fileURLToPath(import.meta.url), '..')

let airports: any[] = []
let waypoints: any[] = []
let airways: any[] = []
let aircraftProfiles: Record<string, any> = {}

let loaded = false

export function loadNavDatabase() {
  if (loaded) return
  const dataDir = join(__dirname, '..', '..', 'data')
  airports = JSON.parse(readFileSync(join(dataDir, 'nav-airports.json'), 'utf-8'))
  waypoints = JSON.parse(readFileSync(join(dataDir, 'nav-waypoints.json'), 'utf-8'))
  airways = JSON.parse(readFileSync(join(dataDir, 'nav-airways.json'), 'utf-8'))
  aircraftProfiles = JSON.parse(readFileSync(join(dataDir, 'aircraft-profiles.json'), 'utf-8'))
  loaded = true
}

export function getAirport(icao: string) {
  loadNavDatabase()
  return airports.find(a => a.icao === icao.toUpperCase()) || null
}

export function getWaypoint(id: string) {
  loadNavDatabase()
  return waypoints.find(w => w.id === id.toUpperCase()) || null
}

export function getAirway(id: string) {
  loadNavDatabase()
  return airways.find(a => a.id === id.toUpperCase()) || null
}

export function getAircraftProfile(icao: string) {
  loadNavDatabase()
  return aircraftProfiles[icao.toUpperCase()] || null
}

export function getAllAircraftProfiles() {
  loadNavDatabase()
  return aircraftProfiles
}

export function getAllAirports() {
  loadNavDatabase()
  return airports
}

export function getAllWaypoints() {
  loadNavDatabase()
  return waypoints
}

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function bearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * Math.PI / 180
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180)
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) - Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon)
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}
