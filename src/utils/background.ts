import { hslToRGB, rgbToHex } from './colorMath'

export interface BackgroundOptions {
  level: number
  targetHex: string
  colorContrast: 'random' | 'similar'
  targetHue: number
}

function randomHex(): string {
  return rgbToHex({ r: Math.random() * 255 | 0, g: Math.random() * 255 | 0, b: Math.random() * 255 | 0 })
}

function similarHex(hue: number): string {
  const h = (hue + (Math.random() - 0.5) * 60 + 360) % 360
  const s = 40 + Math.random() * 40
  const l = 30 + Math.random() * 40
  return rgbToHex(hslToRGB({ h, s, l }))
}

function bgColor(opts: BackgroundOptions): string {
  return opts.colorContrast === 'similar' ? similarHex(opts.targetHue) : randomHex()
}

// Draw background onto a canvas element
export function drawBackground(canvas: HTMLCanvasElement, opts: BackgroundOptions): void {
  const ctx = canvas.getContext('2d')!
  const { width: W, height: H } = canvas

  switch (opts.level) {
    case 1: drawLevel1(ctx, W, H); break
    case 2: drawLevel2(ctx, W, H, opts); break
    case 3: drawLevel3(ctx, W, H, opts); break
    case 4: drawLevel4(ctx, W, H, opts); break
    case 5: drawLevel5(ctx, W, H, opts); break
    default: drawLevel1(ctx, W, H)
  }
}

function drawLevel1(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)
}

function drawLevel2(ctx: CanvasRenderingContext2D, W: number, H: number, opts: BackgroundOptions) {
  ctx.fillStyle = bgColor(opts)
  ctx.fillRect(0, 0, W, H)
}

function drawLevel3(ctx: CanvasRenderingContext2D, W: number, H: number, opts: BackgroundOptions) {
  ctx.fillStyle = bgColor(opts)
  ctx.fillRect(0, 0, W, H)
  const count = 8 + Math.random() * 8 | 0
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = bgColor(opts)
    const x = Math.random() * W, y = Math.random() * H
    const w = 40 + Math.random() * 120, h = 40 + Math.random() * 120
    if (Math.random() > 0.5) {
      ctx.fillRect(x, y, w, h)
    } else {
      ctx.beginPath()
      ctx.moveTo(x, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x - w / 2, y + h)
      ctx.closePath(); ctx.fill()
    }
  }
}

function drawLevel4(ctx: CanvasRenderingContext2D, W: number, H: number, opts: BackgroundOptions) {
  const imageData = ctx.createImageData(W, H)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.random() * 255 | 0
    data[i] = v; data[i + 1] = v; data[i + 2] = v; data[i + 3] = 255
  }
  ctx.putImageData(imageData, 0, 0)
  // Overlay tinted semi-transparent layer
  ctx.fillStyle = bgColor(opts) + '88'
  ctx.fillRect(0, 0, W, H)
}

function drawLevel5(ctx: CanvasRenderingContext2D, W: number, H: number, opts: BackgroundOptions) {
  // Ishihara-like: packed circles of similar hues
  ctx.fillStyle = bgColor(opts)
  ctx.fillRect(0, 0, W, H)
  const r = 12
  for (let x = 0; x < W; x += r * 1.8) {
    for (let y = 0; y < H; y += r * 1.8) {
      ctx.beginPath()
      ctx.arc(
        x + (Math.random() - 0.5) * r,
        y + (Math.random() - 0.5) * r,
        r * (0.5 + Math.random() * 0.7),
        0, Math.PI * 2,
      )
      ctx.fillStyle = bgColor(opts)
      ctx.fill()
    }
  }
}
