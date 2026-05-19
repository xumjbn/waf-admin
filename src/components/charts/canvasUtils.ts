export function cssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

export function setupCanvas(
  cvs: HTMLCanvasElement,
  w: number,
  h: number,
): CanvasRenderingContext2D {
  const dpr = Math.max(1, window.devicePixelRatio || 1)
  cvs.width = w * dpr
  cvs.height = h * dpr
  cvs.style.width = `${w}px`
  cvs.style.height = `${h}px`
  const c = cvs.getContext('2d')!
  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  c.clearRect(0, 0, w, h)
  return c
}

export function hexA(input: string, a: number): string {
  if (input.startsWith('rgb')) {
    return input.replace(/rgba?\(([^)]+)\)/, (_, inner: string) => {
      const parts = inner
        .split(',')
        .map(s => s.trim())
        .slice(0, 3)
      return `rgba(${parts.join(',')},${a})`
    })
  }
  const h = input.replace('#', '')
  const expanded =
    h.length === 3
      ? h
          .split('')
          .map(x => x + x)
          .join('')
      : h
  const bigint = parseInt(expanded, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r},${g},${b},${a})`
}

export function roundRect(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  if (w < 2) w = 2
  const radius = Math.min(r, h / 2, w / 2)
  c.beginPath()
  c.moveTo(x + radius, y)
  c.lineTo(x + w - radius, y)
  c.quadraticCurveTo(x + w, y, x + w, y + radius)
  c.lineTo(x + w, y + h - radius)
  c.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  c.lineTo(x + radius, y + h)
  c.quadraticCurveTo(x, y + h, x, y + h - radius)
  c.lineTo(x, y + radius)
  c.quadraticCurveTo(x, y, x + radius, y)
}

export function drawSmoothPath(
  c: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  moveFirst = false,
): void {
  if (moveFirst) c.moveTo(pts[0].x, pts[0].y)
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i]
    const p1 = pts[i + 1]
    const xc = (p0.x + p1.x) / 2
    c.bezierCurveTo(xc, p0.y, xc, p1.y, p1.x, p1.y)
  }
}
