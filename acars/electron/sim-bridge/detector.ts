import { execSync } from 'node:child_process'
import { SimulatorType } from './types.js'

function isWindows(): boolean {
  return process.platform === 'win32'
}

function findProcess(name: string): boolean {
  if (!isWindows()) return false
  try {
    const stdout = execSync(`tasklist /NH /FO CSV /FI "IMAGENAME eq ${name}"`, {
      encoding: 'utf-8',
      timeout: 3000,
      stdio: ['pipe', 'pipe', 'ignore'],
    })
    return stdout.includes(name)
  } catch {
    return false
  }
}

export function detectSimulatorsRunning(): SimulatorType[] {
  if (!isWindows()) return []

  const detected: SimulatorType[] = []

  if (findProcess('FlightSimulator.exe')) detected.push(SimulatorType.MSFS2020)
  if (findProcess('FlightSimulator2024.exe')) detected.push(SimulatorType.MSFS2024)
  if (findProcess('Prepar3D.exe')) detected.push(SimulatorType.P3Dv5)
  if (findProcess('fsx.exe')) detected.push(SimulatorType.FSX)
  if (findProcess('fsx-se.exe')) detected.push(SimulatorType.FSX_SE)
  if (findProcess('X-Plane.exe')) {
    detected.push(SimulatorType.XP12)
    detected.push(SimulatorType.XP11)
  }

  return detected
}

export function detectBestSimulator(): SimulatorType {
  const running = detectSimulatorsRunning()
  if (running.length > 0) return running[0]
  return SimulatorType.UNKNOWN
}
