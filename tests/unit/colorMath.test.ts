import { describe, it, expect } from 'vitest'
import {
  rgbToHSL, hslToRGB, rgbToHSV, hsvToRGB,
  rgbToLAB, labToRGB, rgbToHex, hexToRGB,
  ciede2000, gradeFromDeltaE, hueError, buildColorData,
} from '@/utils/colorMath'
import type { RGB, LAB } from '@/types'

// ── Hex round-trip ─────────────────────────────────────────────────────────
describe('hex conversions', () => {
  it('rgbToHex produces lowercase 6-char hex', () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000')
    expect(rgbToHex({ r: 0, g: 128, b: 255 })).toBe('#0080ff')
  })
  it('hexToRGB round-trips', () => {
    const rgb: RGB = { r: 123, g: 45, b: 200 }
    expect(hexToRGB(rgbToHex(rgb))).toEqual(rgb)
  })
})

// ── HSL round-trip ─────────────────────────────────────────────────────────
describe('HSL conversions', () => {
  const cases: RGB[] = [
    { r: 255, g: 0, b: 0 },
    { r: 0, g: 255, b: 0 },
    { r: 0, g: 0, b: 255 },
    { r: 128, g: 128, b: 128 },
    { r: 0, g: 0, b: 0 },
    { r: 255, g: 255, b: 255 },
  ]
  cases.forEach(rgb => {
    it(`round-trips rgb(${rgb.r},${rgb.g},${rgb.b})`, () => {
      const back = hslToRGB(rgbToHSL(rgb))
      expect(back.r).toBeCloseTo(rgb.r, -1)
      expect(back.g).toBeCloseTo(rgb.g, -1)
      expect(back.b).toBeCloseTo(rgb.b, -1)
    })
  })
})

// ── HSV round-trip ─────────────────────────────────────────────────────────
describe('HSV conversions', () => {
  it('round-trips red', () => {
    const rgb: RGB = { r: 255, g: 0, b: 0 }
    const back = hsvToRGB(rgbToHSV(rgb))
    expect(back).toEqual(rgb)
  })
  it('round-trips mid-tone', () => {
    const rgb: RGB = { r: 100, g: 150, b: 200 }
    const back = hsvToRGB(rgbToHSV(rgb))
    expect(Math.abs(back.r - rgb.r)).toBeLessThanOrEqual(1)
    expect(Math.abs(back.g - rgb.g)).toBeLessThanOrEqual(1)
    expect(Math.abs(back.b - rgb.b)).toBeLessThanOrEqual(1)
  })
})

// ── LAB round-trip ─────────────────────────────────────────────────────────
describe('LAB conversions', () => {
  it('white has L≈100', () => {
    const lab = rgbToLAB({ r: 255, g: 255, b: 255 })
    expect(lab.l).toBeCloseTo(100, 0)
  })
  it('black has L≈0', () => {
    const lab = rgbToLAB({ r: 0, g: 0, b: 0 })
    expect(lab.l).toBeCloseTo(0, 0)
  })
  it('round-trips mid-tone', () => {
    const rgb: RGB = { r: 120, g: 80, b: 200 }
    const back = labToRGB(rgbToLAB(rgb))
    expect(Math.abs(back.r - rgb.r)).toBeLessThanOrEqual(2)
    expect(Math.abs(back.g - rgb.g)).toBeLessThanOrEqual(2)
    expect(Math.abs(back.b - rgb.b)).toBeLessThanOrEqual(2)
  })
})

// ── CIEDE2000 ──────────────────────────────────────────────────────────────
// Reference values from Sharma et al. (2005) Table 1
describe('ciede2000', () => {
  it('identical colors → ΔE = 0', () => {
    const lab: LAB = { l: 50, a: 25, b: -20 }
    expect(ciede2000(lab, lab)).toBeCloseTo(0, 5)
  })

  it('white vs black → large ΔE', () => {
    const white = rgbToLAB({ r: 255, g: 255, b: 255 })
    const black = rgbToLAB({ r: 0, g: 0, b: 0 })
    expect(ciede2000(white, black)).toBeGreaterThan(90)
  })

  // Sharma 2005 pair 1
  it('Sharma pair 1', () => {
    const l1: LAB = { l: 50.0000, a: 2.6772, b: -79.7751 }
    const l2: LAB = { l: 50.0000, a: 0.0000, b: -82.7485 }
    expect(ciede2000(l1, l2)).toBeCloseTo(2.0425, 3)
  })

  // Sharma 2005 pair 2
  it('Sharma pair 2', () => {
    const l1: LAB = { l: 50.0000, a: 3.1571, b: -77.2803 }
    const l2: LAB = { l: 50.0000, a: 0.0000, b: -82.7485 }
    expect(ciede2000(l1, l2)).toBeCloseTo(2.8615, 3)
  })

  // Sharma 2005 pair 3
  it('Sharma pair 3', () => {
    const l1: LAB = { l: 50.0000, a: 2.8361, b: -74.0200 }
    const l2: LAB = { l: 50.0000, a: 0.0000, b: -82.7485 }
    expect(ciede2000(l1, l2)).toBeCloseTo(3.4412, 3)
  })

  it('symmetric', () => {
    const a: LAB = { l: 40, a: 20, b: -10 }
    const b: LAB = { l: 60, a: -5, b: 30 }
    expect(ciede2000(a, b)).toBeCloseTo(ciede2000(b, a), 8)
  })
})

// ── Grading ────────────────────────────────────────────────────────────────
describe('gradeFromDeltaE', () => {
  it('≤1 → perfect', () => expect(gradeFromDeltaE(0.5)).toBe('perfect'))
  it('≤3 → excellent', () => expect(gradeFromDeltaE(2)).toBe('excellent'))
  it('≤6 → good', () => expect(gradeFromDeltaE(5)).toBe('good'))
  it('≤10 → poor', () => expect(gradeFromDeltaE(8)).toBe('poor'))
  it('>10 → fail', () => expect(gradeFromDeltaE(15)).toBe('fail'))
})

// ── Hue error ──────────────────────────────────────────────────────────────
describe('hueError', () => {
  it('same hue → 0', () => expect(hueError(120, 120)).toBe(0))
  it('opposite hues → 180', () => expect(hueError(0, 180)).toBe(180))
  it('wraps correctly', () => expect(hueError(10, 350)).toBe(20))
  it('symmetric', () => expect(hueError(30, 90)).toBe(hueError(90, 30)))
})

// ── buildColorData ─────────────────────────────────────────────────────────
describe('buildColorData', () => {
  it('builds all fields', () => {
    const c = buildColorData({ r: 200, g: 100, b: 50 })
    expect(c.hex).toMatch(/^#[0-9a-f]{6}$/)
    expect(c.hsl.h).toBeGreaterThanOrEqual(0)
    expect(c.lab.l).toBeGreaterThan(0)
  })
})
