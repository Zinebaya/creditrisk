import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function cnStatus(status: string): string {
  const lowercaseStatus = String(status).toLowerCase()
  
  if (lowercaseStatus.includes('high')) {
    return 'bg-red-100 text-red-800'
  }
  if (lowercaseStatus.includes('low')) {
    return 'bg-green-100 text-green-800'
  }
  if (lowercaseStatus.includes('medium')) {
    return 'bg-yellow-100 text-yellow-800'
  }
  
  return 'bg-gray-100 text-gray-800'
}
