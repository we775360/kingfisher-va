import bcrypt from 'bcryptjs'

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12)
}

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

export const generatePilotId = (count: number): string => {
  const num = String(count + 1).padStart(4, '0')
  return `KFR${num}`
}

export const generateToken = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}