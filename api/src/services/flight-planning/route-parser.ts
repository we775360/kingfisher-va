import { getWaypoint, getAirway, haversineDistance, bearing, getAirport } from './nav-db.js'

export interface RouteLeg {
  from: string
  to: string
  fromLat: number
  fromLon: number
  toLat: number
  toLon: number
  distance: number
  bearing: number
  airway?: string
  type: 'waypoint' | 'sid' | 'star' | 'direct'
}

export interface ParsedRoute {
  legs: RouteLeg[]
  totalDistance: number
  waypoints: string[]
  routeString: string
  sid?: string
  star?: string
}

export function parseRouteString(routeStr: string, depIcao: string, arrIcao: string): ParsedRoute {
  const tokens = routeStr.trim().split(/\s+/)
  const legs: RouteLeg[] = []
  const waypointList: string[] = []
  let lastValidCoord: { lat: number; lon: number } | null = null
  let sid: string | undefined
  let star: string | undefined

  const depAirport = getAirport(depIcao)
  const arrAirport = getAirport(arrIcao)

  if (depAirport) {
    lastValidCoord = { lat: depAirport.lat, lon: depAirport.lon }
  }

  let i = 0
  while (i < tokens.length) {
    const token = tokens[i]

    if (/^\d+[A-Z]$/.test(token) || /^[A-Z]+\d+[A-Z]*$/.test(token)) {
      const isStar = /^[A-Z]+\d+[A-Z]*$/.test(token) && i > 1
      if (i === 1) {
        sid = token
      }
      if (i === tokens.length - 1) {
        star = token
      }
      i++
      continue
    }

    const airway = getAirway(token)
    if (airway && i + 1 < tokens.length) {
      const nextToken = tokens[i + 1]
      if (!getAirway(nextToken)) {
        const nextWpt = getWaypoint(nextToken)
        if (nextWpt && lastValidCoord) {
          const dist = haversineDistance(lastValidCoord.lat, lastValidCoord.lon, nextWpt.lat, nextWpt.lon)
          const brg = bearing(lastValidCoord.lat, lastValidCoord.lon, nextWpt.lat, nextWpt.lon)
          legs.push({
            from: waypointList[waypointList.length - 1] || depIcao,
            to: nextWpt.id,
            fromLat: lastValidCoord.lat,
            fromLon: lastValidCoord.lon,
            toLat: nextWpt.lat,
            toLon: nextWpt.lon,
            distance: Math.round(dist),
            bearing: Math.round(brg),
            airway: token,
            type: 'waypoint',
          })
          waypointList.push(nextWpt.id)
          lastValidCoord = { lat: nextWpt.lat, lon: nextWpt.lon }
          i += 2
          continue
        }
      } else {
        const nextWpt = getWaypoint(nextToken)
        if (nextWpt && lastValidCoord) {
          const dist = haversineDistance(lastValidCoord.lat, lastValidCoord.lon, nextWpt.lat, nextWpt.lon)
          const brg = bearing(lastValidCoord.lat, lastValidCoord.lon, nextWpt.lat, nextWpt.lon)
          legs.push({
            from: waypointList[waypointList.length - 1] || depIcao,
            to: nextWpt.id,
            fromLat: lastValidCoord.lat,
            fromLon: lastValidCoord.lon,
            toLat: nextWpt.lat,
            toLon: nextWpt.lon,
            distance: Math.round(dist),
            bearing: Math.round(brg),
            airway: token,
            type: 'waypoint',
          })
          waypointList.push(nextWpt.id)
          lastValidCoord = { lat: nextWpt.lat, lon: nextWpt.lon }
          i += 2
          continue
        }
      }
    }

    const wpt = getWaypoint(token)
    if (wpt) {
      if (lastValidCoord) {
        const dist = haversineDistance(lastValidCoord.lat, lastValidCoord.lon, wpt.lat, wpt.lon)
        const brg = bearing(lastValidCoord.lat, lastValidCoord.lon, wpt.lat, wpt.lon)
        legs.push({
          from: waypointList[waypointList.length - 1] || depIcao,
          to: wpt.id,
          fromLat: lastValidCoord.lat,
          fromLon: lastValidCoord.lon,
          toLat: wpt.lat,
          toLon: wpt.lon,
          distance: Math.round(dist),
          bearing: Math.round(brg),
          type: 'waypoint',
        })
      }
      waypointList.push(wpt.id)
      lastValidCoord = { lat: wpt.lat, lon: wpt.lon }
    }

    i++
  }

  if (arrAirport && lastValidCoord) {
    const dist = haversineDistance(lastValidCoord.lat, lastValidCoord.lon, arrAirport.lat, arrAirport.lon)
    const brg = bearing(lastValidCoord.lat, lastValidCoord.lon, arrAirport.lat, arrAirport.lon)
    legs.push({
      from: waypointList[waypointList.length - 1] || depIcao,
      to: arrIcao,
      fromLat: lastValidCoord.lat,
      fromLon: lastValidCoord.lon,
      toLat: arrAirport.lat,
      toLon: arrAirport.lon,
      distance: Math.round(dist),
      bearing: Math.round(brg),
      type: 'direct',
    })
    waypointList.push(arrIcao)
  }

  const totalDistance = legs.reduce((sum, leg) => sum + leg.distance, 0)

  return {
    legs,
    totalDistance,
    waypoints: waypointList,
    routeString: routeStr,
    sid,
    star,
  }
}
