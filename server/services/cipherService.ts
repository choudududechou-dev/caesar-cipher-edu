/**
 * Caesar Cipher core algorithms
 * E(x) = (x + k) mod 26
 * D(x) = (x - k + 26) mod 26
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function encrypt(plaintext: string, shift: number): string {
  const k = ((shift % 26) + 26) % 26
  return plaintext
    .toUpperCase()
    .split('')
    .map((ch) => {
      const idx = ALPHABET.indexOf(ch)
      if (idx === -1) return ch // preserve non-alpha chars
      return ALPHABET[(idx + k) % 26]
    })
    .join('')
}

export function decrypt(ciphertext: string, shift: number): string {
  const k = ((shift % 26) + 26) % 26
  return ciphertext
    .toUpperCase()
    .split('')
    .map((ch) => {
      const idx = ALPHABET.indexOf(ch)
      if (idx === -1) return ch
      return ALPHABET[(idx - k + 26) % 26]
    })
    .join('')
}

export interface BruteforceResult {
  shift: number
  text: string
}

export function bruteforce(ciphertext: string): BruteforceResult[] {
  const results: BruteforceResult[] = []
  for (let shift = 1; shift <= 25; shift++) {
    results.push({
      shift,
      text: decrypt(ciphertext, shift),
    })
  }
  return results
}

export interface FrequencyResult {
  letter: string
  count: number
  percentage: number
}

export function frequencyAnalysis(text: string): FrequencyResult[] {
  const cleaned = text.toUpperCase().replace(/[^A-Z]/g, '')
  const total = cleaned.length

  return ALPHABET.split('').map((letter) => {
    const regex = new RegExp(letter, 'g')
    const count = (cleaned.match(regex) || []).length
    return {
      letter,
      count,
      percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
    }
  })
}

/**
 * Get the shift value from a cipher disk position (0-25)
 * where position 0 = A→A (no shift), position 1 = A→B (shift 1)
 */
export function diskPositionToShift(position: number): number {
  return ((position % 26) + 26) % 26
}

/**
 * Get the mapping table for a given shift
 */
export function getMappingTable(shift: number): Record<string, string> {
  const k = ((shift % 26) + 26) % 26
  const mapping: Record<string, string> = {}
  for (let i = 0; i < 26; i++) {
    mapping[ALPHABET[i]] = ALPHABET[(i + k) % 26]
  }
  return mapping
}
