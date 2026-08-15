// 4-8 digits, numeric only — enforced wherever a PIN is set (create/reset/promote).
// Not enforced at login time, since older PINs must keep working if this rule ever changes.
export function isValidPin(pin: string): boolean {
  return /^\d{4,8}$/.test(pin)
}

export const PIN_PATTERN = "[0-9]{4,8}"
export const PIN_INVALID_MESSAGE = "PIN must be 4-8 digits"
