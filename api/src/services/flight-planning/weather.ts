import axios from 'axios'

export interface WeatherData {
  metarDep: string
  metarArr: string
  metarAlt: string
  windsAloft: WindsAloftData[]
}

export interface WindsAloftData {
  altitude: number
  direction: number
  speed: number
  temperature: number
}

export async function fetchWeather(depIcao: string, arrIcao: string, altIcao?: string): Promise<WeatherData> {
  const [metarDep, metarArr, metarAlt] = await Promise.all([
    fetchMETAR(depIcao),
    fetchMETAR(arrIcao),
    altIcao ? fetchMETAR(altIcao) : Promise.resolve(''),
  ])
  return {
    metarDep,
    metarArr,
    metarAlt,
    windsAloft: generateStatisticalWinds(),
  }
}

async function fetchMETAR(icao: string): Promise<string> {
  try {
    const res = await axios.get(`https://aviationweather.gov/api/data/metar?ids=${icao}&format=raw`, {
      timeout: 5000,
    })
    return (res.data || '').trim() || `METAR unavailable for ${icao}`
  } catch {
    return `METAR unavailable for ${icao}`
  }
}

export function generateStatisticalWinds(): WindsAloftData[] {
  return [
    { altitude: 100, direction: 260, speed: 9, temperature: 28 },
    { altitude: 200, direction: 260, speed: 12, temperature: 22 },
    { altitude: 300, direction: 250, speed: 15, temperature: 16 },
    { altitude: 340, direction: 100, speed: 8, temperature: -35 },
    { altitude: 360, direction: 85, speed: 22, temperature: -41 },
    { altitude: 380, direction: 90, speed: 25, temperature: -46 },
    { altitude: 400, direction: 95, speed: 28, temperature: -52 },
    { altitude: 420, direction: 100, speed: 30, temperature: -57 },
    { altitude: 450, direction: 105, speed: 32, temperature: -63 },
  ]
}
