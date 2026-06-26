import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://kingfisher-api.onrender.com/api/v1'

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kf_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('kf_token')
      window.location.reload()
    }
    return Promise.reject(err)
  },
)

export interface OFP {
  general: { icao_airline: string; flight_number: string }
  aircraft: { icaocode: string; reg: string; name?: string }
  origin: { icao_code: string; iata_code: string; name?: string }
  destination: { icao_code: string; iata_code: string; name?: string }
  times: { est_block: number; est_out: number; est_off: number; est_on: number; est_in: number }
  fuel: { plan_ramp: number }
}

export interface Booking {
  id: string
  flightNumber: string
  depIcao: string
  arrIcao: string
  depName: string
  arrName: string
  aircraft: { name: string; registration: string; icao: string }
  route: { flightNumber: string; depIcao: string; arrIcao: string; depName: string; arrName: string }
  status: string
}

export async function login(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password })
  return res.data
}

export async function getMe() {
  const res = await api.get('/auth/me')
  return res.data
}

export async function fetchSimBrief(username: string) {
  const res = await api.get(`/acars/simbrief?username=${username}`)
  return res.data as OFP
}

export async function startFlight(data: {
  flightNumber: string; depIcao: string; arrIcao: string; aircraftType: string; simulator?: string; network?: string
}) {
  const res = await api.post('/acars/start', data)
  return res.data
}

export async function updatePosition(data: {
  lat: number; lng: number; alt: number; heading: number; groundSpeed: number; phase?: string; fuel?: number; vs?: number
}) {
  const res = await api.post('/acars/position', data)
  return res.data
}

export async function endFlight() {
  const res = await api.post('/acars/end')
  return res.data
}

export async function submitPIREP(data: {
  flightNumber: string; depIcao: string; arrIcao: string; depTime: string; arrTime: string;
  aircraftId: string; simulator: string; network: string; landingRate: number; fuelUsed: number;
  distance: number; flightTime: number; comments?: string; bookingId?: string
}) {
  const res = await api.post('/pirep', data)
  return res.data
}

export async function getMyBookings() {
  const res = await api.get('/bookings/my')
  return res.data as Booking[]
}

export default api
