"server only"

import { PinataSDK } from "pinata"

export const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT || '',
  pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL || ''
})

// Helper function to check if Pinata is configured
export const isPinataConfigured = () => {
  return process.env.PINATA_JWT && process.env.PINATA_JWT !== 'your-pinata-jwt-here'
}