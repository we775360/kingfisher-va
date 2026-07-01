export interface FuelPlan {
  tripFuel: number
  contingencyFuel: number
  alternateFuel: number
  finalReserve: number
  minimumTakeoffFuel: number
  extraFuel: number
  takeoffFuel: number
  taxiFuel: number
  blockFuel: number
  picExtra: number
  totalFuel: number
  tripTime: number
  contingencyTime: number
  alternateTime: number
  finalReserveTime: number
  totalTime: number
}

export interface WeightPlan {
  bew: number
  paxCount: number
  paxWeight: number
  cargoWeight: number
  payload: number
  zfw: number
  mzfw: number
  zfwRemaining: number
  tow: number
  mtow: number
  towRemaining: number
  law: number
  mlw: number
  lawRemaining: number
  fuelWeight: number
  maxFuel: number
  fuelRemaining: number
}

export interface AircraftPerfProfile {
  name: string
  icao: string
  oew: number
  mzfw: number
  mtow: number
  mlw: number
  maxRamp: number
  maxFuel: number
  paxMax: number
  paxAvgWeight: number
  bagAvgWeight: number
  cargoMax: number
  fuelFlowCruise: number
  fuelFlowClimb: number
  fuelFlowDescent: number
  fuelFlowTaxi: number
  fuelFlowHolding: number
  climbRate: number
  descentRate: number
  cruiseSpeed: number
  maxCruiseMach: number
  optimumFL: number
  v1Factor: number
  vrFactor: number
  v2Factor: number
}

export function calculateFuelPlan(
  distanceNm: number,
  altnDistanceNm: number,
  flightTimeMin: number,
  altnTimeMin: number,
  profile: AircraftPerfProfile,
): FuelPlan {
  const flightHours = flightTimeMin / 60
  const altnHours = altnTimeMin / 60

  const tripFuel = Math.round(distanceNm * (profile.fuelFlowCruise / profile.cruiseSpeed) * 1.05 + 350)
  const tripTime = flightTimeMin

  const contingencyFuel = Math.round(tripFuel * 0.05)
  const contingencyTime = 15

  const alternateFuel = Math.round(altnDistanceNm * (profile.fuelFlowCruise * 0.75 / profile.cruiseSpeed) + 200)
  const alternateTime = altnTimeMin

  const finalReserve = Math.round(profile.fuelFlowHolding * 0.5)
  const finalReserveTime = 30

  const minimumTakeoffFuel = tripFuel + contingencyFuel + alternateFuel + finalReserve

  const extraFuel = 0
  const takeoffFuel = minimumTakeoffFuel + extraFuel

  const taxiFuel = Math.round(profile.fuelFlowTaxi * (20 / 60))
  const taxiTime = 20

  const blockFuel = takeoffFuel + taxiFuel

  const picExtra = 0
  const totalFuel = blockFuel + picExtra

  return {
    tripFuel,
    contingencyFuel,
    alternateFuel,
    finalReserve,
    minimumTakeoffFuel,
    extraFuel,
    takeoffFuel,
    taxiFuel,
    blockFuel,
    picExtra,
    totalFuel,
    tripTime,
    contingencyTime,
    alternateTime,
    finalReserveTime,
    totalTime: tripTime + contingencyTime + alternateTime + finalReserveTime + taxiTime,
  }
}

export function calculateWeights(
  profile: AircraftPerfProfile,
  paxCount: number,
  cargoKg: number,
  blockFuel: number,
): WeightPlan {
  const bew = profile.oew
  const paxWeight = paxCount * (profile.paxAvgWeight + profile.bagAvgWeight)
  const cargoWeight = Math.min(cargoKg, profile.cargoMax)
  const payload = paxWeight + cargoWeight
  const zfw = bew + payload
  const tow = zfw + blockFuel
  const law = tow - 0
  const fuelWeight = blockFuel

  return {
    bew,
    paxCount,
    paxWeight,
    cargoWeight,
    payload: Math.round(payload / 1000 * 10) / 10,
    zfw: Math.round(zfw / 1000 * 10) / 10,
    mzfw: Math.round(profile.mzfw / 1000 * 10) / 10,
    zfwRemaining: Math.round((profile.mzfw - zfw) / 1000 * 10) / 10,
    tow: Math.round(tow / 1000 * 10) / 10,
    mtow: Math.round(profile.mtow / 1000 * 10) / 10,
    towRemaining: Math.round((profile.mtow - tow) / 1000 * 10) / 10,
    law: Math.round(law / 1000 * 10) / 10,
    mlw: Math.round(profile.mlw / 1000 * 10) / 10,
    lawRemaining: Math.round((profile.mlw - law) / 1000 * 10) / 10,
    fuelWeight: Math.round(fuelWeight / 1000 * 10) / 10,
    maxFuel: Math.round(profile.maxFuel / 1000 * 10) / 10,
    fuelRemaining: Math.round((profile.maxFuel - blockFuel) / 1000 * 10) / 10,
  }
}

export function calculateAlternateDistance(depIcao: string, arrIcao: string, altnIcao: string): number {
  if (!altnIcao) return 60
  return 60
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return `${h.toString().padStart(2, '0')}${m.toString().padStart(2, '0')}`
}

export function formatTimeHM(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return `${h}h ${m}m`
}

export function calculateFlightTime(distanceNm: number, cruiseSpeed: number, climbTimeMin: number, descentTimeMin: number): number {
  const cruiseDistance = Math.max(0, distanceNm - 100)
  const cruiseTime = (cruiseDistance / cruiseSpeed) * 60
  return Math.round(climbTimeMin + cruiseTime + descentTimeMin)
}
