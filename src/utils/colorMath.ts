import type { RGB, HSL, HSV, LAB, ColorData, ScoreGrade } from '@/types'

// ── Gamma ──────────────────────────────────────────────────────────────────
function linearize(c: number): number {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}
function delinearize(c: number): number {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
  return Math.round(Math.max(0, Math.min(1, v)) * 255)
}

// ── RGB ↔ XYZ (D65) ────────────────────────────────────────────────────────
export function rgbToXYZ(rgb: RGB) {
  const r = linearize(rgb.r), g = linearize(rgb.g), b = linearize(rgb.b)
  return {
    x: 0.4124564 * r + 0.3575761 * g + 0.1804375 * b,
    y: 0.2126729 * r + 0.7151522 * g + 0.0721750 * b,
    z: 0.0193339 * r + 0.1191920 * g + 0.9503041 * b,
  }
}
export function xyzToRGB(xyz: { x: number; y: number; z: number }): RGB {
  const r = 3.2404542 * xyz.x - 1.5371385 * xyz.y - 0.4985314 * xyz.z
  const g = -0.9692660 * xyz.x + 1.8760108 * xyz.y + 0.0415560 * xyz.z
  const b = 0.0556434 * xyz.x - 0.2040259 * xyz.y + 1.0572252 * xyz.z
  return { r: delinearize(r), g: delinearize(g), b: delinearize(b) }
}

// ── XYZ ↔ LAB ──────────────────────────────────────────────────────────────
const D65 = { x: 0.95047, y: 1.00000, z: 1.08883 }
function fLab(t: number) { return t > 0.008856 ? Math.cbrt(t) : 7.787037 * t + 16 / 116 }
function fLabInv(t: number) { return t > 0.206897 ? t * t * t : (t - 16 / 116) / 7.787037 }

export function xyzToLAB(xyz: { x: number; y: number; z: number }): LAB {
  const fx = fLab(xyz.x / D65.x), fy = fLab(xyz.y / D65.y), fz = fLab(xyz.z / D65.z)
  return { l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) }
}
export function labToXYZ(lab: LAB) {
  const fy = (lab.l + 16) / 116
  return {
    x: D65.x * fLabInv(lab.a / 500 + fy),
    y: D65.y * fLabInv(fy),
    z: D65.z * fLabInv(fy - lab.b / 200),
  }
}

// ── RGB ↔ LAB ──────────────────────────────────────────────────────────────
export function rgbToLAB(rgb: RGB): LAB { return xyzToLAB(rgbToXYZ(rgb)) }
export function labToRGB(lab: LAB): RGB { return xyzToRGB(labToXYZ(lab)) }

// ── RGB ↔ HSL ──────────────────────────────────────────────────────────────
export function rgbToHSL(rgb: RGB): HSL {
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: l * 100 }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return { h: h * 360, s: s * 100, l: l * 100 }
}
export function hslToRGB(hsl: HSL): RGB {
  const h = hsl.h / 360, s = hsl.s / 100, l = hsl.l / 100
  if (s === 0) { const v = Math.round(l * 255); return { r: v, g: v, b: v } }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hue2rgb = (t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  return {
    r: Math.round(hue2rgb(h + 1 / 3) * 255),
    g: Math.round(hue2rgb(h) * 255),
    b: Math.round(hue2rgb(h - 1 / 3) * 255),
  }
}

// ── RGB ↔ HSV ──────────────────────────────────────────────────────────────
export function rgbToHSV(rgb: RGB): HSV {
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  const v = max
  const s = max === 0 ? 0 : d / max
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return { h: h * 360, s: s * 100, v: v * 100 }
}
export function hsvToRGB(hsv: HSV): RGB {
  const h = hsv.h / 60, s = hsv.s / 100, v = hsv.v / 100
  const i = Math.floor(h), f = h - i
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s)
  let r = 0, g = 0, b = 0
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break
    case 1: r = q; g = v; b = p; break
    case 2: r = p; g = v; b = t; break
    case 3: r = p; g = q; b = v; break
    case 4: r = t; g = p; b = v; break
    case 5: r = v; g = p; b = q; break
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
}

// ── Hex ────────────────────────────────────────────────────────────────────
export function rgbToHex(rgb: RGB): string {
  return '#' + [rgb.r, rgb.g, rgb.b].map(v => v.toString(16).padStart(2, '0')).join('')
}
export function hexToRGB(hex: string): RGB {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

// ── ColorData builder ──────────────────────────────────────────────────────
export function buildColorData(rgb: RGB): ColorData {
  return { rgb, hsv: rgbToHSV(rgb), hsl: rgbToHSL(rgb), lab: rgbToLAB(rgb), hex: rgbToHex(rgb) }
}

// Build from HSV — preserves hue/sat when value=0 or sat=0
export function buildColorDataFromHSV(hsv: HSV): ColorData {
  const rgb = hsvToRGB(hsv)
  return { rgb, hsv, hsl: rgbToHSL(rgb), lab: rgbToLAB(rgb), hex: rgbToHex(rgb) }
}

// ── CIEDE2000 ──────────────────────────────────────────────────────────────
export function ciede2000(lab1: LAB, lab2: LAB): number {
  const { l: L1, a: a1, b: b1 } = lab1
  const { l: L2, a: a2, b: b2 } = lab2

  const C1ab = Math.sqrt(a1 * a1 + b1 * b1)
  const C2ab = Math.sqrt(a2 * a2 + b2 * b2)
  const Cab = (C1ab + C2ab) / 2
  const Cab7 = Math.pow(Cab, 7)
  const G = 0.5 * (1 - Math.sqrt(Cab7 / (Cab7 + 6103515625))) // 25^7 = 6103515625

  const a1p = a1 * (1 + G), a2p = a2 * (1 + G)
  const C1p = Math.sqrt(a1p * a1p + b1 * b1)
  const C2p = Math.sqrt(a2p * a2p + b2 * b2)

  const h1p = toDeg(Math.atan2(b1, a1p))
  const h2p = toDeg(Math.atan2(b2, a2p))

  const dLp = L2 - L1
  const dCp = C2p - C1p

  let dhp = 0
  if (C1p * C2p !== 0) {
    const diff = h2p - h1p
    if (Math.abs(diff) <= 180) dhp = diff
    else if (diff > 180) dhp = diff - 360
    else dhp = diff + 360
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(toRad(dhp / 2))

  const Lbarp = (L1 + L2) / 2
  const Cbarp = (C1p + C2p) / 2

  let hbarp = h1p + h2p
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) <= 180) hbarp = (h1p + h2p) / 2
    else if (h1p + h2p < 360) hbarp = (h1p + h2p + 360) / 2
    else hbarp = (h1p + h2p - 360) / 2
  }

  const T = 1
    - 0.17 * Math.cos(toRad(hbarp - 30))
    + 0.24 * Math.cos(toRad(2 * hbarp))
    + 0.32 * Math.cos(toRad(3 * hbarp + 6))
    - 0.20 * Math.cos(toRad(4 * hbarp - 63))

  const SL = 1 + 0.015 * Math.pow(Lbarp - 50, 2) / Math.sqrt(20 + Math.pow(Lbarp - 50, 2))
  const SC = 1 + 0.045 * Cbarp
  const SH = 1 + 0.015 * Cbarp * T

  const Cbarp7 = Math.pow(Cbarp, 7)
  const RC = 2 * Math.sqrt(Cbarp7 / (Cbarp7 + 6103515625))
  const dTheta = 30 * Math.exp(-Math.pow((hbarp - 275) / 25, 2))
  const RT = -Math.sin(toRad(2 * dTheta)) * RC

  return Math.sqrt(
    Math.pow(dLp / SL, 2) +
    Math.pow(dCp / SC, 2) +
    Math.pow(dHp / SH, 2) +
    RT * (dCp / SC) * (dHp / SH),
  )
}

function toRad(deg: number) { return deg * Math.PI / 180 }
function toDeg(rad: number) { return (rad * 180 / Math.PI + 360) % 360 }

// ── Scoring ────────────────────────────────────────────────────────────────
export function gradeFromDeltaE(dE: number): ScoreGrade {
  if (dE <= 1) return 'perfect'
  if (dE <= 3) return 'excellent'
  if (dE <= 6) return 'good'
  if (dE <= 10) return 'poor'
  return 'fail'
}

// ── Hue angular error (0-180) ──────────────────────────────────────────────
export function hueError(h1: number, h2: number): number {
  const d = Math.abs(h1 - h2) % 360
  return d > 180 ? 360 - d : d
}

// ── Random color within range ──────────────────────────────────────────────
export function randomColorInRange(
  hueMin: number, hueMax: number,
  satMin: number, satMax: number,
  lightMin: number, lightMax: number,
): ColorData {
  const h = hueMin + Math.random() * (hueMax - hueMin)
  const s = satMin + Math.random() * (satMax - satMin)
  const l = lightMin + Math.random() * (lightMax - lightMin)
  return buildColorData(hslToRGB({ h, s, l }))
}

export function randomGrayscale(lightMin: number, lightMax: number): ColorData {
  const l = lightMin + Math.random() * (lightMax - lightMin)
  return buildColorData(hslToRGB({ h: 0, s: 0, l }))
}
