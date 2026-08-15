// 4-20 characters, letters and digits — enforced wherever a PIN is set (create/reset/promote).
// Not enforced at login time, since existing PINs must keep working if this rule ever changes.
export function isValidPin(pin: string): boolean {
  return /^[a-zA-Z0-9]{4,20}$/.test(pin)
}

export const PIN_PATTERN = "[a-zA-Z0-9]{4,20}"
export const PIN_MAX_LENGTH = 20
export const PIN_INVALID_MESSAGE = "PIN must be 4-20 letters/numbers"
